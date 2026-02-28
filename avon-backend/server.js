import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { exec } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'industrial_secret_key_2024';

// --- Supabase (Service Role for server-side trust) ---
// DS-002: Use SUPABASE_SERVICE_ROLE_KEY — never the anon key — for all server→Supabase calls.
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
    process.exit(1);
}
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // DS-002: service role key for trusted server-side access
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
    const workspaceId = req.user.workspace_id;

    if (!workspaceId) return res.status(400).json({ error: 'No workspace found. Please register first.' });

    // Create site record in Supabase
    const { data: site, error } = await supabase.from('sites').insert({
        workspace_id: workspaceId,
        site_name: prompt.substring(0, 40) || 'New Site',
        domain: `node-${Date.now()}.avon.dev`,
        status: 'pending',
        config: { prompt, theme, ai_plan: 'Initializing Swarm...' }
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });

    // Respond immediately
    res.json({ message: 'Build started', node_id: site.id });

    // Background Swarm execution
    (async () => {
        try {
            const { Supervisor } = await import('../agents/supervisor.js');
            const result = await Supervisor.execute(prompt);
            const status = result.status === 'success' ? 'active' : 'failed';

            await supabase.from('sites').update({
                status,
                config: {
                    prompt, theme,
                    ai_plan: result.plan || '',
                    build_artifact: result.artifact || ''
                },
                updated_at: new Date().toISOString()
            }).eq('id', site.id);

            console.log(`✅ [Supabase] Site ${site.id} updated. Status: ${status}`);
        } catch (err) {
            console.error('❌ Swarm error:', err.message);
            await supabase.from('sites').update({
                status: 'failed',
                config: { prompt, theme, ai_plan: err.message }
            }).eq('id', site.id);
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
        ai_plan: data.config?.ai_plan || ''
    });
});

// --- TERMINAL EXEC (DS-001: Allowlist + metacharacter guard) ---
const TERMINAL_ALLOWED_COMMANDS = [
    'node --check',
    'npm run',
    'npm test',
    'npx tsc',
    'git status',
    'git log',
    'git diff',
    'ls',
    'dir',
    'echo',
    'cat',
    'type',
    'pwd',
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

// --- CHAT ---
app.post('/api/chat', async (req, res) => {
    const { messages, model, profile, system } = req.body;
    try {
        const { runModel } = await import('../kernel/modelRouter.js');
        const response = await runModel({
            provider: 'ollama',
            model: model || 'Avon:latest',
            profile: profile || 'standard',
            messages,
            system
        });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

/** POST /api/evolution/trigger — manually trigger one evolution cycle */
app.post('/api/evolution/trigger', authenticateJWT, async (req, res) => {
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

app.listen(PORT, async () => {
    console.log(`🚀 Avon Backend live at http://localhost:${PORT}`);
    console.log(`🗄️  Database: Supabase (${process.env.SUPABASE_URL})`);
    console.log(`🧠 AI Provider: ${process.env.OPENAI_API_KEY ? 'OpenAI' : 'Ollama'}`);
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
