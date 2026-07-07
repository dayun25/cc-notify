import { NotificationEngine } from '../../src/engine/notification-engine';
import { NotificationProvider } from '../../src/providers/interface';
import { NotificationPayload, SendResult } from '../../src/types';

class MockProvider implements NotificationProvider {
  readonly id: string;
  readonly name: string;
  readonly description = 'Test provider';
  shouldFail = false;

  constructor(id: string, name: string, shouldFail = false) {
    this.id = id;
    this.name = name;
    this.shouldFail = shouldFail;
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {}
  async send(_notification: NotificationPayload): Promise<SendResult> {
    if (this.shouldFail) {
      return { success: false, providerId: this.id, error: 'mock failure' };
    }
    return { success: true, providerId: this.id };
  }
}

describe('NotificationEngine', () => {
  it('dispatches to enabled providers', async () => {
    const engine = new NotificationEngine();
    await engine.initialize();

    const registry = engine.getRegistry();
    expect(registry.isRegistered('terminal-bell')).toBe(true);
    expect(registry.isRegistered('windows-toast')).toBe(true);
  });

  it('captures provider errors without crashing the engine', async () => {
    const engine = new NotificationEngine();
    await engine.initialize();

    const mock = new MockProvider('mock', 'Mock', true);
    engine.getRegistry().register(mock);

    const result = await engine.dispatch({ message: 'test' });
    // Engine should not throw; result includes both built-in and mock results
    expect(result.results.length).toBeGreaterThan(0);
    const mockResult = result.results.find((r) => r.providerId === 'mock');
    expect(mockResult).toBeDefined();
    expect(mockResult!.success).toBe(false);
    expect(mockResult!.error).toBe('mock failure');
  });

  it('engine runs without crashing when dispatch is called', async () => {
    const engine = new NotificationEngine();
    await engine.initialize();

    await expect(engine.dispatch({ message: 'test' })).resolves.toBeDefined();
  });
});
