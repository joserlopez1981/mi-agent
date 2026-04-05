import { FileSystemTool } from '../tools/filesystem';
import { ShellExecutor } from '../tools/terminal';
import { AgentLogger } from '../utils/logger';

export class AgentExecutor {
  constructor(private fs = new FileSystemTool(), private shell = new ShellExecutor(), private logger = new AgentLogger()) {}

  async process(response: string) {
    const thought = response.match(/<thought>([\s\S]*?)<\/thought>/)?.[1] || "Sin plan";
    await this.logger.log('THOUGHT', thought);

    if (response.includes("WRITE_FILE:")) {
      const match = response.match(/WRITE_FILE:\s*(\S+)\s*\| CONTENT:\s*([\s\S]+)/);
      if (!match) return { success: false, error: 'Formato WRITE_FILE inválido.' };
      try {
        await this.fs.writeFile(match[1], match[2]);
        await this.logger.log('WRITE_FILE', match[1]);
        return { type: 'WRITE', success: true, error: undefined };
      } catch (err: any) {
        await this.logger.log('WRITE_FILE_ERROR', err.message);
        return { success: false, error: err.message };
      }
    }

    if (response.includes("EXEC_COMMAND:")) {
      const cmd = response.match(/EXEC_COMMAND:\s*(.+)/)?.[1];
      if (cmd) return await this.shell.execute(cmd);
    }
    return { success: false, error: "No se detectó acción válida." };
  }
}
