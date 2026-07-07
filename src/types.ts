/** Payload passed to each notification provider. */
export interface NotificationPayload {
  /** Main notification text (required). */
  message: string;
  /** Optional title displayed above the message. */
  title?: string;
  /** Optional subtitle or second line. */
  subtitle?: string;
  /** Arbitrary metadata key-value pairs for providers that support them. */
  metadata?: Record<string, string>;
}

/** Result returned by a provider after attempting to send a notification. */
export interface SendResult {
  /** Whether the notification was sent successfully. */
  success: boolean;
  /** The unique id of the provider that produced this result. */
  providerId: string;
  /** Error message if success is false. */
  error?: string;
}

/** Typed config for a single provider entry in the YAML. */
export interface ProviderEntry {
  enabled: boolean;
  [key: string]: unknown;
}

/** Visual style configuration for the floating window notification. */
export interface NotificationStyle {
  /** Font size in points (default 9). */
  fontSize?: number;
  /** Background color in hex (default "#323232"). */
  bgColor?: string;
  /** Text color in hex (default "#ffffff"). */
  textColor?: string;
  /** Window opacity 0-1 (default 0.95). */
  opacity?: number;
  /** Display duration in seconds (default 4). */
  duration?: number;
  /** Screen corner position (default "bottom-right"). */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Play notification sound (default false). */
  sound?: boolean;
  /** Font family name (default "Microsoft YaHei"). */
  fontFamily?: string;
  /** Window width in pixels (default 340). */
  width?: number;
  /** Window height in pixels (default auto from fontSize * 5.5). */
  height?: number;
}

/** Top-level config shape. */
export interface Config {
  /** Detection mode: 'hook' (Claude Code hook) or 'wrapper' (process wrapper). */
  mode: 'hook' | 'wrapper';
  /** Seconds of inactivity before firing notification in wrapper mode (default 3). */
  idleTimeout?: number;
  /** Per-provider enable/disable settings. */
  providers: Record<string, ProviderEntry>;
  /** Provider-specific configuration values. */
  providersConfig?: Record<string, Record<string, unknown>>;
  /** Visual style for floating window notifications. */
  style?: NotificationStyle;
}

/** Result of an engine dispatch call. */
export interface DispatchResult {
  /** Overall success (true if at least one provider succeeded). */
  success: boolean;
  /** Per-provider results. */
  results: SendResult[];
}
