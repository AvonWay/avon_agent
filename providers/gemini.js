import fetch from 'node-fetch';

/**
 * Runs a chat completion using Google Gemini API.
 * @param {Object} options - The completion options.
 * @param {string} options.model - The model name (e.g., 'gemini-1.5-flash').
 * @param {Array} options.messages - The conversation history.
 * @param {string} [options.system] - Optional system prompt override.
 * @param {AbortSignal} [options.signal] - AbortSignal for timeouts.
 * @returns {Promise<Object>} A subset of the response compatible with the router.
 */
export async function runGemini({ model, messages, system, signal }) {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) not found in environment.");

    // Gemini 1.5 format: { contents: [ { role: 'user', parts: [ { text: '...' } ] } ] }
    // Roles: 'user', 'model' (different from OpenAI's 'assistant')
    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }]
    }));

    const body = { contents };
    if (system) {
        body.system_instruction = { parts: [{ text: system }] };
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal
        });

        if (!response.ok) {
            const errBody = await response.json();
            throw new Error(`Gemini Error: ${errBody.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        // Return in a format compatible with our current supervisor's expectations
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        return {
            message: { role: 'assistant', content },
            raw: data
        };
    } catch (error) {
        if (error.name === 'AbortError') throw new Error('Request timed out');
        throw error;
    }
}
