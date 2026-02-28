import ollama from 'ollama';

async function test() {
    console.log("Testing Ollama connection to Avon:latest...");
    try {
        const response = await ollama.chat({
            model: 'Avon:latest',
            messages: [{ role: 'user', content: 'hi' }],
        });
        console.log("SUCCESS:", response.message.content);
    } catch (err) {
        console.error("FAILURE:", err.message);
    }
}

test();
