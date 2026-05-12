import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { exec } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import fse from 'fs-extra';
import { rateLimit } from 'express-rate-limit';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' }) 
    : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET environment variable is required. Set it in your .env file.');
    process.exit(1);
}

// --- Supabase (Service Role for server-side trust) ---
// DS-002: Use SUPABASE_SERVICE_ROLE_KEY — never the anon key — for all server→Supabase calls.
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!process.env.SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ FATAL: SUPABASE_URL and a valid Supabase key (SERVICE_ROLE or ANON) must be set in environment.');
    process.exit(1);
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ WARNING: Using SUPABASE_ANON_KEY. Server-side actions may be limited by RLS policies.');
}
const supabase = createClient(
    process.env.SUPABASE_URL,
    SUPABASE_KEY
);

app.use(cors({ origin: '*' }));
app.use(express.json());

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

// --- STATUS ---
app.get('/', (req, res) => {
    res.json({ status: "Avon Backend Online", engine: process.env.EVOLUTION_MODE || "standby", docs: "/monitor" });
});

// --- HEALTH ---
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        database: 'supabase',
        agents: { supervisor: 'active', architect: 'ready', builder: 'ready', guardian: 'ready' },
        provider: process.env.OPENAI_API_KEY ? 'openai (cloud)' : 'ollama (local)'
    });
});

// --- AUTH: Register ---
app.post('/api/auth/register', async (req, res) => {
    const { email, password, full_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name } }
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const userId = authData.user?.id;

    // Upsert profile
    await supabase.from('profiles').upsert({
        id: userId,
        full_name,
        email,
        updated_at: new Date().toISOString()
    });

    // Create default workspace for this user
    const { data: ws } = await supabase.from('workspaces').insert({
        name: `${full_name || email}'s Workspace`,
        owner_id: userId
    }).select().single();

    const token = jwt.sign({
        id: userId,
        email,
        workspace_id: ws?.id,
        role: 'owner'
    }, JWT_SECRET);

    res.json({ token, user: { id: userId, email, full_name }, workspace: ws });
});

// --- AUTH: Login ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password, username, role } = req.body;

    // Support legacy username-only login (for dashboard auto-login)
    if (username && !password) {
        const token = jwt.sign({ id: 'guest', username, workspace_id: null, role: role || 'explorer' }, JWT_SECRET);
        return res.json({ token, role: role || 'explorer' });
    }

    // Real Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return res.status(401).json({ error: authError.message });

    const userId = authData.user.id;

    // Fetch user's workspace
    const { data: ws } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

    const token = jwt.sign({
        id: userId,
        email: authData.user.email,
        workspace_id: ws?.id,
        role: 'owner'
    }, JWT_SECRET);

    res.json({ token, user: profile, workspace: ws });
});

// --- SITES ---
app.get('/api/sites', authenticateJWT, async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);

    const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
});

