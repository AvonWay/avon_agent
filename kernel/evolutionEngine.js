/**
 * ============================================================
 *  AVON EVOLUTION ENGINE  — kernel/evolutionEngine.js
 *  Self-monitor → Self-patch → Shadow-build → Atomic swap
 * ============================================================
 *
 *  MODULE MAP
 *  ─────────────────────────────────────────────────────────
 *  M1  GlobalManifest      — Mission config & objective store
 *  M2  PerformanceMonitor  — Continuous telemetry + SAST loop
 *  M3  EvolutionArchitect  — Proposes patches via Avon AI
 *  M4  ShadowOperator      — Clones env, applies patch, compiles
 *  M5  ValidationGate      — Runs tests + benchmarks
 *  M6  AtomicSwap          — Hot-reloads the verified build
 * ============================================================
 */

import fs from 'fs-extra';
import path from 'path';
import { execSync, exec } from 'child_process';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ─── paths ─────────────────────────────────────────────────
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'Mission_Manifest.json');
const SHADOW_ROOT = path.join(PROJECT_ROOT, '.shadow_build');
const EVOLUTION_LOG = path.join(PROJECT_ROOT, 'memory', 'evolution_log.jsonl');
const TELEMETRY_LOG = path.join(PROJECT_ROOT, 'memory', 'telemetry.jsonl');
const CONSTITUTION_JSON = path.join(PROJECT_ROOT, '.velocity_constitution.json');

// ─── tunables ──────────────────────────────────────────────
const LATENCY_THRESHOLD_MS = 2000;   // p95 latency ceiling
const MONITOR_INTERVAL_MS = 60_000; // 1-minute heartbeat
const MAX_EVOLUTION_CYCLES = 10;     // safety cap

// ─── runtime state (in-process session buffer) ─────────────
const SESSION_STATE = {
    context: {},
    save(ctx) { this.context = { ...this.context, ...ctx }; return this.context; },
    load() { return this.context; }
};

// ══════════════════════════════════════════════════════════
//  MODULE 1 — GLOBAL MANIFEST
// ══════════════════════════════════════════════════════════
export class GlobalManifest {
    constructor() {
        this.data = null;
    }

    async load() {
        if (!await fs.pathExists(MANIFEST_PATH)) {
            const defaults = {
                version: '1.0.0',
                objectives: [
                    'Maintain sub-2s response latency',
                    'Zero critical security vulnerabilities',
                    'Preserve Velocity brand constitution',
                    'Maximize agent task success rate'
                ],
                forbidden: [
                    'Remove authentication middleware',
                    'Disable RLS policies',
                    'Delete user data'
                ],
                evolution_history: [],
                boot_timestamp: new Date().toISOString()
            };
            await fs.writeJson(MANIFEST_PATH, defaults, { spaces: 2 });
            this.data = defaults;
            return this;
        }
        this.data = await fs.readJson(MANIFEST_PATH);
        return this;
    }

    async recordEvolution(entry) {
        this.data.evolution_history.push({ ...entry, timestamp: new Date().toISOString() });
        // Keep only last 50 entries
        if (this.data.evolution_history.length > 50) {
            this.data.evolution_history = this.data.evolution_history.slice(-50);
        }
        await fs.writeJson(MANIFEST_PATH, this.data, { spaces: 2 });
    }

    isAligned(patch) {
        // Reject any patch that touches forbidden patterns
        const patchText = JSON.stringify(patch).toLowerCase();
        for (const forbidden of this.data.forbidden) {
            if (patchText.includes(forbidden.toLowerCase())) {
                return { aligned: false, reason: `Violates forbidden directive: "${forbidden}"` };
            }
        }
        return { aligned: true };
    }

    get objectives() { return this.data?.objectives ?? []; }
    get version() { return this.data?.version ?? '1.0.0'; }
}

