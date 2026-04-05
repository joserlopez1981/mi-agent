import * as readline from 'readline';
import { AgentExecutor } from '../agent/executor';
import { FileSystemTool } from '../tools/filesystem';
import { CLAUDE_STYLE_SYSTEM_PROMPT } from '../prompts/engine';

async function askLLM(context: string): Promise<string> {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({ model: 'llama3.2:3b', prompt: `${CLAUDE_STYLE_SYSTEM_PROMPT}\n${context}`, stream: false })
  });
  const { response } = await res.json() as { response: string };
  return response;
}

async function runTurn(query: string, history: string, executor: AgentExecutor): Promise<string> {
  let context = `${history}\nUSUARIO: ${query}`;

  for (let i = 0; i < 3; i++) {
    const response = await askLLM(context);
    const result = await executor.process(response);

    const actionOutput = (result as any).stdout ?? (result as any).error ?? '';
    context += `\nAGENTE: ${response}`;
    if (actionOutput) context += `\nRESULTADO: ${actionOutput}`;

    if (result.success && !(result as any).error) {
      const answer = response.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();
      console.log(`\n🤖 ${answer || '✅ Tarea completada.'}\n`);
      return context;
    } else {
      context += `\nERROR: ${(result as any).error}. Intenta de nuevo.`;
    }
  }
  return context;
}

async function main() {
  const singleQuery = process.argv.slice(2).join(" ");
  const fs = new FileSystemTool();
  const executor = new AgentExecutor();
  const projectMap = await fs.getProjectMap();
  let history = `CONTEXTO DEL PROYECTO:\n${projectMap}`;

  if (singleQuery) {
    history = await runTurn(singleQuery, history, executor);
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('🤖 Agente listo. Escribe tu pregunta o tarea (escribe "salir" para terminar).\n');

  const ask = () => {
    rl.question('Tú: ', async (input) => {
      const query = input.trim();
      if (!query) return ask();
      if (query.toLowerCase() === 'salir') {
        console.log('👋 Hasta luego.');
        rl.close();
        return;
      }
      history = await runTurn(query, history, executor);
      ask();
    });
  };

  ask();
}
main();
