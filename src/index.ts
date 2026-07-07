/**
 * cc-notify — Claude Code completion notifier.
 *
 * Public API for programmatic use.
 */

export { NotificationEngine } from './engine/notification-engine';
export { ConfigLoader } from './engine/config';
export { ProviderRegistry } from './providers/registry';
export { NotificationProvider } from './providers/interface';
export { TerminalBellProvider } from './providers/terminal-bell';
export { WindowsToastProvider } from './providers/windows-toast';
export { FloatingWindowProvider } from './providers/floating-window';
export { IdleDetector, runWithDetection } from './detector/idle-detector';
export * from './types';
