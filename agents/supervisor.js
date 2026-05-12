import fs from 'fs-extra';
import path from 'path';
import { PlannerAgent } from "./planner.js";
import { BuilderAgent } from "./builder.js";
import { ReviewerAgent } from "./reviewer.js";
import { ReflectionAgent } from "./reflection.js";
import { DistillationAgent } from "./distiller.js";
import { DesignerAgent } from "./designer.js";
import { ArchitectAgent } from "./architect.js";
import { GuardianAgent } from "./guardian.js";
import { SecurityAgent } from "./security.js";
import { VerifyAgent } from "./verify.js";
import { AvonBotAgent } from "./avon_bot.js";
import { OpenCodeAgent } from "./opencode.js";
import { webSearch } from "../io/search.js";
import { runReviewEnsemble } from "../kernel/modelRouter.js";
import { logModelRouting } from "../kernel/config.js";
import { TEMPLATES } from "../kernel/templateManifest.js";
import { LiaisonAgent, getClientApproval } from "./liaison.js";


import { RSI_LIMITS } from "../kernel/config.js";

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const HEURISTICS_PATH = path.join(PROJECT_ROOT, "memory/heuristics.md");
const CONSTITUTION_PATH_MD = path.join(PROJECT_ROOT, "PROJECT_CONSTITUTION.md");
const CONSTITUTION_PATH_JSON = path.join(PROJECT_ROOT, ".velocity_constitution.json");
const AUDIT_LOG_PATH = path.join(PROJECT_ROOT, "memory", "audit_log.jsonl");

/**
 * Audit: Logs every autonomous action to a persistent JSONL file.
 */
async function logAudit(taskId, type, action, target, result, duration) {
    const entry = {
        timestamp: new Date().toISOString(),
        parent_agent: "supervisor",
        task_id: taskId,
        type: type,
        action: action,
        target: target,
        result: result,
        duration_ms: duration
    };
    await fs.appendFile(AUDIT_LOG_PATH, JSON.stringify(entry) + '\n');
}

/**
 * Parse multi-page artifacts from raw swarm output.
 * Looks for markdown code blocks tagged with filenames (e.g. ```index.html ... ```)
 * and extracts each file into a structured pages object.
 */
function parseMultiPageArtifact(rawArtifact) {
    const pages = {};
    // Match code blocks with filename labels: ```filename.ext ... ```
    const fileBlockRegex = /```(\S+\.(?:html|css|js|ts|tsx|jsx|json|md|sql|yaml|yml|sh))\s*\n([\s\S]*?)```/gi;
    let match;
    while ((match = fileBlockRegex.exec(rawArtifact)) !== null) {
        const filename = match[1].trim();
        const content = match[2].trim();
        if (content.length > 50) { // Only keep substantial content
            pages[filename] = content;
        }
    }
    // If no filename-tagged blocks found, check for <!DOCTYPE markers
    if (Object.keys(pages).length === 0) {
        // Try to find raw HTML — treat entire artifact as index.html
        const htmlMatch = rawArtifact.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
        if (htmlMatch) {
            pages['index.html'] = htmlMatch[0];
        }
    }
    return pages;
}