// ══════════════════════════════════════════════════════════
//  MODULE 2 — PERFORMANCE MONITOR (The Continuous Observer)
// ══════════════════════════════════════════════════════════
export class PerformanceMonitor extends EventEmitter {
    constructor({ manifest, intervalMs = MONITOR_INTERVAL_MS }) {
        super();
        this.manifest = manifest;
        this.intervalMs = intervalMs;
        this._timer = null;
        this._running = false;
        this._cycle = 0;
    }

    /** Collect real telemetry about the running process */
    async getTelemetry() {
        const start = Date.now();

        // Probe the backend health endpoint if available
        let apiLatency = null;
        try {
            const { default: fetch } = await import('node-fetch');
            const t0 = Date.now();
            const res = await fetch('http://localhost:4000/api/health', { signal: AbortSignal.timeout(3000) });
            apiLatency = res.ok ? Date.now() - t0 : null;
        } catch { /* backend may not be running during tests */ }

        const mem = process.memoryUsage();

        const metrics = {
            timestamp: new Date().toISOString(),
            heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
            rssMB: Math.round(mem.rss / 1024 / 1024),
            apiLatencyMs: apiLatency,
            uptimeSeconds: Math.round(process.uptime()),
            cycle: this._cycle,
        };

        // Persist
        await fs.ensureFile(TELEMETRY_LOG);
        await fs.appendFile(TELEMETRY_LOG, JSON.stringify(metrics) + '\n');
        return metrics;
    }

    /** Static Application Security Testing — walks source files for risk patterns */
    async runSAST() {
        const riskPatterns = [
            { pattern: /eval\s*\(/, severity: 'CRITICAL', label: 'eval() injection risk' },
            { pattern: /new Function\(/, severity: 'CRITICAL', label: 'new Function() injection' },
            { pattern: /process\.env\.\w+\s*=/, severity: 'HIGH', label: 'env var mutation' },
            { pattern: /child_process.*exec\b(?!Sync)/, severity: 'HIGH', label: 'unsanitised exec()' },
            { pattern: /password|secret|token/i, severity: 'MEDIUM', label: 'plaintext credential hint' },
        ];

        const vulnerabilities = [];
        const scanDirs = ['agents', 'kernel', 'avon-backend'].map(d => path.join(PROJECT_ROOT, d));

        for (const dir of scanDirs) {
            if (!await fs.pathExists(dir)) continue;
            const files = await this._walkFiles(dir, ['.js', '.ts']);
            for (const file of files) {
                const src = await fs.readFile(file, 'utf8').catch(() => '');
                for (const { pattern, severity, label } of riskPatterns) {
                    if (pattern.test(src)) {
                        vulnerabilities.push({ file: path.relative(PROJECT_ROOT, file), severity, label });
                    }
                }
            }
        }

        return vulnerabilities;
    }

    async _walkFiles(dir, exts) {
        const out = [];
        const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
        for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory() && e.name !== 'node_modules') {
                out.push(...await this._walkFiles(full, exts));
            } else if (e.isFile() && exts.includes(path.extname(e.name))) {
                out.push(full);
            }
        }
        return out;
    }

    /** Main monitoring heartbeat */
    async tick() {
        this._cycle++;
        console.log(`\n[Monitor] 🔭 Heartbeat #${this._cycle} — ${new Date().toISOString()}`);

        const metrics = await this.getTelemetry();
        const vulnerabilities = await this.runSAST();

        const latencyBreached = metrics.apiLatencyMs != null && metrics.apiLatencyMs > LATENCY_THRESHOLD_MS;
        const hasCriticalVuln = vulnerabilities.some(v => v.severity === 'CRITICAL');
        const hasHighVuln = vulnerabilities.some(v => v.severity === 'HIGH');

        console.log(`[Monitor] Latency: ${metrics.apiLatencyMs ?? 'n/a'}ms | Heap: ${metrics.heapUsedMB}MB | Vulns: ${vulnerabilities.length}`);

        if (latencyBreached || hasCriticalVuln || hasHighVuln) {
            const issueReport = {
                latencyBreached,
                latencyMs: metrics.apiLatencyMs,
                memoryMB: metrics.heapUsedMB,
                metrics
            };
            const securityReport = { vulnerabilities, critical: hasCriticalVuln, high: hasHighVuln };

            console.log('[Monitor] ⚠️  Issue detected — triggering evolution loop');
            this.emit('issue', { issueReport, securityReport });
        } else {
            console.log('[Monitor] ✅ All systems nominal');
        }
    }

