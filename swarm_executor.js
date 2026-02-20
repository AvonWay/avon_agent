import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';

const OLLAMA_API = 'http://localhost:11434/api/generate';
const BACKEND_DIR = 'C:/Users/bigst/Downloads/Avon_Agent/avon-backend';
const FRONTEND_DIR = 'C:/Users/bigst/Downloads/Avon_Agent/avon-velocity-frontend';

async function runSwarmTask() {
    console.log("\n🌪️ VELOCITY SWARM: Activating Agent Logic...");

    // Core logic context to ensure the Agent follows our industrial math standards
    const mathLogic = await fs.readFile(path.join(BACKEND_DIR, 'lib/betting/engine.js'), 'utf8');

    const prompt = `
You are the VELOCITY INDUSTRIAL AGENT. 
Your task is to build a high-performance Betting Dashboard template.

SCIENTIFIC CONTEXT:
${mathLogic}

INSTRUCTIONS:
1. Use Velocity Template Language (VTL) with the $!{variable} syntax.
2. Use the #card() and #button() macros.
3. Design a layout with a 'Live Betting Edge' table.
4. Implement a #foreach($event in $events) loop.
5. Columns: Event ($!{event.name}), Best Odds ($!{event.odds}), and Edge ($!{event.edge}%).
6. Return ONLY the code for 'betting-view.vm'.
`;

    try {
        console.log("📡 Sending task to Avon:latest model...");
        const response = await fetch(OLLAMA_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "Avon:latest",
                prompt: prompt,
                stream: false
            })
        });

        const data = await response.json();
        const content = data.response;

        // Extract VTL code block
        const codeMatch = content.match(/```(?:vtl|html|vm)?\s*([\s\S]*?)```/i);
        if (codeMatch) {
            const vtlCode = codeMatch[1].trim();
            const target = path.join(FRONTEND_DIR, 'src/templates/betting-view.vm');
            await fs.writeFile(target, vtlCode);
            console.log(`✅ Velocity Agent completed the build: ${target}`);

            // Register route in server.js
            console.log("🔗 Registering new route in Velocity Renderer...");
        } else {
            console.warn("Agent output didn't contain a clear code block. Content preview:", content.substring(0, 100));
        }

    } catch (err) {
        console.error("❌ Velocity Agent was unable to complete the work:", err.message);
    }
}

runSwarmTask();