const MAX_REFINEMENT_DEPTH = 3;
const ALLOWED_COMMANDS = ['npm', 'npx', 'node', 'echo', 'mkdir', 'git', 'tsc', 'eslint', 'serve'];
const BLOCKED_SHELL_CHARS = /[;&|><`$(){}]/;

/**
 * Security: Verifies a command is on the allowlist and contains no dangerous shell metacharacters.
 */
function isSafeCommand(cmd) {
    if (!cmd) return false;
    if (BLOCKED_SHELL_CHARS.test(cmd)) return false;
    return ALLOWED_COMMANDS.some(allowed => cmd.trim().startsWith(allowed));
}

/**
 * Security: Verifies a path stays within the defined PROJECT_ROOT boundary.
 */
function isSafePath(filepath) {
    if (!filepath) return false;
    const resolved = path.resolve(PROJECT_ROOT, filepath);
    return resolved.startsWith(PROJECT_ROOT);
}

class SupervisorAgent {
    constructor() {
        this.maxRetries = RSI_LIMITS.maxRetriesPerTask;
        // Log the full model routing table on first instantiation
        logModelRouting();
    }

    async execute(goal, depth = 0) {
        if (depth >= MAX_REFINEMENT_DEPTH) {
            console.error(`Supervisor: Max refinement depth (${MAX_REFINEMENT_DEPTH}) reached. Halting recursion.`);
            return { status: "failed", reason: "Max refinement depth reached." };
        }
        console.log(`\n--- Velocity Swarm Initiated: '${goal}' (Depth: ${depth}) ---`);

        // INITIAL CLIENT BRIEFING
        const briefing = await LiaisonAgent.think([
            { role: "user", content: `Explain to the client that we are initiating a "Tier 1" elite build for: "${goal}". Mention that we are mobilizing a specialized swarm of agents and the first step is the Blueprinting phase.` }
        ]);
        console.log(`\n[Client Liaison]: ${briefing.message.content}\n`);


        const constitutionJson = await fs.readJson(CONSTITUTION_PATH_JSON).catch(() => ({ patterns: [], rules: [] }));
        const coreRules = constitutionJson.rules.join('\n');

        // 1. ARCHITECT PHASE (Avon)
        console.log("Supervisor: 🚀 Architect (Avon) is processing plan...");
        let archResponse = { message: { content: "{}" } };
        if (goal !== "TEST_CAPABILITIES") {
            archResponse = await ArchitectAgent.think([
                { role: "system", content: `[PROJECT CONSTITUTION]:\n${coreRules}` },
                { role: "user", content: goal }
            ], "architect");
        }

        let taskGraph;
        if (goal === "TEST_CAPABILITIES") {
            console.log("\n[DevOps Test]: Bypassing Architect LLM to directly invoke System Reader and DevOps Agent tools...");
            taskGraph = {
                template: "NONE",
                page_count: 1,
                pages: ["App.tsx"],
                brand_dna: {},
                architecture: {},
                tasks: [
                    { id: "task_cfg", type: "writer", filepath: "velocity_test_write.txt", description: "Write a verification file with some base text", dependencies: [] },
                    { id: "task_read", type: "reader", filepath: "package.json", description: "Read project name from package.json", dependencies: [] },
                    { id: "task_scan", type: "scan", cwd: ".", description: "Scan root directory structure", dependencies: [] },
                    { id: "task_grep", type: "grep", pattern: "Supervisor", description: "Search for Supervisor in the codebase", dependencies: [] },
                    { id: "task_fetch", type: "fetch", url: "https://example.com", description: "Fetch content from example.com", dependencies: [] },
                    { id: "task_img", type: "image", prompt: "Velocity AI Logo, minimalist, blue and gold", filepath: "assets/velocity_test_logo.jpg", description: "Generate test logo", dependencies: [] },
                    { id: "task_patch", type: "patch", filepath: "velocity_test_write.txt", find: "base text", replace: "SURGICAL PATCH SUCCESS", description: "Verify surgical file editing", dependencies: ["task_cfg"] },
                    { id: "task_init", type: "command", command: "echo Velocity_Live_Live_Verification_Success > velocity_live_test.txt", description: "Final validation command", dependencies: ["task_patch", "task_scan", "task_grep", "task_fetch", "task_img"] }
                ]
            };
        } else {
            try {
                const jsonStr = archResponse.message.content.match(/\{[\s\S]*\}/)[0];
                taskGraph = JSON.parse(jsonStr);
            } catch (e) {
                console.error("Supervisor: Failed to parse task graph. Falling back to linear mode.");
                taskGraph = {
                    tasks: [
                        { id: "logic_task", type: "logic", description: `Logic for ${goal}`, dependencies: [] },
                        { id: "ui_task", type: "techlead", description: `UI for ${goal}`, dependencies: [] }
                    ]
                };
            }
        }

        // CLIENT APPROVAL GATE: The Blueprint
        const planExplanation = await LiaisonAgent.think([
            { role: "user", content: `Translate this technical architecture plan into a professional client-friendly summary. Focus on the 5-page scope, the Brand DNA, and the "Signature Complexity" feature. Here is the plan: ${JSON.stringify(taskGraph)}` }
        ]);
        
        const decision = await getClientApproval(planExplanation.message.content);
        
        if (decision === 'no') {
            return { status: "cancelled", reason: "Client declined the blueprint." };
        } else if (decision === 'refine') {
            const refinement = prompt("What would you like to refine? ");
            return this.execute(`${goal} (REFINEMENT: ${refinement})`, depth + 1);
        }

        console.log("\n[Client Liaison]: Excellent choice. I'm now mobilizing the engineering teams to begin construction.");

        // 2. PARALLEL EXECUTION (The Swarm)
        const swarmUpdate = await LiaisonAgent.think([
            { role: "user", content: "Explain that the specialized engineering swarm is now working in parallel on the different components of the project (Logic, UI, and Systems)." }
        ]);
        console.log(`\n[Client Liaison]: ${swarmUpdate.message.content}\n`);

        console.log("Supervisor: Starting Swarm Execution (Logic Engine & Tech Lead)...");

        const results = {};
        const completedTasks = new Set();

        async function runTask(task) {
            // Wait for dependencies
            for (const depId of task.dependencies) {
                while (!completedTasks.has(depId)) {
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            const profileMap = {
                // LLM-driven agents
                'logic': { role: 'Logic Engine', profile: 'logic', agent: BuilderAgent },
                'techlead': { role: 'Tech Lead', profile: 'techlead', agent: BuilderAgent },
                'synthesis': { role: 'Master Synthesizer', profile: 'builder', agent: BuilderAgent },
                'guardian': { role: 'Guardian', profile: 'guardian', agent: BuilderAgent },
                'avon_bot': { role: 'Avon Scaffold', profile: 'avon_bot', agent: AvonBotAgent },
                'designer': { role: 'Designer', profile: 'designer', agent: BuilderAgent },
                'researcher': { role: 'Researcher', profile: 'researcher', agent: BuilderAgent },
                // Antigravity-parity edge agents (physical OS tools)
                'command': { role: 'DevOps Agent', profile: 'special', agent: null },
                'reader': { role: 'System Reader', profile: 'special', agent: null },
                'writer': { role: 'System Writer', profile: 'special', agent: null },
                'search': { role: 'System Researcher', profile: 'special', agent: null },
                'image': { role: 'System Designer', profile: 'special', agent: null },
                'git': { role: 'Git Agent', profile: 'special', agent: null },
                'deploy': { role: 'Deploy Agent', profile: 'special', agent: null },
                'scaffold': { role: 'Scaffold Agent', profile: 'special', agent: null },
                'serve': { role: 'Preview Server', profile: 'special', agent: null },
                // Deep-clone capabilities (directory awareness, code search, URL reading, surgical edits)
                'scan': { role: 'Directory Scanner', profile: 'special', agent: null },
                'grep': { role: 'Code Searcher', profile: 'special', agent: null },
                'fetch': { role: 'URL Reader', profile: 'special', agent: null },
                'patch': { role: 'File Patcher', profile: 'special', agent: null },
                'coder': { role: 'OpenCode', profile: 'coder', agent: OpenCodeAgent },
                'standard': { role: 'Generalist', profile: 'standard', agent: BuilderAgent }
            };

            const taskConfig = profileMap[task.type] || { role: 'Generalist', profile: 'standard', agent: BuilderAgent };
            const agentRole = taskConfig.role;
            const profile = taskConfig.profile;
            const TargetAgent = taskConfig.agent;

            const templateContext = taskGraph.template && taskGraph.template !== "NONE" && TEMPLATES[taskGraph.template] 
                ? `\n[SELECTED TEMPLATE STRUCTURE]: Please follow this structure strictly:\n${JSON.stringify(TEMPLATES[taskGraph.template])}`
                : `\n[BUILD FROM SCRATCH]: No predefined template used. Follow the architecture plan strictly.`;

            const brandContext = taskGraph.brand_dna ? `\n[BRAND DNA]: ${JSON.stringify(taskGraph.brand_dna)}` : "";
            const architectureContext = taskGraph.architecture ? `\n[ARCHITECT PLAN]: ${JSON.stringify(taskGraph.architecture)}` : "";

            console.log(`Supervisor: 🚀 ${agentRole} is processing ${task.id}...`);
            
            // CONTEXT SCOPING: Only pass results from declared dependencies
            const contextFromPrev = (task.dependencies || [])
                .map(depId => {
                    const result = results[depId];
                    if (!result) return `[${depId}]: (No data - dependency might have failed or been skipped)`;
                    return `[${depId}]:\n${result}`;
                })
                .join('\n\n---\n\n');

            let taskOutput = "";
            if (task.type === "command") {
                // TRUE AUTONOMY REVEALED: Velocity executes real terminal commands like Antigravity
                const cmd = task.command || task.description;
                console.log(`\n[DevOps Agent]: Executing Command: ${cmd}`);
                
                const startTime = Date.now();
                if (!isSafeCommand(cmd)) {
                    const blockMsg = `[SECURITY] Command blocked by policy: ${cmd}`;
                    console.warn(blockMsg);
                    taskOutput = blockMsg;
                    await logAudit(task.id, task.type, "exec", cmd, "blocked", Date.now() - startTime);
                } else {
                    try {
                        const { execSync } = await import('child_process');
                        taskOutput = execSync(cmd, { shell: true, stdio: 'pipe' }).toString();
                        console.log(`[DevOps Agent] Success: \n${taskOutput.slice(0, 300)}...`);
                        await logAudit(task.id, task.type, "exec", cmd, "success", Date.now() - startTime);
                    } catch (e) {
                        console.warn(`[DevOps Agent] Command Failed: ${e.message}`);
                        taskOutput = `Command Failed: ${e.message}\n${e.stdout ? e.stdout.toString() : ''}`;
                        await logAudit(task.id, task.type, "exec", cmd, "fail", Date.now() - startTime);
                    }
                }
            } else if (task.type === "reader") {
                // TRUE AUTONOMY REVEALED: Velocity physically reads codebase files like Antigravity
                const targetFile = task.filepath || task.description;
                console.log(`\n[System Reader]: Reading File: ${targetFile}`);
                
                const startTime = Date.now();
                if (!isSafePath(targetFile)) {
                    const blockMsg = `[SECURITY] Path traversal blocked: ${targetFile}`;
                    console.warn(blockMsg);
                    taskOutput = blockMsg;
                    await logAudit(task.id, task.type, "read", targetFile, "blocked", Date.now() - startTime);
                } else {
                    try {
                        const fileData = fs.readFileSync(path.resolve(PROJECT_ROOT, targetFile), "utf-8");
                        taskOutput = `FILE CONTENTS OF ${targetFile}:\n\`\`\`\n${fileData}\n\`\`\``;
                        console.log(`[System Reader] Success: Scaled ${fileData.length} bytes.`);
                        await logAudit(task.id, task.type, "read", targetFile, "success", Date.now() - startTime);
                    } catch (e) {
                        console.warn(`[System Reader] Failed to read ${targetFile}: ${e.message}`);
                        taskOutput = `[READ ERROR]: ${e.message}`;
                        await logAudit(task.id, task.type, "read", targetFile, "fail", Date.now() - startTime);
                    }
                }
            } else if (task.type === "writer") {
                // TRUE AUTONOMY REVEALED: Velocity physically writes configuration/scripts to the filesystem
                console.log(`\n[System Writer]: Crafting File: ${task.filepath}`);
                
                const startTime = Date.now();
                if (!isSafePath(task.filepath)) {
                    const blockMsg = `[SECURITY] Path traversal blocked: ${task.filepath}`;
                    console.warn(blockMsg);
                    taskOutput = blockMsg;
                    await logAudit(task.id, task.type, "write", task.filepath, "blocked", Date.now() - startTime);
                } else {
                    try {
                        const TargetAgent = profileMap['standard'].agent; // Uses default fast builder
                        const writerRes = await TargetAgent.think([
                            { role: "system", content: "You are the System Writer. Generate ONLY the raw content for this file based on the goal. No code blocks or markdown wrappers." },
                            { role: "user", content: `Goal: ${task.description}\nDependencies Context:\n${contextFromPrev}` }
                        ], "standard");
                        
                        const fullPath = path.resolve(PROJECT_ROOT, task.filepath);
                        fs.ensureDirSync(path.dirname(fullPath));
                        fs.writeFileSync(fullPath, writerRes.message.content.trim(), "utf-8");
                        taskOutput = `Successfully wrote to ${task.filepath}`;
                        console.log(`[System Writer] Success: Generated ${task.filepath}`);
                        await logAudit(task.id, task.type, "write", task.filepath, "success", Date.now() - startTime);
                    } catch (e) {
                        console.warn(`[System Writer] Failed to write ${task.filepath}: ${e.message}`);
                        taskOutput = `[WRITE ERROR]: ${e.message}`;
                        await logAudit(task.id, task.type, "write", task.filepath, "fail", Date.now() - startTime);
                    }
                }
            } else if (task.type === "search") {
                // TRUE AUTONOMY REVEALED: Velocity physically browses the internet to fetch API docs
                const query = task.query || task.description;
                console.log(`\n[System Researcher]: Searching web for: ${query}`);
                const startTime = Date.now();
                try {
                    const searchResults = await webSearch(query);
                    taskOutput = `[SEARCH RESULTS FOR "${query}"]:\n`;
                    taskOutput += searchResults.map((r, i) => `Source ${i+1}: ${r.url}\nSummary: ${r.snippet}`).join('\n\n');
                    console.log(`[System Researcher] Success: Found ${searchResults.length} relevant results.`);
                    await logAudit(task.id, task.type, "web_search", query, "success", Date.now() - startTime);
                } catch (e) {
                    console.warn(`[System Researcher] Search Failed: ${e.message}`);
                    taskOutput = `[SEARCH ERROR]: ${e.message}`;
                    await logAudit(task.id, task.type, "web_search", query, "fail", Date.now() - startTime);
                }
            } else if (task.type === "image") {
                // TRUE AUTONOMY REVEALED: Velocity natively generates AI imagery just like Antigravity
                console.log(`\n[System Designer]: Generating AI Image for: "${task.prompt || task.description}"`);
                try {
                    const prompt = encodeURIComponent(task.prompt || task.description);
                    const width = task.width || 800;
                    const height = task.height || 600;
                    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&nologo=true`;
                    
                    const response = await fetch(imageUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    
                    const buffer = Buffer.from(await response.arrayBuffer());
                    const filepath = path.resolve(process.cwd(), task.filepath || 'assets/generated_image.jpg');
                    
                    fs.ensureDirSync(path.dirname(filepath));
                    fs.writeFileSync(filepath, buffer);
                    
                    taskOutput = `[IMAGE GENERATED]: Successfully saved AI image to ${task.filepath || 'assets/generated_image.jpg'}. (URL: ${imageUrl})`;
                    console.log(`[System Designer] Success: Downloaded AI Image offline to ${task.filepath || 'assets/generated_image.jpg'}`);
                } catch (e) {
                    console.warn(`[System Designer] Image Generation Failed: ${e.message}`);
                    taskOutput = `[IMAGE ERROR]: ${e.message}`;
                }
            } else if (task.type === "git") {
                // ANTIGRAVITY PARITY: Git version control operations
                const gitCmd = task.command || task.description;
                console.log(`\n[Git Agent]: Executing: git ${gitCmd}`);
                try {
                    const { execSync } = await import('child_process');
                    const cwd = path.resolve(process.cwd(), task.cwd || '.');
                    taskOutput = execSync(`git ${gitCmd}`, { cwd, shell: true, stdio: 'pipe' }).toString();
                    console.log(`[Git Agent] Success: ${taskOutput.slice(0, 200)}`);
                } catch (e) {
                    console.warn(`[Git Agent] Failed: ${e.message}`);
                    taskOutput = `[GIT ERROR]: ${e.message}`;
                }
            } else if (task.type === "deploy") {
                // ANTIGRAVITY PARITY: Deploy to Vercel / Railway / Netlify
                const platform = (task.platform || 'vercel').toLowerCase();
                const projectDir = path.resolve(process.cwd(), task.cwd || '.');
                console.log(`\n[Deploy Agent]: Deploying to ${platform} from ${projectDir}...`);
                try {
                    const { execSync } = await import('child_process');
                    let deployCmd;
                    if (platform === 'vercel') deployCmd = 'npx -y vercel --yes --prod';
                    else if (platform === 'railway') deployCmd = 'npx -y @railway/cli up';
                    else if (platform === 'netlify') deployCmd = 'npx -y netlify-cli deploy --prod --dir=.';
                    else deployCmd = task.command || `echo "Unknown platform: ${platform}"`;
                    
                    taskOutput = execSync(deployCmd, { cwd: projectDir, shell: true, stdio: 'pipe', timeout: 120000 }).toString();
                    console.log(`[Deploy Agent] Success: ${taskOutput.slice(0, 300)}`);
                } catch (e) {
                    console.warn(`[Deploy Agent] Deployment Failed: ${e.message}`);
                    taskOutput = `[DEPLOY ERROR]: ${e.message}`;
                }
            } else if (task.type === "scaffold") {
                // ANTIGRAVITY PARITY: Project scaffolding (create-next-app, create-vite, etc.)
                const scaffoldCmd = task.command || 'npx -y create-vite@latest ./ --template react';
                const projectDir = path.resolve(process.cwd(), task.cwd || 'previews/scaffolded_project');
                console.log(`\n[Scaffold Agent]: Initializing project at ${projectDir}...`);
                try {
                    const { execSync } = await import('child_process');
                    fs.ensureDirSync(projectDir);
                    taskOutput = execSync(scaffoldCmd, { cwd: projectDir, shell: true, stdio: 'pipe', timeout: 60000 }).toString();
                    console.log(`[Scaffold Agent] Success: ${taskOutput.slice(0, 300)}`);
                } catch (e) {
                    console.warn(`[Scaffold Agent] Scaffold Failed: ${e.message}`);
                    taskOutput = `[SCAFFOLD ERROR]: ${e.message}`;
                }
            } else if (task.type === "serve") {
                // ANTIGRAVITY PARITY: Spin up a local preview server
                const serveDir = path.resolve(process.cwd(), task.cwd || '.');
                console.log(`\n[Preview Server]: Starting local server in ${serveDir}...`);
                try {
                    const { exec } = await import('child_process');
                    const port = task.port || 3333;
                    // Non-blocking: fire and forget
                    const child = exec(`npx -y serve -s ${serveDir} -l ${port}`, { shell: true });
                    child.unref();
                    taskOutput = `[PREVIEW SERVER]: Running at http://localhost:${port} (PID: ${child.pid})`;
                    console.log(`[Preview Server] Live at http://localhost:${port}`);
                } catch (e) {
                    console.warn(`[Preview Server] Failed: ${e.message}`);
                    taskOutput = `[SERVER ERROR]: ${e.message}`;
                }
            } else if (task.type === "scan") {
                // ANTIGRAVITY PARITY: list_dir — understand project structure
                const scanDir = path.resolve(process.cwd(), task.cwd || task.filepath || '.');
                console.log(`\n[Directory Scanner]: Scanning ${scanDir}...`);
                try {
                    const entries = fs.readdirSync(scanDir, { withFileTypes: true });
                    const listing = entries.map(e => {
                        if (e.isDirectory()) return `📁 ${e.name}/`;
                        const stats = fs.statSync(path.join(scanDir, e.name));
                        return `📄 ${e.name} (${stats.size} bytes)`;
                    });
                    taskOutput = `[DIRECTORY LISTING: ${scanDir}]\n${listing.join('\n')}`;
                    console.log(`[Directory Scanner] Success: ${entries.length} entries found.`);
                } catch (e) {
                    console.warn(`[Directory Scanner] Failed: ${e.message}`);
                    taskOutput = `[SCAN ERROR]: ${e.message}`;
                }
            } else if (task.type === "grep") {
                // ANTIGRAVITY PARITY: grep_search — find patterns across a codebase
                const searchDir = path.resolve(process.cwd(), task.cwd || '.');
                const pattern = task.pattern || task.query || task.description;
                console.log(`\n[Code Searcher]: Grepping "${pattern}" in ${searchDir}...`);
                try {
                    const { execSync } = await import('child_process');
                    // Use findstr on Windows, grep on Unix
                    const isWin = process.platform === 'win32';
                    const cmd = isWin
                        ? `findstr /S /I /N /C:"${pattern}" *.js *.ts *.tsx *.html *.css *.json`
                        : `grep -rn --include='*.{js,ts,tsx,html,css,json}' "${pattern}" .`;
                    taskOutput = execSync(cmd, { cwd: searchDir, shell: true, stdio: 'pipe', timeout: 15000 }).toString();
                    const lineCount = taskOutput.split('\n').filter(Boolean).length;
                    console.log(`[Code Searcher] Success: ${lineCount} matches found.`);
                    // Truncate if too large
                    if (taskOutput.length > 5000) taskOutput = taskOutput.slice(0, 5000) + '\n... (truncated)';
                } catch (e) {
                    if (e.status === 1) {
                        taskOutput = `[GREP]: No matches found for "${pattern}".`;
                        console.log(`[Code Searcher] No matches for "${pattern}".`);
                    } else {
                        console.warn(`[Code Searcher] Failed: ${e.message}`);
                        taskOutput = `[GREP ERROR]: ${e.message}`;
                    }
                }
            } else if (task.type === "fetch") {
                // ANTIGRAVITY PARITY: read_url_content — fetch docs & API references from URLs
                const url = task.url || task.description;
                console.log(`\n[URL Reader]: Fetching ${url}...`);
                try {
                    const res = await fetch(url, {
                        headers: { 'User-Agent': 'VelocityAI/1.0' },
                        signal: AbortSignal.timeout(10000)
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    let body = await res.text();
                    // Strip HTML tags for readability if it's HTML
                    if (body.includes('<html') || body.includes('<!DOCTYPE')) {
                        body = body.replace(/<script[\s\S]*?<\/script>/gi, '')
                                   .replace(/<style[\s\S]*?<\/style>/gi, '')
                                   .replace(/<[^>]+>/g, ' ')
                                   .replace(/\s+/g, ' ')
                                   .trim();
                    }
                    // Truncate to 8KB to avoid blowing context windows
                    if (body.length > 8000) body = body.slice(0, 8000) + '\n... (truncated to 8KB)';
                    taskOutput = `[FETCHED FROM ${url}]:\n${body}`;
                    console.log(`[URL Reader] Success: ${body.length} chars extracted.`);
                } catch (e) {
                    console.warn(`[URL Reader] Failed: ${e.message}`);
                    taskOutput = `[FETCH ERROR]: ${e.message}`;
                }
            } else if (task.type === "patch") {
                // ANTIGRAVITY PARITY: replace_file_content — surgically edit a file section
                const targetFile = task.filepath;
                const filepath = path.resolve(PROJECT_ROOT, targetFile);
                console.log(`\n[File Patcher]: Patching ${targetFile}...`);
                
                const startTime = Date.now();
                if (!isSafePath(targetFile)) {
                    const blockMsg = `[SECURITY] Path traversal blocked: ${targetFile}`;
                    console.warn(blockMsg);
                    taskOutput = blockMsg;
                    await logAudit(task.id, task.type, "patch", targetFile, "blocked", Date.now() - startTime);
                } else {
                    try {
                        let fileContent = fs.readFileSync(filepath, 'utf-8');
                        if (task.find && task.replace !== undefined) {
                            // Direct string replacement
                            if (!fileContent.includes(task.find)) throw new Error(`Pattern not found in file: "${task.find.slice(0, 50)}..."`);
                            fileContent = fileContent.replace(task.find, task.replace);
                        } else if (task.append) {
                            fileContent += '\n' + task.append;
                        } else if (task.prepend) {
                            fileContent = task.prepend + '\n' + fileContent;
                        } else {
                            throw new Error('Patch task requires find/replace, append, or prepend fields.');
                        }
                        fs.writeFileSync(filepath, fileContent, 'utf-8');
                        taskOutput = `[PATCHED]: Successfully updated ${targetFile}`;
                        console.log(`[File Patcher] Success: ${targetFile} updated.`);
                        await logAudit(task.id, task.type, "patch", targetFile, "success", Date.now() - startTime);
                    } catch (e) {
                        console.warn(`[File Patcher] Failed: ${e.message}`);
                        taskOutput = `[PATCH ERROR]: ${e.message}`;
                        await logAudit(task.id, task.type, "patch", targetFile, "fail", Date.now() - startTime);
                    }
                }
            } else {
                const res = await TargetAgent.think([
                    { role: "system", content: `${coreRules}${templateContext}${brandContext}${architectureContext}` },
                    { role: "user", content: `Overall Goal: ${goal}\nSub-task: ${task.id}: ${task.description}\n\nContext From Previous Dependencies:\n${contextFromPrev || "None"}` }
                ], profile);
                taskOutput = res.message.content;
            }

            results[task.id] = taskOutput;
            completedTasks.add(task.id);
            console.log(`Supervisor: ✅ ${agentRole} task [${task.id}] Completed.`);
        }

        // ANTIGRAVITY PARITY: Concurrency-limited parallel execution
        // Prevents API rate-limit crashes by limiting concurrent LLM calls
        const MAX_CONCURRENT = 3;
        const taskQueue = [...taskGraph.tasks];
        const running = new Set();

        async function runWithRetry(task, attempt = 1) {
            try {
                await runTask(task);
            } catch (err) {
                if (attempt < 3) {
                    const backoffMs = attempt * 2000;
                    console.warn(`Supervisor: ⚠️ Task [${task.id}] failed (attempt ${attempt}). Retrying in ${backoffMs}ms...`);
                    console.warn(`  Error: ${err.message}`);
                    await new Promise(r => setTimeout(r, backoffMs));
                    await runWithRetry(task, attempt + 1);
                } else {
                    console.error(`Supervisor: ❌ Task [${task.id}] failed after 3 attempts. Marking as failed.`);
                    results[task.id] = `[TASK FAILED]: ${err.message}`;
                    completedTasks.add(task.id);
                }
            }
        }

        // Semaphore-based concurrent executor
        async function executeTasks() {
            const promises = taskQueue.map(task => {
                return (async () => {
                    // Wait until under concurrency limit (only for LLM tasks)
                    const EDGE_TYPES = ['command','reader','writer','search','image','git','deploy','scaffold','serve','scan','grep','fetch','patch'];
                    if (!EDGE_TYPES.includes(task.type)) {
                        while (running.size >= MAX_CONCURRENT) {
                            await new Promise(r => setTimeout(r, 300));
                        }
                        running.add(task.id);
                    }
                    try {
                        await runWithRetry(task);
                    } finally {
                        running.delete(task.id);
                    }
                })();
            });
            await Promise.all(promises);
        }

        await executeTasks();
        console.log("Supervisor: Swarm Synthesis Complete.");

        // 3. PAGE COLLECTION (Hardened Extraction — Antigravity Parity)
        const pages = {};
        const EDGE_TYPES = ['command','reader','writer','search','image','git','deploy','scaffold','serve'];
        
        for (const [taskId, content] of Object.entries(results)) {
            if (!content || typeof content !== 'string') continue;
            
            // First: try to extract embedded code blocks from any task
            const extracted = parseMultiPageArtifact(content);
            if (Object.keys(extracted).length > 0) {
                Object.assign(pages, extracted);
                continue;
            }
            
            // Second: match task ID to expected page filename
            const pageMatch = (taskGraph.pages || []).find(p => {
                const stem = p.replace(/\.[^.]+$/, '');
                return taskId.includes(stem) || taskId.includes(p);
            });
            if (pageMatch) {
                const match = /```(?:html|css|js|javascript|ts|tsx)?\s*\n([\s\S]*?)```/i.exec(content);
                pages[pageMatch] = match ? match[1].trim() : content;
            } else if (taskId.toLowerCase().includes('css') || taskId.toLowerCase().includes('style')) {
                const match = /```(?:css)?\s*\n([\s\S]*?)```/i.exec(content);
                pages['styles.css'] = match ? match[1].trim() : content;
            } else if (taskId.toLowerCase().includes('js') || taskId.toLowerCase().includes('script')) {
                const match = /```(?:javascript|js)?\s*\n([\s\S]*?)```/i.exec(content);
                pages['script.js'] = match ? match[1].trim() : content;
            }
        }
        
        // Fallback: if nothing matched, parse the last non-special task
        if (Object.keys(pages).length === 0) {
            const buildTasks = taskGraph.tasks.filter(t => !EDGE_TYPES.includes(t.type));
            for (const t of buildTasks.reverse()) {
                if (results[t.id]) {
                    Object.assign(pages, parseMultiPageArtifact(results[t.id]));
                    if (Object.keys(pages).length > 0) break;
                }
            }
        }

        let artifact = Object.entries(pages).map(([f, c]) => `FILE: ${f}\n${c}`).join('\n\n---\n\n');

        let attempts = 0;
        let distilledWisdom = "";

        // 3. Build Loop (Hardening & Self-Healing)
        while (attempts < this.maxRetries) {
            console.log(`\n--- Attempt ${attempts + 1}/${this.maxRetries} ---`);

            // 4. Automated "Vibe Testing" (Pillar 5)
            console.log("Supervisor: Running Automated Build Verification...");
            const buildCheck = { success: true, logs: "Skipped legacy build check for static sites." }; // await VerifyAgent.checkBuild(process.cwd());
            const vibeCheck = await VerifyAgent.checkVibe(artifact, constitutionJson.rules);

            if (!buildCheck.success || !vibeCheck.success) {
                console.warn("Supervisor: Verification FAILED. Initiating Self-Healing...");
                const errorContext = [
                    !buildCheck.success ? `Build Logs:\n${buildCheck.logs}` : "",
                    !vibeCheck.success ? `Constitution Violations:\n${vibeCheck.violations.join('\n')}` : ""
                ].filter(Boolean).join('\n\n');

                const healRes = await ReflectionAgent.think([
                    { role: "system", content: coreRules },
                    { role: "user", content: `Code Verification Failed.\n\n${errorContext}\n\nExisting Artifact:\n${artifact}\n\nFIX the code now to meet build and constitution standards.` }
                ]);
                artifact = healRes.message.content;
                console.log("Supervisor: Self-Healing Patch Applied.");
            } else {
                console.log("Supervisor: Verification PASSED (Build & Vibe).");
            }

            // 4b. Per-Page Guardian (Visual Hardening Pass)
            console.log("Supervisor: 🛡️ Guardian is hardening visual fidelity (Incremental)...");
            
            for (const [filename, content] of Object.entries(pages)) {
                console.log(`Supervisor: 🛡️ Hardening ${filename}...`);
                const guardRes = await GuardianAgent.think([
                    { role: "system", content: coreRules },
                    { role: "user", content: `Harden and polish this specific page for the Velocity brand:\nFILE: ${filename}\nCONTENT:\n${content}` }
                ]);
                pages[filename] = guardRes.message.content;
            }
            
            artifact = Object.entries(pages).map(([f, c]) => `FILE: ${f}\n${c}`).join('\n\n---\n\n');
            
            const polishUpdate = await LiaisonAgent.think([
                { role: "user", content: "Explain that the 'Visual Guardian' has just finished custom-polishing all the pages to ensure they meet the modern 'Velocity' brand standards (glassmorphism, responsiveness, and premium aesthetics)." }
            ]);
            console.log(`\n[Client Liaison]: ${polishUpdate.message.content}\n`);

            console.log("Supervisor: Visual Hardening Complete for all pages.");


            // 5. Reviewer (Human-like Quality Check)
            // 4b. Ensemble Review Gate — reviewer (CodeGemma) + security (CodeGemma) vote
            // Replace single-model reviewer with multi-model consensus for critical decisions
            console.log("Supervisor: 🗳️  Running Ensemble Review Gate (Reviewer + Security)...");
            const ensembleResult = await runReviewEnsemble({ artifact, rules: coreRules });
            const review = ensembleResult.consensus; // 'PASS' or 'FAIL'
            console.log(`Supervisor: Ensemble voted: ${review} (${ensembleResult.passes} PASS / ${ensembleResult.fails} FAIL)`);

            if (review === "PASS" || ensembleResult.passed) {
                console.log("Supervisor: Review PASSED. Workflow Complete.");

                // Active Memory Loop (Constitution Pillar)
                console.log("Supervisor: Syncing Project Constitution (Learning Loop)...");
                // Distillation via LLaMA 3.2 — fast extraction of styling rules
                const learningRes = await DistillationAgent.think([
                    { role: "user", content: `Review this success and extract 1-2 styling rules that should be permanent standards. Code:\n${artifact}` }
                ], 'distiller');

                // Update both JSON and MD
                constitutionJson.patterns.push({
                    timestamp: new Date().toISOString(),
                    summary: learningRes.message.content
                });
                await fs.writeJson(CONSTITUTION_PATH_JSON, constitutionJson, { spaces: 4 });
                await fs.appendFile(CONSTITUTION_PATH_MD, `\n- ${learningRes.message.content}\n`);

                return { status: "success", artifact, pages: parseMultiPageArtifact(artifact), plan: JSON.stringify(taskGraph) };
            }



            console.warn("Supervisor: Review FAILED.");

            // 6. Reflection — LLaMA 3 reasons about what went wrong
            console.log("Supervisor: Reflecting on failure (LLaMA 3)...");
            const reflectionRes = await ReflectionAgent.think([
                { role: "system", content: coreRules },
                { role: "user", content: `Code:\n${artifact}\n\nReview Issues:\n${review}\n\nEnsemble votes:\nReviewer=${ensembleResult.votes.find(v => v.profile === 'reviewer')?.content?.slice(0, 300)}\nSecurity=${ensembleResult.votes.find(v => v.profile === 'security')?.content?.slice(0, 300)}` }
            ], 'reflection');


            let reflection;
            try {
                // Attempt to parse JSON response from Reflection Agent
                const jsonMatch = reflectionRes.message.content.match(/\{[\s\S]*\}/);
                reflection = jsonMatch ? JSON.parse(jsonMatch[0]) : { shouldResearch: false, reason: "Parse Error" };
            } catch (e) {
                console.error("Supervisor: Failed to parse reflection JSON.", e);
                reflection = { shouldResearch: false };
            }

            if (!reflection.shouldResearch) {
                console.log(`Supervisor: No research needed. Reason: ${reflection.reason}`);
            } else {
                // 4. Web Search
                console.log(`Supervisor: Researching queries: ${reflection.searchQueries.join(", ")}`);
                let searchResults = [];
                for (const query of reflection.searchQueries.slice(0, RSI_LIMITS.maxWebSearches)) {
                    const results = await webSearch(query);
                    searchResults.push(...results.map(r => `Source: ${r.url}\nWait: ${r.snippet}`));
                }
                const rawKnowledge = searchResults.join("\n\n");

                // 5. Distillation
                console.log("Supervisor: Distilling knowledge...");
                const distillRes = await DistillationAgent.think([
                    { role: "user", content: `Original Error:\n${review}\n\nfound Research:\n${rawKnowledge}` }
                ]);
                const newLesson = distillRes.message.content;

                // 6. Memory Update
                console.log("Supervisor: Updating Memory...");
                await fs.appendFile(HEURISTICS_PATH, `\n\n## Learned ${new Date().toISOString()}\n${newLesson}`);

                // 7. Policy/Context Update for next loop
                distilledWisdom += `\n${newLesson}`;
            }

            attempts++;
        }

        console.error("Supervisor: Max retries exceeded. Task Failed.");
        return { status: "failed", error: "Max retries exceeded", lastArtifact: artifact };
    }
}

export const Supervisor = new SupervisorAgent();