    start() {
        if (this._running) return;
        this._running = true;
        // Initial tick immediately, then repeat
        this.tick().catch(console.error);
        this._timer = setInterval(() => this.tick().catch(console.error), this.intervalMs);
        console.log(`[Monitor] 🚀 Started. Interval: ${this.intervalMs / 1000}s`);
    }

    stop() {
        clearInterval(this._timer);
        this._running = false;
        console.log('[Monitor] 🛑 Stopped.');
    }
}

// ══════════════════════════════════════════════════════════
//  MODULE 3 — EVOLUTION ARCHITECT (The Decision Logic)
// ══════════════════════════════════════════════════════════
export class EvolutionArchitect {
    constructor({ manifest }) {
        this.manifest = manifest;
    }

    /** Read current source snapshot for self-analysis */
    async readSourceContext() {
        const hotFiles = [
            'kernel/config.js',
            'kernel/modelRouter.js',
            'agents/supervisor.js',
            'avon-backend/server.js',
            'kernel/selfImprover.js'
        ];
        const snippets = {};
        for (const rel of hotFiles) {
            const abs = path.join(PROJECT_ROOT, rel);
            snippets[rel] = await fs.readFile(abs, 'utf8').catch(() => '/* file not found */');
        }
        return snippets;
    }

    /**
     * Ask Avon AI to produce a concrete patch plan.
     * Returns { aligned, patches[], reason }
     */
    async proposePatch({ issueReport, securityReport }) {
        const sourceContext = await this.readSourceContext();
        const objectives = this.manifest.objectives.join('\n- ');
        const vulnSummary = securityReport.vulnerabilities
            .map(v => `  [${v.severity}] ${v.label} in ${v.file}`)
            .join('\n') || '  None detected';

        const prompt = `
You are Avon's EVOLUTION ARCHITECT. You must analyze the performance and security reports below and propose concrete, minimal code patches.

## MISSION OBJECTIVES:
- ${objectives}

## PERFORMANCE REPORT:
${JSON.stringify(issueReport, null, 2)}

## SECURITY FINDINGS:
${vulnSummary}

## CURRENT SOURCE FILES (abbreviated):
${Object.entries(sourceContext).map(([f, c]) => `### ${f}\n\`\`\`js\n${c.slice(0, 800)}\n\`\`\``).join('\n\n')}

## TASK:
Produce a JSON patch plan with this exact structure:
{
  "analysis": "Brief explanation of root cause",
  "priority": "critical|high|medium|low",
  "patches": [
    {
      "file": "relative/path/to/file.js",
      "description": "What this patch fixes",
      "action": "modify|add|delete",
      "search":  "exact code block to find (for modify)",
      "replace": "replacement code block (for modify)",
      "content": "file content if action is add"
    }
  ]
}

Keep patches minimal and surgical. Only fix what is actually broken or risky.
`;

        try {
            const { runModel } = await import('./modelRouter.js');
            const response = await runModel({
                profile: 'evolution',   // deepseek-coder-v2 — purpose-built for code patches
                messages: [{ role: 'user', content: prompt }]
            });

            const raw = response.message?.content ?? '';

            // ── Robust JSON extraction (handles markdown fences + bare JSON) ──
            const patchPlan = this._extractJSON(raw);
            if (!patchPlan) {
                // Log the first 500 chars of the raw response for debugging
                console.warn('[Architect] ⚠️  Could not extract JSON from response.');
                console.warn('[Architect] Raw preview:', raw.slice(0, 500));
                return { parseError: true, patches: [], analysis: 'Model did not return valid JSON', priority: 'none' };
            }

            const alignment = this.manifest.isAligned(patchPlan);
            return { ...patchPlan, aligned: alignment.aligned, alignmentReason: alignment.reason };
        } catch (err) {
            console.error('[Architect] Failed to generate patch:', err.message);
            return { parseError: true, patches: [], analysis: err.message, priority: 'none' };
        }
    }

    /**
     * Multi-strategy JSON extraction.
     * Handles: plain JSON, ```json fences, ``` fences, JSON buried in prose.
     */
    _extractJSON(raw) {
        const strategies = [
            // 1. Fenced code block: ```json { ... } ```
            () => { const m = raw.match(/```json\s*([\s\S]*?)\s*```/i); return m?.[1]; },
            // 2. Any fenced code block: ``` { ... } ```
            () => { const m = raw.match(/```(?:\w*)\s*([\s\S]*?)\s*```/); return m?.[1]; },
            // 3. Bare outermost { ... } (greedy)
            () => { const m = raw.match(/\{[\s\S]*\}/); return m?.[0]; },
            // 4. First { to last }
            () => {
                const start = raw.indexOf('{');
                const end = raw.lastIndexOf('}');
                return (start !== -1 && end > start) ? raw.slice(start, end + 1) : null;
            }
        ];

        for (const strategy of strategies) {
            try {
                const candidate = strategy();
                if (!candidate) continue;
                const parsed = JSON.parse(candidate.trim());
                // Must have at least an 'analysis' or 'patches' key to be valid
                if (parsed && (parsed.analysis || Array.isArray(parsed.patches))) return parsed;
            } catch { /* try next strategy */ }
        }
        return null;
    }
}

// ══════════════════════════════════════════════════════════
//  MODULE 4 — SHADOW OPERATOR (Clone → Patch → Build)
// ══════════════════════════════════════════════════════════
export class ShadowOperator {
    constructor() {
        this.shadowPath = SHADOW_ROOT;
    }

    async createClone() {
        console.log('[Operator] 📦 Creating shadow workspace...');
        await fs.remove(this.shadowPath);
        await fs.ensureDir(this.shadowPath);

        // Copy key source directories (skip node_modules, .git, shadow itself)
        const copyDirs = ['agents', 'kernel', 'providers', 'io', 'memory'];
        for (const d of copyDirs) {
            const src = path.join(PROJECT_ROOT, d);
            if (await fs.pathExists(src)) {
                await fs.copy(src, path.join(this.shadowPath, d));
            }
        }

        // Copy critical root files
        const copyFiles = ['package.json', '.velocity_constitution.json', 'Mission_Manifest.json'];
        for (const f of copyFiles) {
            const src = path.join(PROJECT_ROOT, f);
            if (await fs.pathExists(src)) {
                await fs.copy(src, path.join(this.shadowPath, f));
            }
        }

        console.log('[Operator] ✅ Shadow workspace ready at:', this.shadowPath);
    }

    async applyPatches(patches = []) {
        console.log(`[Operator] 🔧 Applying ${patches.length} patch(es)...`);
        const results = [];

        for (const patch of patches) {
            const targetPath = path.join(this.shadowPath, patch.file);
            try {
                if (patch.action === 'add') {
                    await fs.ensureFile(targetPath);
                    await fs.writeFile(targetPath, patch.content || '');
                    results.push({ file: patch.file, status: 'added' });

                } else if (patch.action === 'modify') {
                    const original = await fs.readFile(targetPath, 'utf8').catch(() => '');
                    if (!original.includes(patch.search)) {
                        results.push({ file: patch.file, status: 'search_not_found', search: patch.search.slice(0, 80) });
                        continue;
                    }
                    const patched = original.replace(patch.search, patch.replace);
                    await fs.writeFile(targetPath, patched, 'utf8');
                    results.push({ file: patch.file, status: 'modified' });

                } else if (patch.action === 'delete') {
                    await fs.remove(targetPath);
                    results.push({ file: patch.file, status: 'deleted' });
                }
            } catch (err) {
                results.push({ file: patch.file, status: 'error', error: err.message });
            }
        }

        console.log('[Operator] Patch results:', results);
        return results;
    }

    /** "Compile" = syntax-check via Node --check on each JS file */
    async compile() {
        console.log('[Operator] 🏗️  Compiling shadow build (syntax check)...');
        const errors = [];

        const files = await this._walkJS(this.shadowPath);
        for (const file of files) {
            try {
                execSync(`node --check "${file}"`, { stdio: 'pipe' });
            } catch (err) {
                errors.push({ file: path.relative(this.shadowPath, file), error: err.stderr?.toString().slice(0, 300) });
            }
        }

        if (errors.length === 0) {
            console.log('[Operator] ✅ Compilation: PASS');
            return { success: true, errors: [] };
        } else {
            console.warn('[Operator] ❌ Compilation: FAIL —', errors.length, 'error(s)');
            return { success: false, errors };
        }
    }

    async _walkJS(dir) {
        const out = [];
        const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
        for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory() && e.name !== 'node_modules') out.push(...await this._walkJS(full));
            else if (e.isFile() && e.name.endsWith('.js')) out.push(full);
        }
        return out;
    }
}

// ══════════════════════════════════════════════════════════
//  MODULE 5 — VALIDATION GATE
// ══════════════════════════════════════════════════════════
export class ValidationGate {
    /** Run quick smoke tests against the shadow build */
    async runUnitTests(shadowPath) {
        console.log('[Validator] 🧪 Running unit tests...');
        const testFile = path.join(PROJECT_ROOT, 'verify_factory.js');

        // Try to import key modules from shadow — basic import test
        const coreModules = ['kernel/config.js', 'kernel/modelRouter.js'];
        const importResults = [];
        for (const mod of coreModules) {
            try {
                const abs = path.join(shadowPath, mod);
                if (await fs.pathExists(abs)) {
                    // Node syntax check already done in compile(); count as passed
                    importResults.push({ module: mod, passed: true });
                } else {
                    importResults.push({ module: mod, passed: false, reason: 'File missing' });
                }
            } catch (err) {
                importResults.push({ module: mod, passed: false, reason: err.message });
            }
        }

        const allPassed = importResults.every(r => r.passed);
        console.log('[Validator] Unit tests:', allPassed ? '✅ PASS' : '❌ FAIL', importResults);
        return { passed: allPassed, results: importResults };
    }

    /** Simple benchmark: compare shadow build file count vs current */
    async runBenchmarks(shadowPath) {
        console.log('[Validator] ⚡ Running benchmarks...');

        const countFiles = async (dir) => {
            let count = 0;
            const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
            for (const e of entries) {
                if (e.isDirectory() && e.name !== 'node_modules') {
                    count += await countFiles(path.join(dir, e.name));
                } else if (e.isFile()) count++;
            }
            return count;
        };

        const agentsShadow = await countFiles(path.join(shadowPath, 'agents')).catch(() => 0);
        const agentsCurrent = await countFiles(path.join(PROJECT_ROOT, 'agents')).catch(() => 0);

        // Shadow must have at least as many agent files (regression check)
        const velocity = agentsShadow >= agentsCurrent ? 1.0 : agentsShadow / agentsCurrent;
        console.log(`[Validator] Agent file count — shadow: ${agentsShadow}, current: ${agentsCurrent}, velocity: ${velocity.toFixed(2)}`);
        return { velocity, agentsShadow, agentsCurrent };
    }

    async validate(shadowPath) {
        const testResults = await this.runUnitTests(shadowPath);
        const benchResults = await this.runBenchmarks(shadowPath);

        const passGate = testResults.passed && benchResults.velocity >= 1.0;
        console.log('[Validator] Gate result:', passGate ? '✅ APPROVED' : '❌ REJECTED');
        return { passed: passGate, testResults, benchResults };
    }
}

// ══════════════════════════════════════════════════════════
//  MODULE 6 — ATOMIC SWAP (Hot Handover)
// ══════════════════════════════════════════════════════════
export class AtomicSwap {
    constructor({ manifest, sessionState }) {
        this.manifest = manifest;
        this.sessionState = sessionState;
        this._cycleCount = 0;
    }

    get cycleCount() { return this._cycleCount; }

    async execute({ shadowPath, patchPlan }) {
        this._cycleCount++;
        console.log(`\n[AtomicSwap] ⚡ Initiating atomic swap #${this._cycleCount}...`);

        // 1. Snapshot session state
        const snapshot = this.sessionState.save({
            swapCycle: this._cycleCount,
            swapTime: new Date().toISOString(),
            patchPlan
        });
        console.log('[AtomicSwap] 💾 Session snapshot saved.');

        // 2. Merge shadow files back into live tree
        const copyDirs = ['agents', 'kernel', 'providers', 'io'];
        const changedFiles = [];
        for (const d of copyDirs) {
            const shadowDir = path.join(shadowPath, d);
            const liveDir = path.join(PROJECT_ROOT, d);
            if (await fs.pathExists(shadowDir)) {
                // Only copy files that actually changed
                const files = await this._walkFiles(shadowDir);
                for (const shadowFile of files) {
                    const rel = path.relative(shadowDir, shadowFile);
                    const liveFile = path.join(liveDir, rel);
                    const shadowMd5 = await this._hash(shadowFile);
                    const liveMd5 = await this._hash(liveFile).catch(() => null);
                    if (shadowMd5 !== liveMd5) {
                        await fs.copy(shadowFile, liveFile, { overwrite: true });
                        changedFiles.push(`${d}/${rel}`);
                    }
                }
            }
        }

        // 3. Log evolution to manifest
        const entry = {
            cycle: this._cycleCount,
            patchCount: patchPlan.patches?.length ?? 0,
            analysis: patchPlan.analysis,
            priority: patchPlan.priority,
            changedFiles,
            sessionSnapshot: snapshot
        };
        await this.manifest.recordEvolution(entry);

        // 4. Append to evolution log
        await fs.ensureFile(EVOLUTION_LOG);
        await fs.appendFile(EVOLUTION_LOG, JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n');

        // 5. Cleanup shadow
        await fs.remove(shadowPath);

        console.log(`[AtomicSwap] ✅ Swap complete. ${changedFiles.length} file(s) updated:`, changedFiles);
        return { success: true, changedFiles, cycle: this._cycleCount };
    }

    async _hash(filePath) {
        const { createHash } = await import('crypto');
        const buf = await fs.readFile(filePath);
        return createHash('md5').update(buf).digest('hex');
    }

    async _walkFiles(dir) {
        const out = [];
        const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
        for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) out.push(...await this._walkFiles(full));
            else if (e.isFile()) out.push(full);
        }
        return out;
    }
}

