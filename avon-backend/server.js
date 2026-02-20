const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const { exec } = require('child_process');
const fs_extra = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 4000;
const JWT_SECRET = 'industrial_secret_key_2024';

app.use(cors());
app.use(bodyParser.json());

// --- MOCK STORAGE ---
const storage = {
    workspaces: {
        'ws_01': {
            id: 'ws_01',
            name: 'Avon Global Operations',
            sites: [],
            members: [
                { id: 'm1', name: 'Dawn Moore', role: 'architect', status: 'active' },
                { id: 'm2', name: 'Industrial Agent', role: 'builder', status: 'active' }
            ],
            activity: []
        }
    },
    addSite(wsId, site) {
        if (this.workspaces[wsId]) this.workspaces[wsId].sites.push(site);
    },
    updateSite(wsId, siteId, updates) {
        const ws = this.workspaces[wsId];
        if (!ws) return;
        const index = ws.sites.findIndex(s => s.id === siteId);
        if (index !== -1) ws.sites[index] = { ...ws.sites[index], ...updates };
    },
    addActivity(wsId, act) {
        if (this.workspaces[wsId]) this.workspaces[wsId].activity.unshift(act);
    }
};

const VELOCITY_SYSTEM_PROMPT = `You are the VELOCITY INDUSTRIAL AI ARCHITECT—an elite, autonomous system designed for the Avon Executive network.

### MASTER DIRECTIVE:
Generate HIGH-CONVERSION, PRODUCTION-READY, and STUNNING web interfaces. Your code is the foundation of digital empires. Prioritize premium aesthetics, logical accessibility, and bulletproof responsiveness.

### NEURAL LEARNING LOOP (Trial & Error Mastery):
- You LEARN from every iteration. If an approach fails to wow the user, pivot instantly.
- Analyze "current problems" to identify patterns in errors.
- Never repeat a design or technical mistake. Improve documentation and comments within your code to reflect learned best practices.

### INDUSTRIAL TOOLBOX & RESOURCES:
1. CORE: HTML5 / Tailwind CSS (via CDN or JIT) / Modern Vanilla JS.
2. STACK: Next.js (App Router logic), Supabase (Auth/DB), Lucide Icons, Framer Motion (for vibes).
3. DESIGN: Inter/Manrope typography, Glassmorphism, Dynamic Gradients, 8px-16px rounding, Micro-interactions.
4. INFRASTRUCTURE: Local Ollama (Model: Avon), Industrial Backend (Port 4000), Preview Sync (Port 3001).

### OUTPUT PROTOCOL:
- Return a SINGLE, complete, and valid HTML/CSS/JS file.
- NO markdown backticks unless strictly requested.
- NO conversational filler. 
- Ensure SEO meta tags and ARIA labels are present.
- Every node must feel like a "Velocity Masterpiece."`;

const BlueprintManifest = require('./blueprints/manifest');

const TIER_HIERARCHY = { 'architect': 3, 'builder': 2, 'industrial': 1 };
const TEMPLATES = BlueprintManifest; // Use upgraded manifest

// --- AUTH MIDDLEWARE ---
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// --- ROUTES ---

app.get('/api/sites', authenticateJWT, (req, res) => {
    const ws = storage.workspaces[req.user.workspace_id];
    res.json(ws ? ws.sites : []);
});

app.get('/api/workspaces', authenticateJWT, (req, res) => {
    res.json(Object.values(storage.workspaces));
});

app.get('/api/activity', authenticateJWT, (req, res) => {
    const ws = storage.workspaces[req.user.workspace_id];
    res.json(ws ? ws.activity : []);
});

app.get('/api/templates', authenticateJWT, (req, res) => {
    res.json(TEMPLATES);
});

