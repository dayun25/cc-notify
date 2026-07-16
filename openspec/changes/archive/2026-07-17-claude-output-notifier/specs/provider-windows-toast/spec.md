## ADDED Requirements

### Requirement: Provider displays Windows Toast notification

The Windows Toast notification provider SHALL display a native Windows toast notification when `send()` is called, using the Windows notification platform APIs.

#### Scenario: Basic notification displayed
- **WHEN** provider `send()` is called with a payload containing `{ message: "Task complete", title?: "Claude Code" }`
- **THEN** a Windows toast notification SHALL appear in the Windows Action Center
- **THEN** the notification SHALL display the title and message text

#### Scenario: Notification with custom title
- **WHEN** provider `send()` is called with a payload containing a custom `title` field
- **THEN** the toast notification SHALL display the custom title instead of the default

#### Scenario: Notification on systems without toast support
- **WHEN** provider `send()` is called on a system that does not support Windows toast notifications
- **THEN** provider SHALL throw or return an error indicating the platform limitation
- **THEN** provider SHALL NOT crash the engine

### Requirement: Provider respects configuration settings

The Windows Toast provider SHALL read configuration from the config system before sending notifications and respect user preferences.

#### Scenario: Sound enabled
- **WHEN** provider config has `sound: true`
- **THEN** the toast notification SHALL play the default notification sound

#### Scenario: Sound disabled
- **WHEN** provider config has `sound: false`
- **THEN** the toast notification SHALL NOT play any sound

#### Scenario: Short duration
- **WHEN** provider config has `duration: "short"`
- **THEN** the toast notification SHALL use short duration (default Windows behavior)

#### Scenario: Long duration
- **WHEN** provider config has `duration: "long"`
- **THEN** the toast notification SHALL remain visible for an extended period (scenario-specific, e.g., for long-running tasks)

### Requirement: Provider uses configurable app name and icon

The Windows Toast provider SHALL use the configured app name and icon for the notification source attribution.

#### Scenario: Default app name used
- **WHEN** provider initializes without custom app name in config
- **THEN** provider SHALL use "Claude Code Notifier" as the default app name

#### Scenario: Custom app name configured
- **WHEN** provider config specifies `app_name: "My Claude"` 
- **THEN** the toast notification SHALL show "My Claude" as the notification source

### Requirement: Provider supports notification click behavior

When the user clicks on the toast notification, the terminal window that initiated the notification SHALL be brought to focus (if supported by the platform).

#### Scenario: Notification clicked
- **WHEN** user clicks on the toast notification
- **THEN** the system SHALL attempt to focus the originating terminal window
- **THEN** if the originating terminal cannot be focused, no error SHALL be raised

### Requirement: Provider supports enable/disable via config

The provider SHALL check whether it is enabled in the configuration before attempting to send a notification. If disabled, it SHALL be skipped silently by the engine.

#### Scenario: Provider enabled
- **WHEN** provider has `enabled: true` in config
- **THEN** provider SHALL be included in the engine's dispatch list
- **THEN** provider SHALL attempt to send the notification

#### Scenario: Provider disabled
- **WHEN** provider has `enabled: false` in config
- **THEN** provider SHALL NOT be included in the engine's dispatch list
- **THEN** provider SHALL NOT send any notification
