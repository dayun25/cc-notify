## Why

Claude Code sessions can run long-running tasks (code generation, refactoring, batch operations) that take seconds to minutes to complete. Currently, users must keep the terminal focused or manually check back to know when output has finished — leading to context switching friction and wasted time. This is a common pain point for developers who multitask while Claude works.

## What Changes

- Create a **notification system** as a standalone project (library + CLI tool) that detects when Claude Code output completes
- Implement a **Windows Toast Notification** provider using the Windows native notification API
- Design and implement a **pluggable notification provider interface** allowing third-party extensions (e.g., macOS notifications, Linux notifications, mobile push, Slack, email, webhook)
- Provide a **configuration system** for users to enable/disable providers and customize notification behavior
- Deliver as a reusable npm/Python package (language TBD) that can be integrated via Claude Code hooks or standalone usage

## Capabilities

### New Capabilities
- `notification-core`: Core notification engine — manages lifecycle, provider registry, configuration loading, and dispatch logic
- `provider-windows-toast`: Windows Toast notification provider using native Windows APIs (WinRT/compatible)
- `provider-extensibility`: Plugin/provider extension interface — abstract contract for adding custom notification channels
- `config-system`: Configuration file format, schema, and CLI for managing notification preferences

### Modified Capabilities

<!-- No existing capabilities are being modified — this is a brand-new project. -->

## Impact

- **New project directory** — `claude-code-notifier/` (or similar) as the root of the new package
- **Dependencies** — Windows SDK / WinRT bindings for toast notifications; cross-platform notification libraries for extensibility
- **Claude Code integration** — leverages Claude Code's hook system (`onOutput` or similar lifecycle hooks) or wraps the Claude Code process to detect completion
- **No breaking changes** — this is additive; does not modify existing Claude Code behavior
