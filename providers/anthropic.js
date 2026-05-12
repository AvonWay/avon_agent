import fetch from 'node-fetch';

/**
 * Runs a chat completion using Anthropic (Claude) API.
 * @param {Object} options - The completion options.
 * @param {string} options.model - The model name (e.g., 'claude-3.5-sonnet-20241022').
 * @param {Array} options.messages - The conversation history.
 * @param {string} [options.system] - Optional system prompt override.
 * @param {AbortSignal} [options.signal] - AbortSignal for timeouts.
 * @returns {Promise<Object>} A subset of the response compatible with the router.
 */
export async function runAnthropic({ model, messages, system, signal }) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not found in environment.");

    // Extract system instructions from messages
    const systemFromMessages = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Anthropic requires alternating user/assistant messages
    // Merge consecutive same-role messages
    const mergedMessages = [];
    for (const msg of conversationMessages) {
        const role = msg.role === 'assistant' ? 'assistant' : 'user';
        if (mergedMessages.length > 0 && mergedMessages[mergedMessages.length - 1].role === role) {
            mergedMessages[mergedMessages.length - 1].content += '\n' + msg.content;
        } else {
            mergedMessages.push({ role, content: msg.content });
        }
    }

    // Ensure first message is from user
    if (mergedMessages.length > 0 && mergedMessages[0].role !== 'user') {
        mergedMessages.unshift({ role: 'user', content: 'Continue.' });
    }

    const body = {
        model,
        max_tokens: 4096,
        messages: mergedMessages
    };

    const finalSystem = system || systemFromMessages;
    if (finalSystem) {
        body.system = finalSystem;
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body),
            signal
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(`Anthropic Error: ${errBody.error?.message || response.statusText}`);
        }

        const data = await response.json();

        // Extract text content from Anthropic's response format
        const content = data.content
            ?.filter(block => block.type === 'text')
            ?.map(block => block.text)
            ?.join('\n') || '';

        return {
            message: { role: 'assistant', content },
            raw: data
        };
    } catch (error) {
        if (error.name === 'AbortError') throw new Error('Request timed out');
        throw error;
    }
}
