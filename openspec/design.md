## Context

Claude Code runs as an interactive CLI process in the terminal. When users submit long-running tasks, they must manually monitor the terminal to know when Claude has finished responding. There is no built-in mechanism to notify users via OS-level notifications when a response completes.

The project aims to fill this gap by creating a lightweight notification system that detects Claude Code output completion and dispatches notifications through a pluggable provider architecture.

**Key constraints:**
- Must work on Windows (primary target) with native toast notifications
- Must be extensible for future notification channels (macOS, Linux, mobile, etc.)
- Should integrate with Claude Code's existing hook system where possible
- Must be simple to configure and unintrusive

## Goals / Non-Goals

**Goals:**
- Detect when Claude Code finishes generating a response in the terminal
- Dispatch notifications to all enabled providers when completion is detected
- Provide a built-in Windows Toast notification provider using native Windows APIs
- Define a clean, documented provider interface for third-party extensions
- Provide a simple configuration system (file-based, with optional CLI for management)
- Support both Claude Code hook integration and standalone wrapper usage
- Lightweight — minimal resource usage when idle (no polling overhead)

**Non-Goals:**
- Not a full Claude Code wrapper or replacement
- Not modifying Claude Code internals
- No cloud backend or user accounts
- No notification history or persistence (fire-and-forget)
- No complex scheduling or smart notification filtering (v1)

## Decisions

### Decision 1: Language & Runtime — TypeScript / Node.js

**Choice:** TypeScript, targeting Node.js runtime.

**Rationale:**
- Claude Code itself is a Node.js application — using the same runtime makes integration natural
- TypeScript interfaces provide excellent contract definition for the provider plugin system
- Rich npm ecosystem for CLI tools, config parsing, and process management
- Cross-platform by nature (even though v1 focuses on Windows)
- Claude Code hooks (`beforeCommand`/`afterCommand`) are Bash/Node.js based

**Alternatives considered:**
- **Rust** — better performance but higher development overhead and less natural Claude Code hook integration
- **Python** — good ecosystem but Claude Code hooks are Bash/Node oriented; less natural fit
- **Go** — single binary is appealing, but plugin system less flexible

### Decision 2: Output Completion Detection — Hybrid Approach

**Choice:** Support two detection modes:
1. **Hook mode** — Claude Code's `afterCommand` hook → triggers after each Claude response
2. **Wrapper/CLI mode** — pipe/wrap Claude Code process, detect when stdout/stderr goes idle for N seconds, then notify

**Rationale:**
- Hook mode is lightweight and precise (fires exactly when Claude finishes)
- Wrapper mode works without modifying Claude Code configuration
- Hybrid approach gives users flexibility

**Details for Hook mode:**
- Claude Code settings supports `afterCommand` hook (configured in `~/.claude/settings.json`)
- After each Claude response, the hook script invokes `cc-notify send "Claude Code response complete"`
- The `cc-notify` CLI reads the config, checks if hook-triggered notification is enabled, and dispatches

**Details for Wrapper mode:**
- `cc-notify run [claude args...]` — wraps Claude Code execution
- Monitors stdout/stderr activity
- After activity ceases for a configurable idle timeout (default: 3s), fires notification
- Also fires on process exit (regardless of idle detection)

### Decision 3: Provider Architecture — Synchronous Plugin Registry

**Choice:** In-process provider registry with a static interface. Providers implement a `NotificationProvider` interface and register themselves. Config-driven enable/disable.

```typescript
interface NotificationProvider {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  initialize(config: ProviderConfig): Promise<void>;
  send(notification: NotificationPayload): Promise<SendResult>;
}
```

**Rationale:**
- Simple, type-safe, and easy to understand
- No IPC or subprocess overhead for notification dispatch
- Easy to add new providers (just implement the interface and register)
- Configuration keys map directly to provider IDs

**Third-party extensibility:**
- v1: Providers ship as npm packages that users install alongside `cc-notify`
- Providers are discovered via a convention (e.g., `@cc-notify/provider-*` namespace in node_modules)
- v1 documentation will include a "Creating a Custom Provider" guide

### Decision 4: Windows Toast Implementation

**Choice:** Use the `node-notifier` library for Windows toast support, with option to also support raw WinRT calls via `@napi-rs/snore-toast` or similar.

**Rationale:**
- `node-notifier` wraps native Windows toast/snarl notifications and is well-tested
- Falls back gracefully on systems without toast support
- Can be supplemented with a dedicated SnoreToast binary for richer notifications
- Cross-platform compatible (handles macOS/Linux too if providers need it)

**For production quality:** Use `@napi-rs/snore-toast` (Rust-based native module) for native Windows toast with better reliability. The provider abstraction means this can be swapped without affecting the rest of the system.