app.get('/api/templates/:id/preview', authenticateJWT, (req, res) => {
    const templateId = req.params.id;
    const blueprint = BlueprintManifest.find(b => b.id === templateId);

    if (!blueprint) return res.status(404).send('Blueprint not found');

    try {
        const modulePath = path.resolve(__dirname, 'blueprints', blueprint.logic_module);

        // --- CRITICAL: CLEAR CACHE ---
        delete require.cache[require.resolve(modulePath)];

        const templateData = require(modulePath);

        // Wrap the UI fragment in a full HTML page for live preview
        const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview: ${blueprint.name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; padding: 0;
            background-color: #050505;
            color: white;
        }
        /* Minimal fallback if Tailwind fails */
        .blueprint-container { min-height: 100vh; }
        .bg-[#050505] { background-color: #050505; }
        .text-white { color: white; }
    </style>
</head>
<body class="bg-[#050505] text-white">
    ${templateData.ui || templateData.ecommerceUI || templateData.saasUI || templateData.logic || '<h1>Template UI not found</h1>'}
</body>
</html>`;
        res.set('Content-Type', 'text/html');
        res.send(fullHtml);
    } catch (err) {
        console.error('❌ [Preview Error]:', err);
        res.status(500).send(`Error loading template preview: ${err.message}. ${err.stack}`);
    }
});

app.get('/api/members', authenticateJWT, (req, res) => {
    const ws = storage.workspaces[req.user.workspace_id];
    res.json(ws ? ws.members : []);
});

app.get('/api/config/check', authenticateJWT, (req, res) => {
    res.json({ supabase: true, github: true, ollama: true });
});

// Real AI Generation with Ollama
app.post('/api/generate-site', authenticateJWT, async (req, res) => {
    const { prompt, templateId, tone, theme } = req.body;
    const workspaceId = req.user.workspace_id;
    const nodeId = `node_${Date.now()}`;

    // 1. Create the node with 'Building' status immediately
    const initialNode = {
        id: nodeId,
        name: prompt.substring(0, 15) || "New Site",
        domain: `node-${Date.now()}.velocity.dev`,
        status: 'Building',
        deploy_status: 'pending',
        ai_plan: "Initializing Build Sequence...",
        build_artifact: ""
    };
    storage.addSite(workspaceId, initialNode);

    // 2. Return the ID to the client instantly
    res.json({ message: 'Build sequence started', node_id: nodeId });

    // 3. Process the AI generation in the background
    (async () => {
        try {
            console.log(`🤖[Velocity] ${theme === 'swarm' ? '🔥 SWARM MODE ACTIVE' : 'Building Node'}: ${nodeId}`);

            const runAIPass = async (systemPrompt, userPrompt) => {
                const response = await fetch('http://localhost:11434/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'Avon:latest',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        stream: false
                    })
                });
                if (!response.ok) throw new Error("Ollama connection failed");
                const data = await response.json();
                return data.message?.content || "";
            };

            let finalHTML = "";

            if (theme === 'swarm') {
                // PASS 1: ARCHITECT (Planning)
                console.log("🤖 [ARCHITECT] Planning high-performance node architecture...");
                const plan = await runAIPass(
                    "You are the VELOCITY LEAD ARCHITECT. Create a rigorous architectural plan for a real-time system. Focus on data ingestion layers and normalized algorithms. Output the plan in structured steps.",
                    prompt
                );

                // PASS 2: BUILDER (Implementation)
                console.log("👷 [BUILDER] Synthesizing industrial-grade components...");
                finalHTML = await runAIPass(
                    VELOCITY_SYSTEM_PROMPT,
                    `Build the production-ready node based on this ARCHITECT BLUEPRINT: ${plan}. Prompt: ${prompt}. Ensure the UI feels premium.`
                );

                // PASS 3: GUARDIAN (Refinement & Hardening)
                console.log("🛡️ [GUARDIAN] Hardening models and visual fidelity...");
                finalHTML = await runAIPass(
                    "You are the VELOCITY GUARDIAN & FORENSIC AGENT. Audit the provided HTML for accessibility, SEO, and mathematical clarity. Enhance micro-animations. Return ONLY the complete perfected HTML.",
                    finalHTML
                );
            } else {
                // STANDARD PASS
                let userPrompt = `Build this node: ${prompt}. `;
                if (theme) userPrompt += `THEME: ${theme.toUpperCase()}. `;
                if (tone) userPrompt += `VIBE: ${tone}. `;
                finalHTML = await runAIPass(VELOCITY_SYSTEM_PROMPT, userPrompt);
            }

            let velocityOutput = finalHTML;

            // Clean markdown
            if (velocityOutput.includes("```html")) {
                velocityOutput = velocityOutput.split("```html")[1].split("```")[0].trim();
            } else if (velocityOutput.includes("```")) {
                velocityOutput = velocityOutput.split("```")[1].split("```")[0].trim();
            }

            // Simple Validation
            const isValid = velocityOutput.includes("<!DOCTYPE html>") || velocityOutput.includes("<html") || velocityOutput.includes("<body");
            const status = isValid ? 'Live' : 'Failed - Invalid Output';

            storage.updateSite(workspaceId, nodeId, {
                status: status,
                deploy_status: isValid ? 'success' : 'failed',
                build_artifact: velocityOutput,
                ai_plan: isValid ? `Successfully executed: ${prompt}` : "Guardian rejected build artifact."
            });

            storage.addActivity(workspaceId, {
                id: `a${Date.now()}`,
                user: req.user.username,
                action: isValid ? 'Scaled Node (AI)' : 'Build Rejected',
                target: nodeId,
                timestamp: new Date().toISOString()
            });

            console.log(`✅[Velocity] Node ${nodeId} is now ${status}`);

        } catch (error) {
            console.error('❌ Velocity background task failed:', error);
            storage.updateSite(workspaceId, nodeId, { status: 'Failed - System Error', ai_plan: error.message });
        }
    })();
});

