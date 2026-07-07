import { startWebUi } from '../../web/server';

export async function webCommand(options: { port?: number }): Promise<void> {
  await startWebUi(options.port);
}
