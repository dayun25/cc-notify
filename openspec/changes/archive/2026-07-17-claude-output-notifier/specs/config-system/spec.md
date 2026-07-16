## ADDED Requirements

### Requirement: Configuration file format

The system SHALL support a YAML-based configuration file located at `~/.config/cc-notify/config.yaml`.

#### Scenario: Default config path
- **WHEN** engine starts and no explicit config path is provided
- **THEN** engine SHALL look for config at `~/.config/cc-notify/config.yaml`
- **THEN** if found, the config SHALL be parsed and applied

#### Scenario: Custom config path via environment variable
- **WHEN** the environment variable `CC_NOTIFY_CONFIG` is set to a custom path
- **THEN** engine SHALL read config from the custom path instead of the default

#### Scenario: Config file does not exist
- **WHEN** the config file path does not exist
- **THEN** engine SHALL use default configuration settings
- **THEN** engine SHALL log a message indicating no config file was found

### Requirement: Configuration schema

The configuration SHALL follow a defined schema with support for detection mode, idle timeout, and per-provider settings.

#### Scenario: Mode configuration
- **WHEN** config contains `mode: "hook"` or `mode: "wrapper"`
- **THEN** engine SHALL use the specified detection mode

#### Scenario: Per-provider enable/disable
- **WHEN** config contains `providers.<provider-id>.enabled: true`
- **THEN** that provider SHALL be included in dispatch
- **WHEN** config contains `providers.<provider-id>.enabled: false`
- **THEN** that provider SHALL be excluded from dispatch

#### Scenario: Provider-specific settings
- **WHEN** config contains a `providers_config.<provider-id>` section
- **THEN** the provider SHALL receive those settings during its `initialize()` call
- **THEN** provider SHALL apply the settings

### Requirement: CLI command to initialize config

The system SHALL provide a `cc-notify init` CLI command that creates a default configuration file interactively.

#### Scenario: Init creates default config
- **WHEN** user runs `cc-notify init` and no config file exists
- **THEN** a new config file SHALL be created at the default path with sensible defaults
- **THEN** the terminal SHALL display a success message with the config path

#### Scenario: Init with existing config
- **WHEN** user runs `cc-notify init` and a config file already exists
- **THEN** the system SHALL ask for confirmation before overwriting
- **THEN** if confirmed, the existing file SHALL be backed up with a `.bak` suffix

#### Scenario: Init with --path flag
- **WHEN** user runs `cc-notify init --path /custom/path/config.yaml`
- **THEN** the config file SHALL be created at the specified path

### Requirement: CLI command to list providers

The system SHALL provide a `cc-notify list-providers` CLI command that displays all registered providers and their enabled/disabled status.

#### Scenario: List providers
- **WHEN** user runs `cc-notify list-providers`
- **THEN** output SHALL list all registered provider IDs, names, and enabled status
- **THEN** output SHALL be formatted as a readable table

### Requirement: Validation on config load

The config system SHALL validate the configuration file on load and report any issues.

#### Scenario: Valid config loads normally
- **WHEN** config file contains valid YAML matching the expected schema
- **THEN** config SHALL parse successfully
- **THEN** engine SHALL use the parsed config

#### Scenario: Malformed YAML
- **WHEN** config file contains invalid YAML syntax
- **THEN** system SHALL log a parse error with file path and line number
- **THEN** system SHALL fall back to default configuration

#### Scenario: Unknown provider ID in config
- **WHEN** config enables a provider ID that is not registered
- **THEN** engine SHALL log a warning with the unknown provider ID
- **THEN** engine SHALL skip the unknown provider and continue
