import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║       VELOCITY SYSTEM / UI AUDIT — FULL CODEBASE       ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");

const results = [];

function check(name, pass, detail) {
    const icon = pass ? "✅" : "❌";
    console.log(`${icon} ${name}: ${detail}`);
    results.push({ name, pass, detail });
}

// 1. Check core agent files exist
const agentFiles = [
    'agents/architect.js', 'agents/avon_bot.js', 'agents/baseAgent.js',
    'agents/builder.js', 'agents/guardian.js', 'agents/reviewer.js',
    'agents/reflection.js', 'agents/distiller.js', 'agents/supervisor.js',
    'agents/verify.js', 'agents/security.js', 'agents/planner.js'
];
console.log("--- Agent Module Integrity ---");
for (const f of agentFiles) {
    const exists = fs.existsSync(path.join(__dirname, f));
    check(f, exists, exists ? "Present" : "MISSING");
}

// 2. Check kernel
console.log("\n--- Kernel & Router ---");
const kernelFiles = ['kernel/config.js', 'kernel/modelRouter.js'];
for (const f of kernelFiles) {
    const exists = fs.existsSync(path.join(__dirname, f));
    check(f, exists, exists ? "Present" : "MISSING");
}

// 3. Check config points to Avon:latest
const configContent = fs.readFileSync(path.join(__dirname, 'kernel/config.js'), 'utf-8');
const allAvon = !configContent.includes('deepseek') && !configContent.includes('codegemma');
check("Model Config (All Avon:latest)", allAvon, allAvon ? "All profiles route to Avon:latest" : "WARNING: Legacy model references found");

// 4. Check backend server
console.log("\n--- Backend Server ---");
const serverExists = fs.existsSync(path.join(__dirname, 'avon-backend/server.js'));
check("avon-backend/server.js", serverExists, serverExists ? "Present" : "MISSING");

const serverContent = fs.readFileSync(path.join(__dirname, 'avon-backend/server.js'), 'utf-8');
const hasTestTrigger = serverContent.includes('/api/test/trigger');
const hasTestStatus = serverContent.includes('/api/test/status');
const hasTestRefactor = serverContent.includes('/api/test/refactor');
const hasTestDeploy = serverContent.includes('/api/test/deploy-local');
check("API /test/trigger", hasTestTrigger, hasTestTrigger ? "Endpoint registered" : "MISSING");
check("API /test/status", hasTestStatus, hasTestStatus ? "Endpoint registered" : "MISSING");
check("API /test/refactor", hasTestRefactor, hasTestRefactor ? "Endpoint registered" : "MISSING");
check("API /test/deploy-local", hasTestDeploy, hasTestDeploy ? "Endpoint registered" : "MISSING");

// 5. Constitution & Architecture
console.log("\n--- Mission Documents ---");
const constitutionExists = fs.existsSync(path.join(__dirname, 'PROJECT_CONSTITUTION.md'));
const architectureExists = fs.existsSync(path.join(__dirname, 'ARCHITECTURE.md'));
const modelfileExists = fs.existsSync(path.join(__dirname, 'Modelfile'));
check("PROJECT_CONSTITUTION.md", constitutionExists, constitutionExists ? "Present" : "MISSING");
check("ARCHITECTURE.md", architectureExists, architectureExists ? "Present" : "MISSING");
check("Modelfile (Avon LLM Config)", modelfileExists, modelfileExists ? "Present" : "MISSING");

// 6. CLI & Bots
console.log("\n--- CLI & Bot Integrations ---");
const cliExists = fs.existsSync(path.join(__dirname, 'cli.js'));
const discordExists = fs.existsSync(path.join(__dirname, 'discord_bot.js'));
const whatsappExists = fs.existsSync(path.join(__dirname, 'whatsapp_bot.js'));
check("cli.js", cliExists, cliExists ? "Present" : "MISSING");
check("discord_bot.js", discordExists, discordExists ? "Present" : "MISSING");
check("whatsapp_bot.js", whatsappExists, whatsappExists ? "Present" : "MISSING");

// 7. Previews folder
console.log("\n--- Preview Gallery ---");
const previewFiles = fs.readdirSync(path.join(__dirname, 'previews')).filter(f => f.endsWith('.html'));
check("Preview Templates", previewFiles.length > 0, `${previewFiles.length} HTML templates found`);

// 8. Ollama connectivity
console.log("\n--- Ollama Connectivity ---");
try {
    const res = await fetch('http://127.0.0.1:11434');
    const text = await res.text();
    check("Ollama Server", text.includes('running'), `Online (${text.trim()})`);
} catch (e) {
    check("Ollama Server", false, `OFFLINE: ${e.message}`);
}

// 9. Backend connectivity
console.log("\n--- Backend Connectivity ---");
try {
    const res = await fetch('http://localhost:4000/api/health');
    const json = await res.json();
    check("Backend Server (port 4000)", json.status === 'online', `Status: ${json.status}, Provider: ${json.provider}`);
} catch (e) {
    check("Backend Server (port 4000)", false, `OFFLINE: ${e.message}`);
}

// Summary
console.log("\n╔══════════════════════════════════════════════════════════╗");
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`║  AUDIT COMPLETE: ${passed} PASSED / ${failed} FAILED                     ║`);
console.log("╚══════════════════════════════════════════════════════════╝");

if (failed === 0) {
    console.log("\n🟢 ALL SYSTEMS GREEN. Ready for test build.\n");
} else {
    console.log(`\n🔴 ${failed} SYSTEM(S) REQUIRE ATTENTION.\n`);
}
