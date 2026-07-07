## ADDED Requirements

### Requirement: Engine dispatches notifications to enabled providers

The notification engine SHALL iterate over all enabled providers from the loaded configuration and call each provider's `send()` method with the notification payload.

#### Scenario: Dispatch to single enabled provider
- **WHEN** engine receives a notification trigger and exactly one provider is enabled in config
- **THEN** engine SHALL call `send()` on that provider only
- **THEN** engine SHALL return success

#### Scenario: Dispatch to multiple enabled providers
- **WHEN** engine receives a notification trigger and multiple providers are enabled in config
- **THEN** engine SHALL call `send()` on each enabled provider
- **THEN** engine SHALL return a result containing each provider's status

#### Scenario: No providers enabled
- **WHEN** engine receives a notification trigger but no providers are enabled in config
- **THEN** engine SHALL NOT call any provider
- **THEN** engine SHALL log a warning indicating no notification was sent

#### Scenario: Provider send fails
- **WHEN** engine calls a provider's `send()` method and the provider throws or returns an error
- **THEN** engine SHALL catch the error and continue dispatching to remaining providers
- **THEN** engine SHALL log the error for the failed provider

### Requirement: Engine uses configuration from config system

The notification engine SHALL load and validate configuration using the config module before dispatching notifications.

#### Scenario: Config loads successfully
- **WHEN** engine starts and the config file exists and is valid
- **THEN** engine SHALL parse the config and use it to determine which providers to enable

#### Scenario: Config file not found
- **WHEN** engine starts and the config file does not exist
- **THEN** engine SHALL use default configuration (terminal-bell provider enabled only, with default settings)

#### Scenario: Invalid config
- **WHEN** engine starts and the config file is malformed or fails validation
- **THEN** engine SHALL log an error with details of the validation failure
- **THEN** engine SHALL fall back to default configuration

### Requirement: Engine provides a stable public API

The core notification engine SHALL expose a public API that can be called both from the CLI handler and programmatically by other Node.js modules.

#### Scenario: CLI calls engine API
- **WHEN** user runs `cc-notify send "message"` via CLI
- **THEN** the CLI handler SHALL call the engine's dispatch function with the provided message
- **THEN** engine SHALL process and dispatch to all enabled providers

#### Scenario: Programmatic usage
- **WHEN** a Node.js module imports the engine and calls `dispatch({ message: "done" })`
- **THEN** engine SHALL process and dispatch to all enabled providers
- **THEN** engine SHALL return a Promise resolving to dispatch results

### Requirement: Engine reports dispatch results

The engine SHALL return a structured result object after dispatching, indicating per-provider status.

#### Scenario: Success with results
- **WHEN** engine completes dispatching to all enabled providers
- **THEN** engine SHALL return an object containing `{ success: boolean, results: Array<{ providerId: string, success: boolean, error?: string }> }`
