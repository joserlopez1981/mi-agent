import 'dotenv/config';

export const OLLAMA_MODEL  = process.env.OLLAMA_MODEL  ?? 'llama3.2:3b';
export const OLLAMA_URL    = process.env.OLLAMA_URL    ?? 'http://localhost:11434';
export const SERVER_PORT   = Number(process.env.PORT   ?? 3000);
