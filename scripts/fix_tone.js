import fs from 'fs';
const file = 'avon-backend/server.js';
let content = fs.readFileSync(file, 'utf8');

// The string we saw: `{ role: 'user', content: `Build this node: ${prompt} ` }`
// We want to replace valid template literal syntax.
// Note: In file, it is backticked.

// Escaping for regex is tricky.
// We'll use string replacement directly.

const targetString = "{ role: 'user', content: `Build this node: ${prompt} ` }";
const newString = "{ role: 'user', content: `Build this node: ${prompt}. ${tone ? 'TONE/VIBE REQUIRED: ' + tone + '. Generate a unique color palette for this vibe.' : ''}` }";

if (content.includes(targetString)) {
    content = content.replace(targetString, newString);
    fs.writeFileSync(file, content);
    console.log("Updated tone logic (exact string match).");
} else {
    // Try with extra spaces if any
    const altTarget = "{ role: 'user', content: `Build this node: ${ prompt } ` }";
    if (content.includes(altTarget)) {
        content = content.replace(altTarget, newString);
        fs.writeFileSync(file, content);
        console.log("Updated tone logic (alt string match).");
    } else {
        console.log("Still failed. Target string not found.");
    }
}
