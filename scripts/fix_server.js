import fs from 'fs';
const filePath = 'avon-backend/server.js';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Target lines 83 and 84 (0-indexed 82, 83)
// We want to replace the string literal content and escape backticks.

lines[82] = '  - Example: `<img src="https://image.pollinations.ai/prompt/coding%20setup?width=800&height=600&nologo=true" />`'.replace(/`/g, '\\`');
lines[83] = '    - Replace `{description}` with specific, relevant terms (e.g., "coffee shop interior", "SaaS dashboard graph").'.replace(/`/g, '\\`');

fs.writeFileSync(filePath, lines.join('\n'));
console.log("Fixed lines 83 and 84.");
