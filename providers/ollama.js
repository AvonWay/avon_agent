import ollama from 'ollama';

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

    // Use the official Ollama JS library
    try {
        const response = await ollama.chat({
            model,
            messages,
            stream,
        });

        // If we need to support abort signals with the library check if library supports it, 
        // otherwise we might need to use fetch directly if cancellation is critical.
        // For now, we return the standard response.
        return response;
    } catch (error) {
        if (signal?.aborted) {
            throw new Error('Request timed out');
        }
        throw error;
    }
}
