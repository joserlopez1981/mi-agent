# MiAgente 🤖

Agente autónomo de software que usa un modelo de lenguaje local (Ollama) para explorar el proyecto, ejecutar comandos y responder preguntas técnicas. Incluye interfaz web de chat y modo CLI interactivo.

---

## Requisitos previos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Node.js | 18 o superior | https://nodejs.org |
| Ollama | cualquiera | https://ollama.com |

> **Por qué Node 18+**: el agente usa `fetch` nativo y la API de `fs/promises`, disponibles desde Node 18.

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/joserlopez1981/mi-agent.git
cd mi-agent
```

### 2. Instalar dependencias Node

```bash
npm install
```

### 3. Instalar Ollama

**Windows** (winget):
```powershell
winget install Ollama.Ollama
```

**macOS / Linux**:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 4. Descargar el modelo de lenguaje

```bash
ollama pull llama3.2:3b
```

> Esto descarga ~2 GB. Solo se hace una vez.

### 5. Iniciar Ollama

En una terminal aparte (debe quedar corriendo):

```bash
ollama serve
```

> En Windows, Ollama puede iniciarse también desde la bandeja del sistema después de instalarlo.

---

## Uso

### Interfaz web (recomendado)

```bash
npm run web
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador. Desde ahí puedes chatear con el agente, ver su razonamiento interno y el historial de la conversación.

### CLI interactivo

```bash
npm start
```

Abre un chat en la terminal. Escribe tus preguntas y el agente responde. Escribe `salir` para terminar.

### CLI de un solo comando

```bash
npm start -- "tu pregunta o tarea aquí"
```

Ejemplo:
```bash
npm start -- "¿qué archivos tiene este proyecto?"
```

---

## Estructura del proyecto

```
miAgente/
├── public/
│   └── index.html          # Interfaz web de chat
├── src/
│   ├── agent/
│   │   └── executor.ts     # Interpreta y ejecuta las acciones del modelo
│   ├── cli/
│   │   └── index.ts        # Punto de entrada CLI e interactivo
│   ├── prompts/
│   │   └── engine.ts       # System prompt del agente
│   ├── server/
│   │   └── index.ts        # Servidor Express (interfaz web)
│   ├── tools/
│   │   ├── filesystem.ts   # Lectura y escritura de archivos
│   │   └── terminal.ts     # Ejecución de comandos de terminal
│   └── utils/
│       └── logger.ts       # Logger de sesión (agent_session.log)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run web` | Inicia la interfaz web en http://localhost:3000 |
| `npm start` | Inicia el CLI conversacional |
| `npm start -- "tarea"` | Ejecuta una sola tarea y sale |
| `npm run build` | Compila TypeScript a `dist/` |

---

## ¿Cómo funciona?

1. El usuario escribe una tarea o pregunta.
2. El agente envía el contexto del proyecto + la solicitud al modelo `llama3.2:3b` vía la API local de Ollama.
3. El modelo responde usando etiquetas `<thought>` para razonar y luego emite una acción:
   - `EXEC_COMMAND: <comando>` — ejecuta un comando en PowerShell (Windows) o bash (macOS/Linux), detectado automáticamente.
   - `WRITE_FILE: <ruta> | CONTENT: <contenido>` — crea o sobreescribe un archivo.
4. El resultado de la acción se devuelve al usuario y se acumula en el historial de la conversación.

---

## Seguridad — sandbox de escritura de archivos

El agente solo puede escribir archivos **dentro del directorio raíz del proyecto**. Cualquier intento de escribir fuera (ej. `../../etc/passwd`) o en archivos sensibles (`.env`, `.git/`) es bloqueado y devuelve un error al modelo.

Archivos y directorios bloqueados por defecto: `.env`, `.git`.

Para añadir más rutas bloqueadas edita el array `BLOCKED` en `src/tools/filesystem.ts`.

---

## Solución de problemas

**`fetch failed` / `ECONNREFUSED`**  
Ollama no está corriendo. Ejecuta `ollama serve` en una terminal aparte.

**`ollama: command not found`** (Windows)  
Recarga el PATH o abre una nueva terminal tras instalar Ollama.

**El modelo no sigue el formato de acción**  
Prueba con un modelo más capaz: `ollama pull llama3.1:8b` y actualiza el nombre del modelo en `src/cli/index.ts` y `src/server/index.ts`.
