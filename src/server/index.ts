import express from 'express';
import path from 'path';
import { AgentExecutor } from '../agent/executor';
import { FileSystemTool } from '../tools/filesystem';
import { CLAUDE_STYLE_SYSTEM_PROMPT } from '../prompts/engine';
import { OLLAMA_MODEL, OLLAMA_URL, SERVER_PORT } from '../config';

const app = express();
const PORT = SERVER_PORT;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

const sessions = new Map<string, string>();

async function askLLM(context: string): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt: `${CLAUDE_STYLE_SYSTEM_PROMPT}\n${context}`, stream: false })
  });
  const { response } = await res.json() as { response: string };
  return response;
}

app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body as { message: string; sessionId: string };

  if (!message || typeof message !== 'string' || message.length > 4000) {
    res.status(400).json({ error: 'Mensaje inválido.' });
    return;
  }

  const safeSessionId = String(sessionId ?? 'default').replace(/[^a-z0-9]/gi, '').slice(0, 40) || 'default';
  const fileTool = new FileSystemTool();
  const executor = new AgentExecutor();

  if (!sessions.has(safeSessionId)) {
    const projectMap = await fileTool.getProjectMap();
    sessions.set(safeSessionId, `CONTEXTO DEL PROYECTO:\n${projectMap}`);
  }

  let history = sessions.get(safeSessionId)!;
  let context = `${history}\nUSUARIO: ${message}`;
  let reply = '';
  let thought = '';
  let action = '';

  try {
    for (let i = 0; i < 3; i++) {
      const response = await askLLM(context);
      const result = await executor.process(response);

      thought = response.match(/<thought>([\s\S]*?)<\/thought>/)?.[1]?.trim() ?? '';
      const actionMatch = response.match(/(EXEC_COMMAND|WRITE_FILE):[^\n]*/);
      action = actionMatch?.[0]?.trim() ?? '';

      const stdout = ((result as any).stdout as string | undefined)?.trim() ?? '';
      const isWrite = (result as any).type === 'WRITE';
      const cleanResponse = response
        .replace(/<thought>[\s\S]*?<\/thought>/g, '')
        .replace(/(EXEC_COMMAND|WRITE_FILE):[^\n]*/g, '')
        .trim();

      context += `\nAGENTE: ${response}`;
      if (stdout) context += `\nRESULTADO: ${stdout}`;

      if (result.success && !(result as any).error) {
        if (stdout) {
          reply = stdout;
        } else if (isWrite) {
          const fileMatch = response.match(/WRITE_FILE:\s*(\S+)/);
          reply = `Archivo \`${fileMatch?.[1] ?? ''}\` guardado correctamente.`;
        } else {
          reply = cleanResponse || '✅ Tarea completada.';
        }
        break;
      } else {
        const errMsg = ((result as any).error as string) ?? 'Acción no reconocida.';
        context += `\nERROR: ${errMsg}`;
        reply = errMsg;
      }
    }
  } catch (err: any) {
    const isConnRefused = err?.cause?.code === 'ECONNREFUSED';
    const msg = isConnRefused
      ? 'No puedo conectarme a Ollama. Asegúrate de que esté corriendo.'
      : `Error interno: ${err.message}`;
    res.status(503).json({ error: msg });
    return;
  }

  sessions.set(safeSessionId, context);
  res.json({ reply, thought, action });
});

app.delete('/api/session/:id', (req, res) => {
  const safeId = req.params.id.replace(/[^a-z0-9]/gi, '').slice(0, 40);
  sessions.delete(safeId);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`\n🌐 Interfaz web disponible en http://localhost:${PORT}\n`);
});
