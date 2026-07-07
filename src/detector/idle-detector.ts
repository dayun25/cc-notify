import { ChildProcess, spawn } from 'child_process';
import { NotificationEngine } from '../engine/notification-engine';
import { NotificationPayload } from '../types';

export interface IdleDetectorOptions {
  /** Seconds of inactivity before firing. */
  timeout: number;
  /** The notification engine to dispatch through. */
  engine: NotificationEngine;
}

/**
 * Monitors stdout/stderr of a child process and fires a notification
 * when output has been idle for a configured duration, or when the
 * process exits.
 */
export class IdleDetector {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private engine: NotificationEngine;
  private timeoutMs: number;

  constructor(opts: IdleDetectorOptions) {
    this.engine = opts.engine;
    this.timeoutMs = opts.timeout * 1000;
  }

  /** Start watching a spawned child process. */
  watch(child: ChildProcess): void {
    const resetTimer = (): void => {
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.onIdle(), this.timeoutMs);
    };

    const onData = (): void => resetTimer();
    const onExit = (): void => {
      if (this.timer) clearTimeout(this.timer);
      this.onProcessExit();
    };

    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.on('exit', onExit);

    // Start the initial timer
    resetTimer();
  }

  /** Cleanup without sending a notification. */
  dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private async onIdle(): Promise<void> {
    this.timer = null;
    await this.fire('command idle — no output for a while');
  }

  private async onProcessExit(): Promise<void> {
    await this.fire('command finished');
  }

  private async fire(reason: string): Promise<void> {
    const payload: NotificationPayload = {
      message: 'Claude Code response complete',
      title: 'Claude Code',
      metadata: { reason },
    };
    await this.engine.dispatch(payload);
  }
}

/** Spawn a command and wrap it with idle detection. */
export async function runWithDetection(
  command: string,
  args: string[],
  opts: IdleDetectorOptions,
): Promise<number> {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
  });

  const detector = new IdleDetector(opts);
  detector.watch(child);

  return new Promise((resolve) => {
    child.on('exit', (code) => {
      detector.dispose();
      resolve(code ?? 1);
    });
  });
}
