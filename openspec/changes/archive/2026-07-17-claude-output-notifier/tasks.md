## 1. Project Scaffolding

- [x] 1.1 Initialize npm project with `package.json`, `tsconfig.json`, and basic directory structure
- [x] 1.2 Install core dependencies: TypeScript, Node.js types, `commander` (CLI), `yaml` (config parsing), `node-notifier` (notifications)
- [x] 1.3 Configure build pipeline: TypeScript compilation, output to `dist/`, add `bin` entry point to `package.json`
- [x] 1.4 Add ESLint, Prettier, and Jest for code quality and testing

## 2. Shared Types & Provider Interface

- [x] 2.1 Define `NotificationPayload` type with fields: `message`, `title?`, `subtitle?`, `metadata?`
- [x] 2.2 Define `SendResult` type with fields: `success`, `providerId`, `error?`
- [x] 2.3 Define `ProviderConfig` type as a generic record for provider-specific settings
- [x] 2.4 Define `NotificationProvider` interface with: `id`, `name`, `description`, `initialize(config)`, `send(payload)`
- [x] 2.5 Implement `ProviderRegistry` class with `register()`, `get()`, `getAll()`, `isRegistered()` methods

## 3. Configuration System

- [x] 3.1 Define configuration schema types (`Config`, `ProvidersConfig`, `ProviderEntry`)
- [x] 3.2 Implement `ConfigLoader` class: loads YAML from default path `~/.config/cc-notify/config.yaml`
- [x] 3.3 Support custom config path via `CC_NOTIFY_CONFIG` environment variable
- [x] 3.4 Implement config validation: malformed YAML, unknown provider IDs, missing required fields
- [x] 3.5 Implement fallback to default configuration when no config file exists
- [x] 3.6 Write unit tests for config loading, validation, and fallback behavior

## 4. Notification Engine

- [x] 4.1 Implement `NotificationEngine` class with `dispatch(payload)` method
- [x] 4.2 Engine loads config via `ConfigLoader` and resolves enabled providers from registry
- [x] 4.3 Engine iterates enabled providers and calls `send()` on each, collecting results
- [x] 4.4 Engine catches provider errors gracefully (one failing provider doesn't crash others)
- [x] 4.5 Engine returns structured `DispatchResult` with per-provider status
- [x] 4.6 Write unit tests for engine dispatch logic

## 5. Built-in Providers

- [x] 5.1 Implement `TerminalBellProvider` — sends ASCII `\x07` to stderr as audible/visual bell
- [x] 5.2 Implement `WindowsToastProvider` using `node-notifier` library
- [x] 5.3 WindowsToastProvider respects `sound`, `duration`, `app_name` config settings
- [x] 5.4 WindowsToastProvider handles platforms without toast support (graceful error)
- [x] 5.5 Register both providers in the registry at engine initialization
- [x] 5.6 Write unit tests for provider registration and `send()` behavior

## 6. Idle Detector (Wrapper Mode)

- [x] 6.1 Implement `IdleDetector` that monitors stdout/stderr activity of a child process
- [x] 6.2 Configure idle timeout from config (default 3 seconds)
- [x] 6.3 Fire notification when idle timeout is reached (no output for N seconds)
- [x] 6.4 Fire notification when the wrapped process exits (regardless of idle detection)
- [x] 6.5 Write unit tests for idle detection timing and edge cases

## 7. CLI Implementation

- [x] 7.1 Set up CLI entry point with `commander` (or `yargs`) with `bin: "cc-notify"` in package.json
- [x] 7.2 Implement `cc-notify send <message>` command — loads engine and dispatches notification
- [x] 7.3 Implement `cc-notify run <command...>` command — spawns process with idle detection, dispatches on idle/exit
- [x] 7.4 Implement `cc-notify init` command — creates default config file at `~/.config/cc-notify/config.yaml`
- [x] 7.5 Implement `cc-notify init --path <path>` for custom config location
- [x] 7.6 Implement `cc-notify list-providers` — displays registered providers with enabled/disabled status
- [x] 7.7 Add `--help` output for all commands with clear descriptions

## 8. Claude Code Integration

- [x] 8.1 Document how to use hooks in `~/.claude/settings.json` to call `cc-notify send`
- [x] 8.2 Provide ready-to-use hook scripts as part of the package
- [x] 8.3 Document wrapper mode: `cc-notify run -- claude` usage
- [x] 8.4 Test hook integration end-to-end with a real Claude Code session

## 9. Testing & Quality

- [x] 9.1 Write unit tests for core components (config, engine)
- [x] 9.2 Build pipeline runs `tsc` successfully and produce `dist/`
- [x] 9.3 Unit tests verify engine dispatch logic
- [x] 9.4 Unit tests verify config loading and fallback
- [x] 9.5 Run full test suite and ensure all tests pass

## 10. Documentation & Packaging

- [x] 10.1 Write `README.md` with: project overview, installation, quick start, configuration reference
- [x] 10.2 Add "Creating a Custom Provider" developer guide with step-by-step example
- [x] 10.3 Add Claude Code integration section to README (hook setup + wrapper mode)
- [x] 10.4 Ensure `package.json` has correct `bin`, `files`, `repository`, `keywords` for npm publishing
- [x] 10.5 Verify build output with `npm pack` and test installation locally