app.delete('/api/sites/:id', authenticateJWT, async (req, res) => {
    const { error } = await supabase.from('sites').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// --- WORKSPACES ---
app.get('/api/workspaces', authenticateJWT, async (req, res) => {
    const userId = req.user.id;
    const { data, error } = await supabase.from('workspaces').select('*').eq('owner_id', userId);
    if (error) return res.json([]);
    res.json(data || []);
});

// --- GENERATE SITE (Supabase-backed) ---
app.post('/api/generate-site', authenticateJWT, async (req, res) => {
    const { prompt, theme } = req.body;
    let workspaceId = req.user?.workspace_id || null;

    // Create site record in Supabase
    const { data: site, error } = await supabase.from('sites').insert({
        workspace_id: workspaceId,
        site_name: prompt.substring(0, 40) || 'New Site',
        domain: `node-${Date.now()}.avon.dev`,
        status: 'pending',
        config: { prompt, theme, ai_plan: 'Initializing Swarm...' }
    }).select().single();

    let siteId = site?.id;

    if (error) {
        console.warn('⚠️ Supabase Insert Failed (RLS issue?), proceeding in local mode.', error.message);
        siteId = `local-${Date.now()}`;
    }

    // Respond immediately
    res.json({ message: 'Build started', node_id: siteId });

    // Background Swarm execution
    (async () => {
        try {
            const { Supervisor } = await import('../agents/supervisor.js');
            const result = await Supervisor.execute(prompt);
            const status = result.status === 'success' ? 'active' : 'failed';

            // Multi-page build: save individual page files to disk
            const pages = result.pages || {};
            const pageCount = Object.keys(pages).length;
            if (pageCount > 0) {
                const buildDir = path.resolve(__dirname, '..', '.shadow_build', String(siteId));
                await fse.ensureDir(buildDir);
                for (const [filename, content] of Object.entries(pages)) {
                    await fse.writeFile(path.join(buildDir, filename), content, 'utf8');
                }
                console.log(`📄 [Multi-Page] Saved ${pageCount} files to ${buildDir}`);
            }

            if (!error) {
                await supabase.from('sites').update({
                    status,
                    config: {
                        prompt, theme,
                        ai_plan: result.plan || '',
                        build_artifact: result.artifact || '',
                        pages: Object.keys(pages),
                        page_count: pageCount
                    },
                    updated_at: new Date().toISOString()
                }).eq('id', siteId);
                console.log(`✅ [Supabase] Site ${siteId} updated. Status: ${status}, Pages: ${pageCount}`);
            } else {
                console.log(`✅ [Local] Site ${siteId} built successfully. Status: ${status}, Pages: ${pageCount}`);
            }
        } catch (err) {
            console.error('❌ Swarm error:', err.message);
            // Only update Supabase if we have a real (non-local) site ID
            if (!error && siteId && !String(siteId).startsWith('local-')) {
                await supabase.from('sites').update({
                    status: 'failed',
                    config: { prompt, theme, ai_plan: err.message }
                }).eq('id', siteId);
            }
        }
    })();
});

// --- PUBLIC SITE LOOKUP ---
app.get('/api/public/sites/:id', async (req, res) => {
    const { data, error } = await supabase.from('sites').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    res.json({
        id: data.id,
        name: data.site_name,
        status: data.status,
        html: data.config?.build_artifact || '',
        ai_plan: data.config?.ai_plan || '',
        pages: data.config?.pages || [],
        page_count: data.config?.page_count || 1
    });
});

// --- PUBLIC SITE PAGE LOOKUP (Multi-Page Builds) ---
app.get('/api/public/sites/:id/:page', async (req, res) => {
    const { id, page } = req.params;
    // Sanitize page name — only allow alphanumeric, hyphens, underscores, and dots
    if (!/^[\w\-.]+\.html$/.test(page)) {
        return res.status(400).json({ error: 'Invalid page name' });
    }
    try {
        const buildDir = path.resolve(__dirname, '..', '.shadow_build', String(id));
        const filePath = path.join(buildDir, page);
        // Ensure the final path is within the build directory (prevent traversal)
        if (!filePath.startsWith(buildDir)) {
            return res.status(403).json({ error: 'Path traversal detected' });
        }
        const exists = await fse.pathExists(filePath);
        if (!exists) return res.status(404).json({ error: `Page '${page}' not found for site ${id}` });
        const content = await fse.readFile(filePath, 'utf8');
        res.type('html').send(content);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PREVIEW FILE SERVER (serves built sites for in-dashboard iframe) ---
app.get(['/api/preview/:buildDir', '/api/preview/:buildDir/:page'], async (req, res) => {
    const { buildDir } = req.params;
    const page = req.params.page || 'index.html';
    // Sanitize inputs
    if (!/^[\w\-. ]+$/.test(buildDir) || !/^[\w\-.]+\.(html|css|js)$/.test(page)) {
        return res.status(400).json({ error: 'Invalid path' });
    }
    try {
        const previewsRoot = path.resolve(__dirname, '..', 'previews');
        const filePath = path.join(previewsRoot, buildDir, page);
        // Prevent traversal
        if (!filePath.startsWith(previewsRoot)) {
            return res.status(403).json({ error: 'Path traversal detected' });
        }
        const exists = await fse.pathExists(filePath);
        if (!exists) return res.status(404).json({ error: `File not found: ${buildDir}/${page}` });
        const content = await fse.readFile(filePath, 'utf8');
        const ext = path.extname(page).toLowerCase();
        const mimeMap = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
        res.type(mimeMap[ext] || 'text/plain').send(content);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- LIST PREVIEW BUILDS (for the dashboard to discover completed builds) ---
app.get('/api/preview', authenticateJWT, async (req, res) => {
    try {
        const previewsRoot = path.resolve(__dirname, '..', 'previews');
        const items = await fse.readdir(previewsRoot, { withFileTypes: true });
        const builds = items
            .filter(item => item.isDirectory() && item.name.startsWith('build_'))
            .map(item => ({
                name: item.name,
                previewUrl: `/api/preview/${encodeURIComponent(item.name)}/`
            }));
        res.json(builds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TERMINAL EXEC (DS-001: Allowlist + metacharacter guard) ---
const TERMINAL_ALLOWED_COMMANDS = [
    'node --check',
    'npm install',
    'npm run',
    'npm test',
    'npx tsc',
    'git status',
    'git log',
    'git diff',
    'ls',
    'ls -R',
    'dir',
    'echo',
    'cat',
    'type',
    'pwd',
    'touch',
    'mkdir',
    'rm',
    'rm -rf',
];

const SHELL_METACHARACTERS = /[;&|><`$(){}\[\]!#~]/;

app.post('/api/terminal/exec', authenticateJWT, (req, res) => {
    const { command, cwd } = req.body;

    if (!command || typeof command !== 'string') {
        return res.status(400).json({ error: 'command is required and must be a string' });
    }

    // DS-001: Reject shell metacharacters that enable injection
    if (SHELL_METACHARACTERS.test(command)) {
        return res.status(403).json({
            error: 'Command rejected: shell metacharacters are not permitted',
            hint: 'Use simple commands without ; | && || > < ` $ etc.'
        });
    }

    // DS-001: Allowlist check — command must start with an approved prefix
    const isAllowed = TERMINAL_ALLOWED_COMMANDS.some(prefix =>
        command.trim().startsWith(prefix)
    );
    if (!isAllowed) {
        return res.status(403).json({
            error: 'Command rejected: not in the approved command allowlist',
            allowed: TERMINAL_ALLOWED_COMMANDS
        });
    }

    exec(command, { cwd: cwd || process.cwd(), timeout: 30_000 }, (error, stdout, stderr) => {
        res.json({ stdout: stdout || '', stderr: stderr || '', error: error ? error.message : null });
    });
});

// --- FS ---

// DS-004: Hide internal/sensitive files from the file explorer
const FS_HIDDEN = new Set([
    '.env', '.env.example', '.env.railway', '.git', '.github', '.gitignore',
    '.velocity', '.velocity_constitution.json', '.vscode', '.wwebjs_auth',
    '.wwebjs_cache', '.shadow_build', '.agent', '.antigravityignore',
    'node_modules', 'package-lock.json',
    'kernel', 'agents', 'providers', 'swarm', 'io', 'llm_c', 'memory',
    'autoresearch_repo', 'avon_evolve.js', 'cli.js', 'main.js',
    'whatsapp_bot.js', 'Modelfile', 'supabase_schema.sql',
    'supabase_storage_setup.sql', 'reg.json', 'build_manifest.json',
    'avon-backend', 'avon-dashboard', 'avon-velocity-frontend',
    'app_v2_recovered.js', 'railway.json',
    'PROJECT_CONSTITUTION.md', 'PROMPT_PLAN.md', 'VELOCITY_BLUEPRINT.md',
    'ARCHITECTURE.md', 'Mission_Manifest.json', 'build_plan.md'
]);

/** GET /api/fs/list — list a directory (filtered for safety) */
app.get('/api/fs/list', authenticateJWT, async (req, res) => {
    const queryPath = req.query.path || '.';
    try {
        const root = path.resolve(__dirname, '..');
        const target = path.resolve(root, String(queryPath));

        if (!target.startsWith(root)) {
            return res.status(403).json({ error: 'Out of bounds' });
        }

        const items = await fse.readdir(target, { withFileTypes: true });
        // Only filter at the root level; sub-directories are shown in full
        const isRoot = path.normalize(target) === path.normalize(root);
        const result = items
            .filter(item => !isRoot || !FS_HIDDEN.has(item.name))
            .map(item => ({
                name: item.name,
                isDirectory: item.isDirectory(),
                path: path.relative(root, path.join(target, item.name)).replace(/\\/g, '/')
            }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/fs/read — read a file */
app.get('/api/fs/read', authenticateJWT, async (req, res) => {
    const queryPath = req.query.path;
    if (!queryPath) return res.status(400).json({ error: 'path is required' });
    try {
        const root = path.resolve(__dirname, '..');
        const target = path.resolve(root, String(queryPath));
        if (!target.startsWith(root)) return res.status(403).json({ error: 'Out of bounds' });

        const content = await fse.readFile(target, 'utf8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** POST /api/fs/write — write a file */
app.post('/api/fs/write', authenticateJWT, async (req, res) => {
    const { path: queryPath, content } = req.body;
    if (!queryPath) return res.status(400).json({ error: 'path is required' });
    try {
        const root = path.resolve(__dirname, '..');
        const target = path.resolve(root, String(queryPath));
        if (!target.startsWith(root)) return res.status(403).json({ error: 'Out of bounds' });

        await fse.ensureDir(path.dirname(target));
        await fse.writeFile(target, content, 'utf8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** POST /api/fs/publish — push a path to GitHub */
/** POST /api/fs/publish — Render build and push to GitHub */
app.post('/api/fs/publish', authenticateJWT, async (req, res) => {
    const { path: queryPath } = req.body;
    if (!queryPath) return res.status(400).json({ error: 'path is required' });
    try {
        const root = path.resolve(__dirname, '..');
        const target = path.resolve(root, String(queryPath));
        if (!target.startsWith(root)) return res.status(403).json({ error: 'Out of bounds' });

        // DS-005: Determine the actual project directory to publish
        // If we are in previews/, publish the entire directory so links work.
        let publishPath = queryPath;
        let isPreview = false;
        if (queryPath.startsWith('previews/')) {
            const parts = queryPath.split('/');
            if (parts.length > 1) {
                publishPath = path.join(parts[0], parts[1]).replace(/\\/g, '/');
                isPreview = true;
            }
        }

        // 1. RENDER BUILD (High-Fidelity harding before live push)
        if (isPreview) {
            console.log(`🏗️ [Publish] Rendering final build for: ${publishPath}`);
            try {
                const { Supervisor } = await import('../agents/supervisor.js');
                // Use a "Hardening" goal to ensure all links and assets are optimized
                await Supervisor.execute(`Refine and optimize the industrial build in ${publishPath}. Ensure all page links work and styles are perfectly integrated.`);
            } catch (err) {
                console.warn(`⚠️ [Publish] Build hardening failed, proceeding with current files: ${err.message}`);
            }
        }

        // Git commands
        // 1. Add (use the determined publishPath to include all pages/assets)
        await new Promise((resolve, reject) => {
            exec(`git add "${publishPath}"`, { cwd: root }, (err) => err ? reject(err) : resolve());
        });
        // 2. Commit
        await new Promise((resolve, reject) => {
            exec(`git commit -m "feat: publish ${publishPath} (full build) at ${new Date().toISOString()}"`, { cwd: root }, (err) => {
                resolve(); // Ignore "nothing to commit"
            });
        });
        // 3. Push
        await new Promise((resolve, reject) => {
            exec(`git push origin main`, { cwd: root }, (err, stdout, stderr) => {
                if (err) {
                    console.error("Push failed", stderr);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        const repoName = 'avon_agent';
        const userName = 'avonway';
        // If it was a preview directory, point to index.html as the entry point
        const entryPoint = isPreview ? `${publishPath}/index.html` : queryPath;
        const liveUrl = `https://${userName}.github.io/${repoName}/${entryPoint.replace(/\\/g, '/')}`;

        res.json({ success: true, url: liveUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CHAT ---
app.post('/api/chat', async (req, res) => {
    const { messages, model, profile, system } = req.body;
    try {
        const { runModel } = await import('../kernel/modelRouter.js');
        const response = await runModel({
            model: model || 'Avon_Agent',
            profile: profile || 'standard',
            messages,
            system
        });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- STRIPE & CONFIG ---
app.get('/api/config/check', authenticateJWT, (req, res) => {
    res.json({
        stripe: !!process.env.STRIPE_SECRET_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY,
        mode: process.env.EVOLUTION_MODE || 'standby'
    });
});

app.post('/api/stripe/create-checkout-session', authenticateJWT, async (req, res) => {
    if (!stripe) return res.status(400).json({ error: 'Stripe is not configured on this node.' });
    
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Velocity Professional Tier' },
                    unit_amount: 4900,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin || 'http://localhost:3000'}/profile?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || 'http://localhost:3000'}/profile`,
            client_reference_id: req.user.id,
            customer_email: req.user.email,
        });
        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── EVOLUTION ENGINE ROUTES ──────────────────────────────

// Lazy-loaded engine singleton (avoids import-time errors if kernel not ready)
let _evolutionEngine = null;
async function getEngine() {
    if (!_evolutionEngine) {
        const { AvonEvolutionEngine } = await import('../kernel/evolutionEngine.js');
        _evolutionEngine = new AvonEvolutionEngine({ intervalMs: 60_000 });
    }
    return _evolutionEngine;
}

/** GET /api/evolution/status — current engine + manifest state */
app.get('/api/evolution/status', async (req, res) => {
    try {
        const fs = await import('fs-extra');
        const pathMod = await import('path');
        const { fileURLToPath } = await import('url');
        const __fn = fileURLToPath(import.meta.url);
        const __dn = pathMod.default.dirname(__fn);
        const ROOT = pathMod.default.resolve(__dn, '..');

        const manifestPath = pathMod.default.join(ROOT, 'Mission_Manifest.json');
        const telemetryPath = pathMod.default.join(ROOT, 'memory', 'telemetry.jsonl');

        const manifest = await fs.default.readJson(manifestPath).catch(() => null);

        // Read last 5 telemetry entries
        const telemetryRaw = await fs.default.readFile(telemetryPath, 'utf8').catch(() => '');
        const telemetryLines = telemetryRaw.trim().split('\n').filter(Boolean).slice(-5);
        const telemetry = telemetryLines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

        const engine = await getEngine();
        res.json({
            engine: {
                running: engine.monitor?._running ?? false,
                cycles: engine._cycles ?? 0,
                evolving: engine._evolving ?? false,
            },
            manifest: {
                version: manifest?.version,
                objectives: manifest?.objectives,
                lastEvolution: manifest?.evolution_history?.slice(-1)[0] ?? null,
                totalEvolutions: manifest?.evolution_history?.length ?? 0
            },
            telemetry
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/evolution/history — full evolution event log */
app.get('/api/evolution/history', authenticateJWT, async (req, res) => {
    try {
        const fs = await import('fs-extra');
        const pathMod = await import('path');
        const { fileURLToPath } = await import('url');
        const __fn = fileURLToPath(import.meta.url);
        const __dn = pathMod.default.dirname(__fn);
        const ROOT = pathMod.default.resolve(__dn, '..');

        const logPath = pathMod.default.join(ROOT, 'memory', 'evolution_log.jsonl');
        const raw = await fs.default.readFile(logPath, 'utf8').catch(() => '');
        const lines = raw.trim().split('\n').filter(Boolean).slice(-50);
        const entries = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
        res.json({ entries: entries.reverse() }); // newest first
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/evolution/manifest — read live Mission Manifest */
app.get('/api/evolution/manifest', async (req, res) => {
    try {
        const fs = await import('fs-extra');
        const pathMod = await import('path');
        const { fileURLToPath } = await import('url');
        const __fn = fileURLToPath(import.meta.url);
        const __dn = pathMod.default.dirname(__fn);
        const ROOT = pathMod.default.resolve(__dn, '..');

        const manifest = await fs.default.readJson(pathMod.default.join(ROOT, 'Mission_Manifest.json'));
        res.json(manifest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DS-003: Rate Limiting to Evolution Trigger (5 req / 15 min)
const evolutionTriggerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { error: 'Too many evolution triggers from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

/** POST /api/evolution/trigger — manually trigger one evolution cycle */
app.post('/api/evolution/trigger', authenticateJWT, evolutionTriggerLimiter, async (req, res) => {

    try {
        const engine = await getEngine();
        if (engine._evolving) {
            return res.status(409).json({ error: 'Evolution cycle already in progress' });
        }

        // Simulate a "force" trigger with a mock issue report
        const mockIssue = {
            latencyBreached: true,
            latencyMs: 9999,
            memoryMB: 256,
            metrics: { timestamp: new Date().toISOString(), forced: true }
        };
        const mockSecurity = { vulnerabilities: [], critical: false, high: false };

        // Fire async, don't await
        engine._triggerEvolutionLoop({ issueReport: mockIssue, securityReport: mockSecurity })
            .catch(console.error);

        res.json({ message: 'Evolution cycle triggered', cycle: engine._cycles + 1 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** POST /api/evolution/start — start the monitor loop */
app.post('/api/evolution/start', authenticateJWT, async (req, res) => {
    try {
        const engine = await getEngine();
        if (!engine.manifest?.data) await engine.manifest.load();
        engine.monitor = engine.monitor || (await import('../kernel/evolutionEngine.js')).PerformanceMonitor
            ? new (await import('../kernel/evolutionEngine.js')).PerformanceMonitor({ manifest: engine.manifest })
            : null;
        engine.monitor?.start();
        res.json({ message: 'Evolution monitor started' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** POST /api/evolution/stop — stop the monitor loop */
app.post('/api/evolution/stop', authenticateJWT, async (req, res) => {
    try {
        const engine = await getEngine();
        engine.shutdown();
        res.json({ message: 'Evolution engine stopped' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── LIVE BUILD MONITOR ────────────────────────────────────

// SSE: Live build log stream — clients subscribe to real-time build events
const sseClients = new Set();
const buildLogs = [];   // in-memory ring buffer (last 500 lines)
const MAX_LOG_LINES = 500;

function broadcastLog(entry) {
    const logEntry = { ...entry, timestamp: new Date().toISOString() };
    buildLogs.push(logEntry);
    if (buildLogs.length > MAX_LOG_LINES) buildLogs.shift();

    const data = JSON.stringify(logEntry);
    for (const client of sseClients) {
        try { client.write(`data: ${data}\n\n`); } catch { sseClients.delete(client); }
    }
}

// Monkey-patch console.log to capture swarm output for SSE streaming
const _origLog = console.log;
const _origWarn = console.warn;
const _origErr = console.error;

function classifyLog(msg) {
    if (typeof msg !== 'string') return { type: 'system', badge: 'SYS' };
    if (msg.includes('[Router]')) return { type: 'router', badge: 'ROUTER' };
    if (msg.includes('[Architect]') || msg.includes('ARCHITECT')) return { type: 'agent-architect', badge: 'ARCH' };
    if (msg.includes('Builder') || msg.includes('BUILDER')) return { type: 'agent-builder', badge: 'BUILD' };
    if (msg.includes('Guardian') || msg.includes('GUARDIAN')) return { type: 'agent-guardian', badge: 'GUARD' };
    if (msg.includes('Reviewer') || msg.includes('REVIEWER') || msg.includes('Ensemble')) return { type: 'agent-reviewer', badge: 'REVIEW' };
    if (msg.includes('Security') || msg.includes('SECURITY') || msg.includes('SAST')) return { type: 'agent-security', badge: 'SEC' };
    if (msg.includes('Liaison') || msg.includes('Client Liaison')) return { type: 'info', badge: 'LIAISON' };
    if (msg.includes('Distill') || msg.includes('DISTILL')) return { type: 'info', badge: 'DISTILL' };
    if (msg.includes('Supervisor')) return { type: 'system', badge: 'SUPER' };
    if (msg.includes('[Monitor]')) return { type: 'system', badge: 'MON' };
    if (msg.includes('[Engine]')) return { type: 'system', badge: 'ENGINE' };
    if (msg.includes('✅') || msg.includes('PASS') || msg.includes('Complete')) return { type: 'success', badge: 'OK' };
    if (msg.includes('❌') || msg.includes('FAIL') || msg.includes('Error')) return { type: 'error', badge: 'ERR' };
    return { type: 'system', badge: 'SYS' };
}

console.log = (...args) => {
    _origLog(...args);
    const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    const { type, badge } = classifyLog(msg);
    broadcastLog({ type, badge, message: msg });
};

console.warn = (...args) => {
    _origWarn(...args);
    const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    broadcastLog({ type: 'error', badge: 'WARN', message: msg });
};

console.error = (...args) => {
    _origErr(...args);
    const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    broadcastLog({ type: 'error', badge: 'ERR', message: msg });
};

/** GET /api/build/stream — SSE endpoint for live log streaming */
app.get('/api/build/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Send recent log history as initial burst
    for (const entry of buildLogs.slice(-50)) {
        res.write(`data: ${JSON.stringify(entry)}\n\n`);
    }

    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
});

/** GET /api/build/logs — fetch recent build log lines (REST alternative) */
app.get('/api/build/logs', (req, res) => {
    const count = Math.min(parseInt(req.query.count) || 100, MAX_LOG_LINES);
    res.json(buildLogs.slice(-count));
});

/** GET /monitor — serve the live monitor dashboard */
app.get('/monitor', (req, res) => {
    const monitorPath = path.resolve(__dirname, 'live-monitor.html');
    res.sendFile(monitorPath);
});

// ═══════════════════════════════════════════════════════════════
//  ENGINE MANAGEMENT API — BYOE (Bring Your Own Engine)
// ═══════════════════════════════════════════════════════════════

/** GET /api/engine/status — Current engine state + available providers */
app.get('/api/engine/status', async (req, res) => {
    try {
        const { registry } = await import('../kernel/providerRegistry.js');
        const { listSessions } = await import('../kernel/stateManager.js');

        const providers = registry.list();
        const sessions = listSessions();

        res.json({
            providers,
            activeSessions: sessions.length,
            sessions: sessions.slice(0, 10), // Last 10 sessions
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/engine/providers — List all registered providers */
app.get('/api/engine/providers', async (req, res) => {
    try {
        const { registry } = await import('../kernel/providerRegistry.js');
        res.json(registry.list());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/engine/probe — Live health check for local Ollama + all providers */
app.get('/api/engine/probe', async (req, res) => {
    try {
        const { registry } = await import('../kernel/providerRegistry.js');
        const health = await registry.healthCheck();
        res.json(health);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** POST /api/engine/switch — Switch active provider mid-session */
app.post('/api/engine/switch', authenticateJWT, async (req, res) => {
    const { sessionId, provider, model } = req.body;
    if (!provider || !model) {
        return res.status(400).json({ error: 'provider and model are required' });
    }

    try {
        const { registry } = await import('../kernel/providerRegistry.js');
        const { getSession, compressor } = await import('../kernel/stateManager.js');

        // Validate provider exists
        const providerEntry = registry.get(provider);
        if (!providerEntry) {
            return res.status(404).json({ error: `Provider '${provider}' not registered` });
        }

        // Get or create session
        const session = getSession(sessionId || `session_${Date.now()}`);
        const previousEngine = { provider: session.activeProvider, model: session.activeModel };

        // Perform context compression for the new model
        const compressed = compressor.compress(session, model);

        // Update session engine
        session.setEngine(provider, model);

        res.json({
            success: true,
            sessionId: session.sessionId,
            previousEngine,
            currentEngine: { provider, model },
            contextCompressed: compressed.compressed,
            messageCount: compressed.messages.length,
            summary: compressed.summary
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** POST /api/engine/configure — Save user engine preferences */
app.post('/api/engine/configure', authenticateJWT, async (req, res) => {
    const { defaultProvider, defaultModel, taskRouting, localEndpoint, customEndpoint } = req.body;

    try {
        const { registry } = await import('../kernel/providerRegistry.js');

        // Save user preferences
        const userId = req.user.id;
        registry.setUserPreferences(userId, {
            defaultProvider,
            defaultModel,
            taskRouting,
            localEndpoint
        });

        // If a custom endpoint was provided, register it
        if (customEndpoint?.endpoint) {
            registry.registerCustomEndpoint({
                id: customEndpoint.id || `custom_${userId}`,
                name: customEndpoint.name || `${userId}'s Custom Engine`,
                endpoint: customEndpoint.endpoint,
                models: customEndpoint.models || [],
                apiKey: customEndpoint.apiKey
            });
        }

        // If a custom Ollama endpoint was provided, update it
        if (localEndpoint) {
            const ollama = registry.get('ollama');
            if (ollama) {
                ollama.endpoint = localEndpoint;
            }
        }

        res.json({
            success: true,
            preferences: registry.getUserPreferences(userId)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** POST /api/engine/register — Register a new custom provider */
app.post('/api/engine/register', authenticateJWT, async (req, res) => {
    const { id, name, endpoint, models, apiKey } = req.body;
    if (!endpoint) {
        return res.status(400).json({ error: 'endpoint is required' });
    }

    try {
        const { registry } = await import('../kernel/providerRegistry.js');
        registry.registerCustomEndpoint({ id, name, endpoint, models, apiKey });
        res.json({ success: true, providers: registry.list() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** DELETE /api/engine/provider/:id — Unregister a provider */
app.delete('/api/engine/provider/:id', authenticateJWT, async (req, res) => {
    try {
        const { registry } = await import('../kernel/providerRegistry.js');
        const removed = registry.unregister(req.params.id);
        res.json({ success: removed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/engine/session/:id — Get session state snapshot */
app.get('/api/engine/session/:id', authenticateJWT, async (req, res) => {
    try {
        const { getSession } = await import('../kernel/stateManager.js');
        const session = getSession(req.params.id);
        res.json(session.toSnapshot());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Avon Backend live at http://localhost:${PORT}`);
    console.log(`📺 Live Monitor at http://localhost:${PORT}/monitor`);
    console.log(`🗄️  Database: Supabase (${process.env.SUPABASE_URL})`);
    console.log(`🧠 AI Provider: ${process.env.GEMINI_API_KEY ? 'Gemini (Paid Tier 1)' : (process.env.OPENAI_API_KEY ? 'OpenAI' : 'Ollama')}`);
    console.log(`🧬 Evolution Engine: booting...`);

    // Auto-boot the evolution engine if EVOLUTION_MODE=auto in env
    if (process.env.EVOLUTION_MODE === 'auto') {
        try {
            const engine = await getEngine();
            await engine.boot();
            console.log(`🧬 Evolution Engine: ONLINE (auto-mode)`);
        } catch (err) {
            console.warn('⚠️  Evolution engine boot failed (non-critical):', err.message);
        }
    } else {
        console.log(`🧬 Evolution Engine: STANDBY (set EVOLUTION_MODE=auto to enable)`);
    }
});
