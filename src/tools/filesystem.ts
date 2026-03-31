import * as fs from 'fs/promises';
import * as path from 'path';

export class FileSystemTool {
  private rootDir = process.cwd();

  private securePath(targetPath: string): string {
    const resolved = path.resolve(this.rootDir, targetPath);
    if (!resolved.startsWith(this.rootDir)) throw new Error("Acceso denegado fuera del root.");
    return resolved;
  }

  async getProjectMap(): Promise<string> {
    const files = await fs.readdir(this.rootDir, { recursive: true });
    const filtered = files.filter(f => !f.includes('node_modules') && !f.includes('.git'));
    return "ESTRUCTURA:\n" + filtered.map(f => `- ${f}`).join('\n');
  }

  async writeFile(filePath: string, content: string) {
    await fs.writeFile(this.securePath(filePath), content, 'utf-8');
  }
}
