import { AgentExecutor } from '../agent/executor';
import { FileSystemTool } from '../tools/filesystem';
import { CLAUDE_STYLE_SYSTEM_PROMPT } from '../prompts/engine';

async function main() {
  const query = process.argv.slice(2).join(" ");
  const fs = new FileSystemTool();
  const executor = new AgentExecutor();
  
  let context = `${await fs.getProjectMap()}\nTAREA: ${query}`;

  for (let i = 0; i < 3; i++) {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({ model: 'opencode', prompt: `${CLAUDE_STYLE_SYSTEM_PROMPT}\n${context}`, stream: false })
    });
    const { response } = await res.json();
    const result = await executor.process(response);

    if (result.success && !result.error) {
       console.log("✅ Tarea completada con éxito.");
       break;
    } else {
       context += `\nERROR PREVIO: ${result.error}. Intenta de nuevo.`;
    }
  }
}
main();
