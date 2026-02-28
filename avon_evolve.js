#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════╗
 *  avon_evolve.js  — Avon Evolution Engine Boot Script
 *  Run: node avon_evolve.js [--dry-run] [--interval=<ms>]
 * ╚══════════════════════════════════════════════════════╝
 *
 *  --dry-run      Run one monitor tick without applying patches
 *  --interval=N   Override monitor interval in milliseconds (default: 60000)
 *  --once         Run a single evolution cycle then exit
 */

import dotenv from 'dotenv';
dotenv.config();

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isOnce = args.includes('--once');
const intervalArg = args.find(a => a.startsWith('--interval='));
const intervalMs = intervalArg ? parseInt(intervalArg.split('=')[1]) : 60_000;

console.log(`
╔══════════════════════════════════════════════════════╗
║          AVON EVOLUTION ENGINE — STANDALONE          ║
╠══════════════════════════════════════════════════════╣
║  mode:     ${isDryRun ? 'DRY-RUN (no file writes)  ' : isOnce ? 'SINGLE CYCLE              ' : 'CONTINUOUS MONITOR        '}   ║
║  interval: ${String(intervalMs + 'ms').padEnd(30)} ║
╚══════════════════════════════════════════════════════╝
`);

async function run() {
    const { AvonEvolutionEngine, GlobalManifest, PerformanceMonitor, EvolutionArchitect } =
        await import('./kernel/evolutionEngine.js');

    if (isDryRun) {
        // ── DRY RUN: one monitor tick, show telemetry + SAST only ──
        const manifest = await new GlobalManifest().load();
        const monitor = new PerformanceMonitor({ manifest, intervalMs });

        console.log('🔭 [DRY RUN] Collecting telemetry...');
        const telemetry = await monitor.getTelemetry();
        console.log('📊 Telemetry:', JSON.stringify(telemetry, null, 2));

        console.log('\n🔒 [DRY RUN] Running SAST scan...');
        const vulns = await monitor.runSAST();
        if (vulns.length === 0) {
            console.log('✅ No vulnerabilities detected.');
        } else {
            console.log(`⚠️  ${vulns.length} finding(s):`);
            vulns.forEach(v => console.log(`  [${v.severity}] ${v.label} — ${v.file}`));
        }

        console.log('\n📋 [DRY RUN] Mission Manifest objectives:');
        manifest.objectives.forEach(o => console.log(`  • ${o}`));
        console.log('\n✅ Dry run complete. No files modified.');
        return;
    }

    if (isOnce) {
        // ── ONCE: single forced evolution cycle ──
        const engine = new AvonEvolutionEngine({ intervalMs });
        await engine.boot();

        // Wait for the initial monitor tick to fire
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Force a cycle with mock issue
        console.log('\n🔄 Forcing single evolution cycle...');
        await engine._triggerEvolutionLoop({
            issueReport: {
                latencyBreached: true,
                latencyMs: 9999,
                memoryMB: 200,
                metrics: { forced: true, timestamp: new Date().toISOString() }
            },
            securityReport: { vulnerabilities: [], critical: false, high: false }
        });

        engine.shutdown();
        console.log('\n✅ Single-cycle complete. Exiting.');
        process.exit(0);
        return;
    }

    // ── CONTINUOUS MODE: full autonomous loop ──
    const engine = new AvonEvolutionEngine({ intervalMs });
    await engine.boot();

    // Graceful shutdown handlers
    const shutdown = () => {
        console.log('\n[Boot] Received shutdown signal...');
        engine.shutdown();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    console.log('\n🧬 Avon Evolution Engine is running. Press Ctrl+C to stop.\n');
}

run().catch(err => {
    console.error('❌ Fatal boot error:', err);
    process.exit(1);
});