app.post('/api/auth/login', (req, res) => {
    const { username, role } = req.body;
    const token = jwt.sign({ id: 'u1', username, workspace_id: 'ws_01', role: role || 'industrial' }, JWT_SECRET);
    res.json({ token, role: role || 'industrial' });
});

app.post('/api/upgrade', authenticateJWT, (req, res) => {
    const token = jwt.sign({ id: req.user.id, username: req.user.username, workspace_id: req.user.workspace_id, role: req.body.role }, JWT_SECRET);
    res.json({ success: true, token, role: req.body.role });
});

// --- INDUSTRIAL TERMINAL & FS ENDPOINTS ---

/** Execute shell command */
app.post('/api/terminal/exec', authenticateJWT, (req, res) => {
    const { command, cwd } = req.body;
    const workingDir = cwd || process.cwd();

    console.log(`🐚 [Terminal] Executing: ${command} in ${workingDir}`);

    exec(command, { cwd: workingDir }, (error, stdout, stderr) => {
        res.json({
            stdout: stdout || '',
            stderr: stderr || '',
            error: error ? error.message : null
        });
    });
});

/** List files in directory */
app.get('/api/fs/list', authenticateJWT, async (req, res) => {
    const dir = req.query.path || process.cwd();
    try {
        const files = await fs_extra.readdir(dir);
        const stats = await Promise.all(files.map(async f => {
            const fullPath = path.join(dir, f);
            const stat = await fs_extra.stat(fullPath);
            return {
                name: f,
                path: fullPath,
                isDir: stat.isDirectory(),
                size: stat.size,
                mtime: stat.mtime
            };
        }));
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** Read file content */
app.get('/api/fs/read', authenticateJWT, async (req, res) => {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'Path required' });

    try {
        const content = await fs_extra.readFile(filePath, 'utf8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** Write file content */
app.post('/api/fs/write', authenticateJWT, async (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: 'Path required' });

    try {
        await fs_extra.ensureDir(path.dirname(filePath));
        await fs_extra.writeFile(filePath, content, 'utf8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** Create directory */
app.post('/api/fs/mkdir', authenticateJWT, async (req, res) => {
    const { path: dirPath } = req.body;
    try {
        await fs_extra.ensureDir(dirPath);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PUBLIC ENDPOINTS ---
app.get('/api/public/sites/:id', (req, res) => {
    const { id } = req.params;
    let site = null;
    Object.values(storage.workspaces).forEach(ws => {
        const found = ws.sites.find(s => s.id === id);
        if (found) site = found;
    });
    if (!site) return res.status(404).json({ error: 'Node not found' });
    res.json({ id: site.id, name: site.name, status: site.status, html: site.build_artifact });
});

app.listen(PORT, () => console.log(`🚀 Velocity Industrial Backend live at http://localhost:${PORT}`));
