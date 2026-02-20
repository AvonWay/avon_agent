/**
 * Velocity Template Renderer
 * Stack: Node.js ESM, Express 5, velocityjs v2.1.5
 *
 * Architecture:
 * - Page templates (index.vm, dashboard.vm) are FRAGMENTS — no HTML shell.
 * - layout.vm is the HTML shell: it has <head>, CSS links, header, footer.
 *   Page content is injected into layout.vm via the $!{screen_content} variable.
 * - Macros (ui.vm, core.vm) are prepended to BOTH renders so #button(), #card()
 *   etc. are available everywhere.
 * - CSS is served by Vite on port 5173 in dev mode (already running).
 *   layout.vm handles this conditional automatically via $config.environment.
 */
import express from 'express';
import { render } from 'velocityjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DEV_PREVIEW_URL = 'http://localhost:3001';
const BACKEND_API = 'http://localhost:4000/api';

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

/**
 * Authenticate with the backend and return a JWT token.
 * @returns {Promise<string>} JWT token
 */
async function getToken() {
    const res = await fetch(`${BACKEND_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'avon_admin', role: 'industrial' })
    });
    const { token } = await res.json();
    return token;
}

/**
 * Fetch all sites from the backend and normalise them for the template.
 * Returns an empty array if the backend is unreachable — never crashes the renderer.
 * @returns {Promise<Array>}
 */
async function fetchNodes() {
    try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_API}/sites`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const sites = await res.json();

        // Normalise each site into a flat object for VTL
        return sites.map(s => ({
            id: s.id,
            name: s.name || 'Unnamed Node',
            status: s.status || 'Unknown',
            template: s.template || 'Custom Build',
            deployed: s.created_at
                ? new Date(s.created_at).toRelativeString?.()
                : 'Recently',
            previewUrl: `${DEV_PREVIEW_URL}/?id=${s.id}`
        }));
    } catch (err) {
        // Backend unavailable — dashboard still renders with placeholder data
        console.warn('[fetchNodes] Backend unreachable, using empty list:', err.message);
        return [];
    }
}

/**
 * Fetch all structural blueprints from the industrial backend.
 */