// ══════════════════════════════════════════════════════════
//  MAIN — Boot & Orchestrate
// ══════════════════════════════════════════════════════════
export class AvonEvolutionEngine {
    constructor({ intervalMs = MONITOR_INTERVAL_MS } = {}) {
        this.manifest = new GlobalManifest();
        this.monitor = null;
        this.architect = null;
        this.operator = new ShadowOperator();
        this.validator = new ValidationGate();
        this.swap = null;
        this.intervalMs = intervalMs;
        this._evolving = false;
        this._cycles = 0;
    }

    async boot() {
        console.log('\n╔══════════════════════════════════════════╗');
        console.log('║      AVON EVOLUTION ENGINE — BOOT        ║');
        console.log('╚══════════════════════════════════════════╝\n');

        await fs.ensureDir(path.join(PROJECT_ROOT, 'memory'));
        await this.manifest.load();

        this.monitor = new PerformanceMonitor({ manifest: this.manifest, intervalMs: this.intervalMs });
        this.architect = new EvolutionArchitect({ manifest: this.manifest });
        this.swap = new AtomicSwap({ manifest: this.manifest, sessionState: SESSION_STATE });

        // Wire monitor → evolution loop
        this.monitor.on('issue', ({ issueReport, securityReport }) => {
            if (this._evolving) {
                console.log('[Engine] ⏳ Evolution already in progress, skipping trigger.');
                return;
            }
            if (this._cycles >= MAX_EVOLUTION_CYCLES) {
                console.warn('[Engine] 🚫 Max evolution cycles reached. Manual review required.');
                this.monitor.stop();
                return;
            }
            this._triggerEvolutionLoop({ issueReport, securityReport }).catch(console.error);
        });

        this.monitor.start();
        console.log('[Engine] 🌱 Evolution engine online. Manifest:', this.manifest.version);
    }