### Decision 5: Configuration Format

**Choice:** YAML-based config file at `~/.config/cc-notify/config.yaml` with optional `cc-notify init` CLI command to create/modify.

```yaml
# ~/.config/cc-notify/config.yaml
mode: hook            # "hook" | "wrapper"
idle_timeout: 3       # seconds (wrapper mode only)

providers:
  windows-toast:
    enabled: true
    title: "Claude Code"
    sound: true
    duration: short   # short | long

providers_config:
  windows-toast:
    app_name: "Claude Code Notifier"
    icon: "default"
```

**Rationale:**
- YAML is human-readable and self-documenting
- Simple to hand-edit or manage via CLI
- Nested structure cleanly separates provider configs
- Can support `$schema` for editor autocompletion

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                   CLI Entry Point                        │
│  cc-notify send "msg"    cc-notify run claude ...       │
│  cc-notify init           cc-notify list-providers      │
└─────┬────────────────────────┬─────────────────────────┘
      │                        │
      ▼                        ▼
┌──────────────┐    ┌──────────────────────────┐
│  Send Command │    │   Run Command (Wrapper)   │
│  (hook mode)  │    │   - Spawn claude process  │
│               │    │   - Monitor stdout/stderr  │
│               │    │   - Detect idle / exit     │
└──────┬───────┘    └──────────┬─────────────────┘
       │                       │
       └───────────┬───────────┘
                   ▼
       ┌──────────────────────┐
       │   NotificationEngine  │
       │   - Loads config      │
       │   - Resolves enabled  │
       │     providers         │
       │   - Dispatches to all │
       └──────┬───────────────┘
              │
      ┌───────┼───────────┐
      │       │           │
      ▼       ▼           ▼
┌────────┐ ┌────────┐ ┌──────────┐
│Windows │ │Terminal│ │ Ext.     │
│Toast   │ │Bell    │ │ Provider │
│Provider│ │Provider│ │ (plugin) │
└────────┘ └────────┘ └──────────┘
              │
              ▼
      ┌──────────────┐
      │  Provider     │
      │  Discovery    │
      │  (npm scan)   │
      └──────────────┘
```

**Data flow:**
1. A trigger event occurs (hook callback or wrapper idle-detect)
2. `cc-notify send <message>` or internal dispatch is called
3. `NotificationEngine` loads `~/.config/cc-notify/config.yaml`
4. Engine iterates over enabled providers in config
5. Each enabled provider's `send()` method is called with the notification payload
6. Provider handles platform-specific notification display
7. Results are collected and logged (warnings on failure, no crash)

## Project Structure

```
cc-notify/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                  # Entry point / CLI
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── send.ts           # cc-notify send <message>
│   │   │   ├── run.ts            # cc-notify run <command>
│   │   │   ├── init.ts           # cc-notify init (create config)
│   │   │   └── list-providers.ts # cc-notify list-providers
│   │   └── cli.ts                # CLI setup (commander/yargs)
│   ├── engine/
│   │   ├── notification-engine.ts # Core dispatch logic
│   │   └── config.ts             # Config loading + validation
│   ├── providers/
│   │   ├── interface.ts          # NotificationProvider interface
│   │   ├── registry.ts           # Provider registry
│   │   ├── windows-toast.ts      # Windows Toast provider
│   │   └── terminal-bell.ts      # Terminal bell (fallback)
│   ├── detector/
│   │   └── idle-detector.ts      # Wrapper mode idle detection
│   └── types.ts                  # Shared types
├── specs/                        # Specification files
├── tests/
│   ├── unit/
│   └── integration/
└── README.md
```

## Risks / Trade-offs

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `afterCommand` hook fires too frequently (after every chunk, not full response) | Medium | Verify hook behavior during development; implement debouncing in hook mode |
| Windows toast notification fails silently on some systems | Medium | Always have terminal-bell provider as fallback; log errors to stderr |
| Wrapper mode idle detection false-positives (notifies while Claude is still thinking) | Low | Conservative idle timeout default (3s); require sustained inactivity, not just a pause |
| Node.js dependency adds ~50-100MB for notification CLI | Medium | Consider bundling with `pkg` or `esbuild` for standalone binary in v2 |
| Third-party plugin discovery via npm is complex | Low | v1 focuses on built-in providers; plugin system is defined but semi-automatic in v1; full auto-discovery in v2 |

## Open Questions

- Does Claude Code's `afterCommand` hook fire after each complete response, or after each chunk? (Investigate during implementation)
- What's the best approach for Windows toast on systems without `notify-send` equivalent? SnoreToast binary bundling?
- Should we support environment-variable-based config override (e.g., `CC_NOTIFY_DISABLE=1`)?
- What message should the notification show? Just "Claude Code response complete" or include summary info?
