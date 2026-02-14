import { runOllama } from "../providers/ollama.js";

const providers = {
    ollama: runOllama,
};

export async function runModel({
    provider = "ollama",
    model,
    messages,
    system,
    stream = false,
    timeoutMs = 60_000
}) {
    const runner = providers[provider];
    if (!runner) throw new Error(`Unknown provider: ${provider}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await runner({
            model,
            messages,
            system,
            stream,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
    }
}
