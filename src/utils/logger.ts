import * as fs from 'fs/promises';
export class AgentLogger {
  async log(level: string, message: string) {
    const entry = `[${new Date().toISOString()}] [${level}] ${message}\n---\n`;
    console.log(entry);
    await fs.appendFile('agent_session.log', entry);
  }
}
