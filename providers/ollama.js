import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

/**
 * Runs a chat completion using the local Ollama instance.
 * @param {Object} options - The completion options.
 * @param {string} options.model - The model name (e.g., 'Avon:latest').
 * @param {Array} options.messages - The conversation history.
 * @param {string} [options.system] - Optional system prompt override.
 * @param {boolean} [options.stream] - Whether to stream the response.
 * @param {AbortSignal} [options.signal] - AbortSignal for timeouts.
 * @returns {Promise<Object>} The Ollama response object.
 */
export async function runOllama({ model, messages, system, stream, signal }) {
    // If a system prompt is provided separately, prepend it to messages
    if (system) {
        messages = [{ role: 'system', content: system }, ...messages];
    }

    // Use the official Ollama JS library with explicit client
    try {
        console.log(`[Ollama] 📡 Requesting ${model} at ${ollama.config.host}...`);
        const response = await ollama.chat({
            model,
            messages,
            stream: !!stream,
        });
        console.log(`[Ollama] ✅ ${model} responded.`);
        return response;
    } catch (error) {
        console.error(`[Ollama] ❌ Error calling ${model}:`, error.message);
        if (signal?.aborted) {
            throw new Error('Request timed out');
        }
        throw error;
    }
}
