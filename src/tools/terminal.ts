import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export class ShellExecutor {
  async execute(command: string) {
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
      return { stdout, stderr, success: true };
    } catch (error: any) {
      return { error: error.message, success: false };
    }
  }
}
