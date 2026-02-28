import fetch from 'node-fetch';

/**
 * Runs a chat completion using OpenAI (or compatible API).
 * @param {Object} options - The completion options.
 * @param {string} options.model - The model name (e.g., 'gpt-4').
 * @param {Array} options.messages - The conversation history.
 * @param {string} [options.system] - Optional system prompt override.
 * @param {boolean} [options.stream] - Whether to stream the response.
 * @param {AbortSignal} [options.signal] - AbortSignal for timeouts.
 * @returns {Promise<Object>} A subset of the OpenAI response compatible with the router.
 */
export async function runOpenAI({ model, messages, system, stream, signal }) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not found in environment.");

    if (system) {
        messages = [{ role: 'system', content: system }, ...messages];
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                stream: !!stream
            }),
            signal
        });

        if (!response.ok) {
            const errBody = await response.json();
            throw new Error(`OpenAI Error: ${errBody.error?.message || response.statusText}`);
        }

        const data = await response.json();

        // Return in a format compatible with our current supervisor's expectations
        // The supervisor expects { message: { content: "..." } }
        return {
            message: data.choices[0].message,
            raw: data // Keep original for debugging
        };
    } catch (error) {
        if (error.name === 'AbortError') throw new Error('Request timed out');
        throw error;
    }
}
