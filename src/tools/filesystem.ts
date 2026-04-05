import * as fs from 'fs/promises';
import * as path from 'path';

const BLOCKED = ['.env', '.git'];

export class FileSystemTool {
  private rootDir = process.cwd();

  private securePath(targetPath: string): string {
    const resolved = path.resolve(this.rootDir, targetPath);
    // Usar path.relative es más robusto que startsWith para evitar path traversal
    const relative = path.relative(this.rootDir, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Acceso denegado: "${targetPath}" está fuera del directorio raíz.`);
    }
    // Bloquear archivos sensibles
    const firstSegment = relative.split(path.sep)[0];
    if (BLOCKED.includes(firstSegment)) {
      throw new Error(`Acceso denegado: no se puede escribir en "${firstSegment}".`);
    }
    return resolved;
  }

  async getProjectMap(): Promise<string> {
    const files = await fs.readdir(this.rootDir, { recursive: true });
    const filtered = files.filter(f => !f.includes('node_modules') && !f.includes('.git'));
    return "ESTRUCTURA:\n" + filtered.map(f => `- ${f}`).join('\n');
  }

  async writeFile(filePath: string, content: string) {
    const safe = this.securePath(filePath);
    await fs.mkdir(path.dirname(safe), { recursive: true });
    await fs.writeFile(safe, content, 'utf-8');
  }
}
