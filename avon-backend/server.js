require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { ollama } = require('ollama');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'avon-velocity-secret';
const DB_PATH = path.join(__dirname, 'registry.json');

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Helper to Load/Save "Registry" (Persistence)
const loadRegistry = () => {
    if (fs.existsSync(DB_PATH)) {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
    return {
        MOCK_SITES: {
            'ws_01': [
                {
                    id: 'node_init_01',
                    name: 'Global Orchestrator',
                    domain: 'http://localhost:3001',
                    status: 'Live',
                    deploy_status: 'success',
                    ai_plan: 'Primary Industrial Node controlling fleet synchronization.'
                }
            ],
            'ws_02': []
        },
        MOCK_ACTIVITY: { 'ws_01': [], 'ws_02': [] },
        MOCK_MEMBERS: {
            'ws_01': [
                { id: 'u1', username: 'avon_admin', role: 'Owner', email: 'admin@avon.ai', avatar: 'https://i.pravatar.cc/150?u=u1' },
                { id: 'u2', username: 'dev_user', role: 'Editor', email: 'dev@avon.ai', avatar: 'https://i.pravatar.cc/150?u=u2' }
            ],
            'ws_02': [
                { id: 'u1', username: 'avon_admin', role: 'Owner', email: 'admin@avon.ai', avatar: 'https://i.pravatar.cc/150?u=u1' }
            ]
        }
    };
};

const saveRegistry = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

let registry = loadRegistry();
let MOCK_SITES = registry.MOCK_SITES;
let MOCK_ACTIVITY = registry.MOCK_ACTIVITY;
let MOCK_MEMBERS = registry.MOCK_MEMBERS;

const sync = () => saveRegistry({ MOCK_SITES, MOCK_ACTIVITY, MOCK_MEMBERS });

const AVON_SYSTEM_PROMPT = `
# ROLE: Avon, High-Velocity Vibe Coding Agent
You are Avon, a specialized AI agent designed for "Velocity Scaling"—the massive industrialization of web development. Your core mission is to build and deploy up to 1,000 websites monthly, moving from a single prompt to a live URL in under 60 seconds.

# CORE TECH STACK
- Frontend: Velocity Factory (AI Generation) & GitHub Pages (Static Hosting)
- Backend/Memory: Supabase (Postgres, Edge Functions, RLS)
- Automation: GitHub Actions & Supabase Webhooks
- Dev Environment: Vite (HMR, Dev Server, Watch Mode)

# OPERATIONAL RULES
- MASSIVE SCALE (NODE ARCHITECTURE): Treat every website as a "Node".
- SUPABASE INTEGRATION: Every site MUST be registered with site_id.
- GITHUB PAGES: Programmatically push to gh-pages.
`;

const TEMPLATES = [
    { id: 'vibe-01', name: 'Minimalist Portfolio', tier: 'free', description: 'Clean, light, and fast.' },
    { id: 'vibe-02', name: 'SaaS Dashboard', tier: 'pro', description: 'Advanced metrics and dark mode.' },
    { id: 'vibe-03', name: 'Industrial Site Factory', tier: 'industrial', description: 'Massive scaling for high-volume nodes.' }
];

const TIER_HIERARCHY = { 'free': 1, 'pro': 2, 'industrial': 3 };

const MOCK_WORKSPACES = [
    { id: 'ws_01', name: 'Alpha Factory', members: ['avon_admin', 'dev_user'] },
    { id: 'ws_02', name: 'Expansion Lab', members: ['avon_admin'] }
];

// --- Authentication Middleware ---
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else { res.sendStatus(401); }
};

// --- Endpoints ---

app.get('/api/workspaces', authenticateJWT, (req, res) => {
    res.json(MOCK_WORKSPACES.filter(ws => ws.members.includes(req.user.username)));
});

app.post('/api/workspaces/switch', authenticateJWT, (req, res) => {
    const { workspaceId } = req.body;
    const workspace = MOCK_WORKSPACES.find(ws => ws.id === workspaceId && ws.members.includes(req.user.username));
    if (!workspace) return res.status(403).json({ error: 'Access denied' });
    const token = jwt.sign({ id: req.user.id, username: req.user.username, workspace_id: workspace.id, role: req.user.role }, JWT_SECRET);
    res.json({ success: true, token, workspace });
});