async function fetchBlueprints() {
    try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_API}/templates`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return await res.json();
    } catch (err) {
        console.warn('[fetchBlueprints] Failed:', err.message);
        return [];
    }
}

const PORT = process.env.PORT || 8080;
const TEMPLATES_DIR = path.join(__dirname, 'src', 'templates');
const MACROS_DIR = path.join(__dirname, 'src', 'macros');

// Serve static src assets (images, fonts) directly
app.use('/src', express.static(path.join(__dirname, 'src')));

/**
 * Safely read a file; return empty string if it doesn't exist.
 * Prevents a missing macro file from crashing all renders.
 * @param {string} filePath
 * @returns {string}
 */
function safeRead(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`[WARN] File not found, skipping: ${filePath}`);
        return '';
    }
    return fs.readFileSync(filePath, 'utf8');
}

/**
 * Strip #parse(...) directives from a template string.
 * velocityjs does not support file I/O via #parse — we handle
 * macro injection manually by prepending files to the render string.
 * @param {string} vtl - Raw VTL template string
 * @returns {string}
 */
function stripParseDirectives(vtl) {
    return vtl.replace(/#parse\s*\([^)]+\)/g, '');
}

/**
 * Load and concatenate all macro files into one block.
 * Macros must be available at render time for both the layout
 * and the page fragment, so we always prepend them.
 * @returns {string}
 */
function loadMacros() {
    const ui = safeRead(path.join(MACROS_DIR, 'ui.vm'));
    const core = safeRead(path.join(MACROS_DIR, 'core.vm'));
    return `${ui}\n${core}\n`;
}

/**
 * Two-pass render:
 * 1. Render the page fragment (e.g. index.vm) → produces an HTML string
 * 2. Inject that string into layout.vm as $!{screen_content} → produces full HTML page
 *
 * @param {string} pageName - Template filename without .vm extension
 * @param {object} context  - Data available inside the template
 * @returns {string} Full HTML document
 */
function renderPage(pageName, context) {
    const macros = loadMacros();
    const layoutVtl = stripParseDirectives(safeRead(path.join(TEMPLATES_DIR, 'layout.vm')));
    const pageVtl = stripParseDirectives(safeRead(path.join(TEMPLATES_DIR, `${pageName}.vm`)));

    if (!pageVtl) {
        throw new Error(`Template not found: ${pageName}.vm`);
    }

    // Pass 1: Render the page fragment with macros available
    const screenContent = render(`${macros}${pageVtl}`, context);

    // Pass 2: Inject fragment into layout and render the full document
    const fullContext = { ...context, screen_content: screenContent };
    return render(`${macros}${layoutVtl}`, fullContext);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Home page */
app.get('/', (req, res) => {
    try {
        const html = renderPage('index', {
            config: { environment: 'development' },
            pageTitle: 'Velocity Industrial Builder',
            pageDescription: 'Scalable AI-Driven Node System',
            user: { name: 'Avon Admin', role: 'Industrial' }
        });
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error('[GET /] Render Error:', err.message);
        res.status(500).send(errorPage(err));
    }
});

/** Dashboard page — fetches live nodes from backend */
app.get('/dashboard', async (req, res) => {
    try {
        const sites = await fetchNodes();

        const html = renderPage('dashboard', {
            config: { environment: 'development' },
            pageTitle: 'Dashboard — Velocity',
            pageDescription: 'Industrial Node Dashboard',
            user: { name: 'Avon Admin', role: 'Industrial' },
            sites,           // $sites available in dashboard.vm
            devPreviewUrl: DEV_PREVIEW_URL
        });
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error('[GET /dashboard] Render Error:', err.message);
        res.status(500).send(errorPage(err));
    }
});

/** Profile page */
app.get('/profile', (req, res) => {
    try {
        const html = renderPage('profile', {
            config: { environment: 'development' },
            pageTitle: 'Profile — Velocity',
            pageDescription: 'User profile',
            user: { name: 'Avon Admin', role: 'Industrial' }
        });
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error('[GET /profile] Render Error:', err.message);
        res.status(500).send(errorPage(err));
    }
});

/** Betting page — synthesized by the Velocity Agent */
app.get('/betting', (req, res) => {
    try {
        // Mock data representing the output of our 5-platform aggregator
        const bets = [
            { homeTeam: 'Lakers', awayTeam: 'Celtics', market: 'Moneyline', odds: 2.10, edge: 4.2 },
            { homeTeam: 'Chiefs', awayTeam: 'Eagles', market: 'Spread (-3.5)', odds: 1.95, edge: 2.8 },
            { homeTeam: 'Yankees', awayTeam: 'Dodgers', market: 'Total (Over 8.5)', odds: 2.05, edge: 5.1 },
            { homeTeam: 'Oilers', awayTeam: 'Panthers', market: 'Moneyline', odds: 1.88, edge: 1.5 },
            { homeTeam: 'Alcaraz', awayTeam: 'Djokovic', market: 'Match Winner', odds: 2.45, edge: 6.8 }
        ];

        const html = renderPage('betting', {
            config: { environment: 'development' },
            pageTitle: 'Developer Swarm — Velocity',
            pageDescription: 'Industrial Probability Engine',
            user: { name: 'Avon Admin', role: 'Industrial' },
            bets             // $bets available in betting.vm
        });
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error('[GET /betting] Render Error:', err.message);
        res.status(500).send(errorPage(err));
    }
});

/** New Site route */
app.get('/new-site', (req, res) => {
    try {
        const html = renderPage('index', {
            config: { environment: 'development' },
            pageTitle: 'Initialize New Node — Velocity',
            pageDescription: 'Industrial scaling interface',
            user: { name: 'Avon Admin', role: 'Industrial' }
        });
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        res.status(500).send(errorPage(err));
    }
});

/** Blueprints / Templates Hub */
app.get('/blueprints', async (req, res) => {
    try {
        const templates = await fetchBlueprints();
        const html = renderPage('blueprints', {
            config: { environment: 'development' },
            pageTitle: 'Industrial Blueprints — Velocity',
            pageDescription: 'Pre-engineered logic bundles',
            user: { name: 'Avon Admin', role: 'Industrial' },
            templates
        });
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        res.status(500).send(errorPage(err));
    }
});

/** Blueprint Live Preview */
app.get('/blueprints/preview/:id', async (req, res) => {
    try {
        const token = await getToken();
        const response = await fetch(`${BACKEND_API}/templates/${req.params.id}/preview`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const html = await response.text();
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        res.status(500).send(errorPage(err));
    }
});

/** Industrial Audit Page */
app.get('/audit', async (req, res) => {
    try {
        const token = await getToken(); // Get valid token from backend
        const html = renderPage('audit', {
            config: { environment: 'development' },
            pageTitle: 'Industrial Audit — Velocity',
            pageDescription: 'System integrity scan',
            user: { name: 'Avon Admin', role: 'Industrial' },
            token // Pass to VTL
        });
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        res.status(500).send(errorPage(err));
    }
});

/** Chat route */
app.get('/chat', (req, res) => {
    try {
        const html = renderPage('chat', {
            config: { environment: 'development' },
            pageTitle: 'Avon Agent Chat — Velocity',
            pageDescription: 'Secure industrial communication',
            user: { name: 'Avon Admin', role: 'Industrial' }
        });
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        res.status(500).send(errorPage(err));
    }
});

/** Docs route — Full documentation */
app.get('/docs', (req, res) => {
    try {
        const html = renderPage('docs', {
            config: { environment: 'development' },
            pageTitle: 'Documentation — Velocity',
            pageDescription: 'Complete developer documentation for the Velocity Industrial Builder platform.',
            user: { name: 'Avon Admin', role: 'Industrial' }
        });
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        console.error('[GET /docs] Render Error:', err.message);
        res.status(500).send(errorPage(err));
    }
});

/** Components route — UI Library */
app.get('/components', (req, res) => {
    try {
        const html = renderPage('components', {
            config: { environment: 'development' },
            pageTitle: 'Component Library — Velocity',
            pageDescription: 'Industrial UI Design System',
            user: { name: 'Avon Admin', role: 'Industrial' }
        });
        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        res.status(500).send(errorPage(err));
    }
});

/** Structured error page — never crashes the server */
function errorPage(err) {
    return `<!DOCTYPE html>
<html><head><title>Render Error</title></head>
<body style="font-family:monospace;padding:2rem;background:#fff1f1">
  <h2 style="color:#c00">Velocity Render Error</h2>
  <pre>${err.message}</pre>
  <p>Check that your .vm template uses valid VTL syntax.</p>
</body></html>`;
}

app.listen(PORT, () => {
    console.log(`\n✅ Velocity Renderer active`);
    console.log(`   App:       http://localhost:${PORT}`);
    console.log(`   CSS (dev): http://localhost:5173 (Vite — must be running)\n`);
});
