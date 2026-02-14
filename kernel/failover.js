import { runModel } from "./modelRouter.js";

export async function runWithFailover({
    attempts = [],
    messages,
    system
}) {
    let lastError;

    for (const attempt of attempts) {
        try {
            console.log(`Trying model: ${attempt.model}...`);
            return await runModel({
                provider: "ollama",
                model: attempt.model,
                messages,
                system,
                timeoutMs: attempt.timeoutMs ?? 60_000
            });
        } catch (err) {
            console.warn(
                `⚠️ Model ${attempt.model} failed: ${err.message}. Trying next...`
            );
            lastError = err;
        }
    }

    throw lastError;
}
