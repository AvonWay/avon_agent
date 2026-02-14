require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const redis = require('redis');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'avon-velocity-secret';

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

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

const MOCK_MEMBERS = {
    'ws_01': [
        { id: 'u1', username: 'avon_admin', role: 'Owner', email: 'admin@avon.ai', avatar: 'https://i.pravatar.cc/150?u=u1' },
        { id: 'u2', username: 'dev_user', role: 'Editor', email: 'dev@avon.ai', avatar: 'https://i.pravatar.cc/150?u=u2' }
    ],
    'ws_02': [
        { id: 'u1', username: 'avon_admin', role: 'Owner', email: 'admin@avon.ai', avatar: 'https://i.pravatar.cc/150?u=u1' }
    ]
};

const MOCK_ACTIVITY = {
    'ws_01': [
        { id: 'a1', user: 'avon_admin', action: 'Scaled Node', target: 'Tokyo Studio', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() }
    ],
    'ws_02': []
};

const MOCK_SITES = {
    'ws_01': [
        { id: '1', name: 'Tokyo Studio', domain: 'tokyo-studio.ai', status: 'Live', deploy_status: 'success' },
        { id: '2', name: 'Vibe Lab', domain: 'vibe-lab.com', status: 'Live', deploy_status: 'success' }
    ],
    'ws_02': [
        { id: '3', name: 'Site Factory Beta', domain: 'beta.factory.com', status: 'Live', deploy_status: 'success' }
    ]
};

const redisClient = {
    get: async () => null,
    setEx: async () => { },
};

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

app.post('/api/generate-site', authenticateJWT, async (req, res) => {
    const { prompt, templateId } = req.body;
    const workspaceId = req.user.workspace_id;

    // Simulate GitHub Action Trigger
    console.log(`🚀 [CI/CD] Triggering Repository Dispatch for node in ${workspaceId}`);

    const newNode = {
        id: `node_${Date.now()}`,
        name: prompt.substring(0, 15),
        domain: `node-${Date.now()}.avon.dev`,
        status: 'Building',
        deploy_status: 'queued'
    };

    MOCK_SITES[workspaceId] = [newNode, ...(MOCK_SITES[workspaceId] || [])];

    // Mock the deployment finishing after 10 seconds
    setTimeout(() => {
        const node = MOCK_SITES[workspaceId].find(n => n.id === newNode.id);
        if (node) {
            node.status = 'Live';
            node.deploy_status = 'success';
            console.log(`✅ [CI/CD] Node ${node.id} is now LIVE via GitHub Pages`);
        }
    }, 10000);

    res.json({ node_id: newNode.id, message: 'Deployment pipeline initialized via GitHub Actions' });
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

app.listen(PORT, () => console.log(`🚀 Avon Production Backend live at http://localhost:${PORT}`));