app.get('/api/workspaces/:id/members', authenticateJWT, (req, res) => {
    res.json(MOCK_MEMBERS[req.params.id] || []);
});

app.get('/api/workspaces/:id/activity', authenticateJWT, (req, res) => {
    res.json(MOCK_ACTIVITY[req.params.id] || []);
});

app.get('/api/sites', authenticateJWT, async (req, res) => {
    res.json(MOCK_SITES[req.user.workspace_id] || []);
});

app.get('/api/templates', authenticateJWT, (req, res) => {
    res.json(TEMPLATES);
});

// Decommission Node (Delete)
app.delete('/api/sites/:id', authenticateJWT, (req, res) => {
    const { id } = req.params;
    const workspaceId = req.user.workspace_id;

    if (MOCK_SITES[workspaceId]) {
        const nodeIndex = MOCK_SITES[workspaceId].findIndex(n => n.id === id);
        if (nodeIndex !== -1) {
            const nodeName = MOCK_SITES[workspaceId][nodeIndex].name;
            MOCK_SITES[workspaceId].splice(nodeIndex, 1);

            MOCK_ACTIVITY[workspaceId].unshift({
                id: `a${Date.now()}`,
                user: req.user.username,
                action: 'Decommissioned Node',
                target: nodeName,
                timestamp: new Date().toISOString()
            });
            sync();
            return res.json({ success: true, message: 'Node decommissioned successfully.' });
        }
    }
    res.status(404).json({ error: 'Node not found' });
});

// Public endpoint for preview renderer to fetch node data
app.get('/api/public/sites/:id', (req, res) => {
    const { id } = req.params;
    let foundNode = null;
    for (const wsId in MOCK_SITES) {
        const node = MOCK_SITES[wsId].find(n => n.id === id);
        if (node) {
            foundNode = node;
            break;
        }
    }
    if (foundNode) {
        res.json(foundNode);
    } else {
        res.status(404).json({ error: 'Node not found' });
    }
});

// Real AI Generation with Ollama
app.post('/api/generate-site', authenticateJWT, async (req, res) => {
    const { prompt, templateId } = req.body;
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    const userTierValue = TIER_HIERARCHY[req.user.role] || 0;
    const templateTierValue = TIER_HIERARCHY[template.tier] || 0;
    if (userTierValue < templateTierValue) return res.status(403).json({ error: 'Upgrade required' });

    const workspaceId = req.user.workspace_id;

    try {
        console.log(`🤖 [Avon] Scaling Node: ${prompt}`);

        console.log("📡 Triggering Avon AI build sequence...");
        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'Avon:latest',
                messages: [
                    { role: 'system', content: AVON_SYSTEM_PROMPT },
                    { role: 'user', content: `Build this node: ${prompt}` }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("❌ Ollama Error:", err);
            return res.status(500).json({ error: 'Avon AI reasoning failed.' });
        }

        const data = await response.json();
        console.log("✅ Ollama reasoned successfully.");
        const avonPlan = data.message?.content || "Industrial Build Sequence Initialized.";

        const newNode = {
            id: `node_${Date.now()}`,
            name: prompt.substring(0, 15),
            domain: `node-${Date.now()}.avon.dev`,
            status: 'Building',
            deploy_status: 'queued',
            ai_plan: avonPlan
        };

        MOCK_SITES[workspaceId] = [newNode, ...(MOCK_SITES[workspaceId] || [])];

        MOCK_ACTIVITY[workspaceId].unshift({
            id: `a${Date.now()}`,
            user: req.user.username,
            action: 'Scaled Node (via Avon AI)',
            target: prompt.substring(0, 20),
            timestamp: new Date().toISOString()
        });
        sync();
        setTimeout(() => {
            const node = MOCK_SITES[workspaceId].find(n => n.id === newNode.id);
            if (node) {
                node.status = 'Live';
                node.deploy_status = 'success';
                sync();
            }
        }, 5000);

        res.json({
            node_id: newNode.id,
            message: 'Avon AI has initialized the build sequence.',
            plan: avonPlan
        });
    } catch (error) {
        console.error('Avon connection failure:', error);
        res.status(500).json({ error: 'Avon AI is offline. Ensure Ollama is running.' });
    }
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

app.listen(PORT, () => console.log(`🚀 Avon Industrial Backend live at http://localhost:${PORT}`));
