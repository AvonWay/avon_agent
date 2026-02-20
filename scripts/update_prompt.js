import fs from 'fs';

const filePath = 'avon-backend/server.js';
let content = fs.readFileSync(filePath, 'utf8');

// Update System Prompt
const newRules = `
- DESIGN TONE: Adapt to the user's requested 'tone'. If 'tone' is unspecified, default to MODERN DARK MODE.
- COLOR PALETTE: Generate a harmonious palette based on the tone. Use it for backgrounds, buttons, and accents.
- Include interactive elements (hover states, simple JS logic).
`;

// Replace the old rule line
content = content.replace(
    /- Ensure the design is MODERN, DARK MODE default, with glassmorphism effects.\s*- Include interactive elements \(hover states, simple JS logic\)\./,
    newRules.trim()
);

fs.writeFileSync(filePath, content);
console.log("Updated System Prompt logic.");