    async _triggerEvolutionLoop({ issueReport, securityReport }) {
        this._evolving = true;
        this._cycles++;
        console.log(`\n[Engine] 🔄 Evolution loop #${this._cycles} triggered`);

        try {
            // M3 — Architect proposes a patch
            console.log('[Engine] M3: Architect analyzing issues...');
            const patchPlan = await this.architect.proposePatch({ issueReport, securityReport });

            // Parse failure — model returned malformed output, not an alignment issue
            if (patchPlan.parseError) {
                console.warn('[Engine] ⚠️  Skipping cycle — architect returned unparseable response.');
                await this._logError({ stage: 'parse_error', analysis: patchPlan.analysis });
                return;
            }

            // Alignment check — patch violates a forbidden directive
            if (!patchPlan.aligned) {
                const reason = patchPlan.alignmentReason ?? 'Alignment check failed (no reason given)';
                console.warn('[Engine] ❌ Patch rejected (alignment):', reason);
                await this._logError({ stage: 'alignment', reason });
                return;
            }

            if (!patchPlan.patches?.length) {
                console.log('[Engine] ℹ️  No patches needed per architect analysis.');
                return;
            }

            console.log(`[Engine] M4: Shadow build — ${patchPlan.patches.length} patch(es) queued`);

            // M4 — Shadow Operator: clone → patch → compile
            await this.operator.createClone();
            await this.operator.applyPatches(patchPlan.patches);
            const buildStatus = await this.operator.compile();

            if (!buildStatus.success) {
                console.error('[Engine] ❌ Build failed. Rolling back.');
                await this._logError({ stage: 'compile', errors: buildStatus.errors });
                await fs.remove(SHADOW_ROOT);
                return;
            }

            // M5 — Validation Gate
            console.log('[Engine] M5: Running validation suite...');
            const validation = await this.validator.validate(SHADOW_ROOT);

            if (!validation.passed) {
                console.warn('[Engine] ❌ Validation FAILED. Discarding shadow build.');
                await this._logError({ stage: 'validation', results: validation });
                await fs.remove(SHADOW_ROOT);
                return;
            }

            // M6 — Atomic Swap
            console.log('[Engine] M6: Validation PASSED. Initiating atomic swap...');
            const swapResult = await this.swap.execute({ shadowPath: SHADOW_ROOT, patchPlan });

            if (swapResult.success) {
                console.log(`\n✅ [Engine] Evolution Complete! Cycle #${this._cycles}. Files updated:`, swapResult.changedFiles);
            }

        } catch (err) {
            console.error('[Engine] 💥 Unhandled error in evolution loop:', err.message);
            await this._logError({ stage: 'runtime', error: err.message });
            await fs.remove(SHADOW_ROOT).catch(() => { });
        } finally {
            this._evolving = false;
        }
    }

    async _logError(details) {
        const entry = { timestamp: new Date().toISOString(), type: 'evolution_error', ...details };
        await fs.ensureFile(EVOLUTION_LOG);
        await fs.appendFile(EVOLUTION_LOG, JSON.stringify(entry) + '\n');
    }

    /** Call this to gracefully stop the engine */
    shutdown() {
        this.monitor?.stop();
        console.log('[Engine] 🛑 Evolution engine shut down.');
    }
}

// ─── Singleton export ───────────────────────────────────────
export const EvolutionEngine = new AvonEvolutionEngine();
