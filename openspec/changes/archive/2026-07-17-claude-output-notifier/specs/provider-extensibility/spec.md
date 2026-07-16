## ADDED Requirements

### Requirement: Define a stable Provider interface

The system SHALL define a public `NotificationProvider` interface that any notification provider MUST implement to be compatible with the engine.

#### Scenario: Interface contract
- **WHEN** a provider module exports an object conforming to the `NotificationProvider` interface
- **THEN** the engine SHALL accept and invoke it alongside built-in providers
- **THEN** the interface SHALL include: `id: string`, `name: string`, `description: string`, `initialize(config): Promise<void>`, `send(notification): Promise<SendResult>`

#### Scenario: Required interface members
- **WHEN** a module claims to be a `NotificationProvider`
- **THEN** it MUST implement all required members of the interface
- **THEN** TypeScript compilation SHALL fail if any required member is missing

### Requirement: Provider Registry supports registration

The system SHALL maintain a provider registry that allows providers to be registered at initialization time, supporting both built-in and external providers.

#### Scenario: Register built-in provider
- **WHEN** the engine initializes
- **THEN** built-in providers (Windows Toast, Terminal Bell) SHALL be automatically registered in the registry

#### Scenario: Register external provider programmatically
- **WHEN** an external module calls `registry.register(myProvider)`
- **THEN** the provider SHALL be added to the internal provider map
- **THEN** the provider SHALL be available for enable/disable and dispatch

#### Scenario: Duplicate provider ID
- **WHEN** a provider is registered with an `id` that is already registered
- **THEN** the registry SHALL overwrite the existing provider with the new one
- **THEN** a warning SHALL be logged

### Requirement: Third-party providers via npm packages (v1)

In v1, third-party providers SHALL be installable as npm packages that users import and register programmatically or via configuration.

#### Scenario: Provider installed as npm dependency
- **WHEN** a user installs `@cc-notify/provider-slack` as an npm dependency
- **THEN** the user SHALL be able to configure it in `config.yaml` under a custom provider section
- **THEN** the engine SHALL load and register the package when configured

### Requirement: Provider interface documentation

The project SHALL include documentation explaining how to create a custom notification provider, including a complete example.

#### Scenario: Provider development guide exists
- **WHEN** a developer wants to create a custom provider
- **THEN** they SHALL find a "Creating a Custom Provider" section in the project README
- **THEN** the guide SHALL include a step-by-step example implementing a simple provider (e.g., HTTP webhook)

### Requirement: Terminal Bell fallback provider

The system SHALL include a built-in Terminal Bell provider that writes the ASCII bell character (`\x07`) to stdout as a minimal notification fallback.

#### Scenario: Terminal bell provider registered
- **WHEN** engine initializes
- **THEN** a provider with id `terminal-bell` SHALL be automatically registered

#### Scenario: Terminal bell sends notification
- **WHEN** `terminal-bell` provider's `send()` is called
- **THEN** it SHALL output the ASCII bell character (`\x07`) to stderr
- **THEN** it SHALL return a success result
