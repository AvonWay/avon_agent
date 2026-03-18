import { spawn } from "child_process";
import net from "net";

const OLLAMA_PORT = 11434;
let ollamaProcess = null;

function isPortOpen(port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();

        socket.once("connect", () => {
            socket.destroy();
            resolve(true); // Port is open (server running)
        });

        socket.once("error", () => {
            resolve(false); // Port is closed
        });

        socket.connect(port, "127.0.0.1");
    });
}

export async function ensureOllama() {
    const running = await isPortOpen(OLLAMA_PORT);

    if (running) {
        console.log("✅ Ollama already running — attaching");
        return;
    }

    console.log("🚀 Starting Ollama from Antigravity");

    ollamaProcess = spawn("ollama", ["serve"], {
        stdio: "inherit",
        env: process.env
    });

    ollamaProcess.on("exit", (code) => {
        console.warn(`⚠️ Ollama exited (${code}) — restarting`);
        ollamaProcess = null;
        setTimeout(ensureOllama, 1000);
    });
}
