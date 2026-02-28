#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════
 *  LM-003: Evolution Log Archiver
 *  scripts/archiveEvolutionLog.js
 *
 *  Velocity Swarm — Llama/Phi-4 Lane
 *  Directive: VD-2026-02-27-001
 * ═══════════════════════════════════════════════════════════
 *
 *  If memory/evolution_log.jsonl exceeds 1 MB, rotate it to
 *  a dated backup file and print a summary.
 *
 *  Usage:
 *    node scripts/archiveEvolutionLog.js
 *
 *  Schedule with:
 *    node -e "setInterval(()=>import('./scripts/archiveEvolutionLog.js'),3600_000)"
 * ═══════════════════════════════════════════════════════════
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const LOG_PATH = path.join(ROOT, 'memory', 'evolution_log.jsonl');
const MAX_BYTES = 1_024 * 1_024; // 1 MB

/**
 * Parse the JSONL log and return structured entries + summary stats.
 */
function parseLog(raw) {
    const lines = raw.trim().split('\n').filter(Boolean);
    const entries = lines.map(l => {
        try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);

    // Tally cycle numbers and most-patched files
    const cycleSet = new Set();
    const fileCounts = {};

    for (const e of entries) {
        if (e.cycle != null) cycleSet.add(e.cycle);
        if (Array.isArray(e.changedFiles)) {
            for (const f of e.changedFiles) {
                fileCounts[f] = (fileCounts[f] || 0) + 1;
            }
        }
    }

    const topFile = Object.entries(fileCounts).sort((a, b) => b[1] - a[1])[0];

    return {
        entries,
        totalEntries: entries.length,
        totalCycles: cycleSet.size,
        topPatchTarget: topFile ? topFile[0] : 'n/a',
        topPatchCount: topFile ? topFile[1] : 0,
        filePatchCounts: fileCounts,
    };
}

/**
 * Main archiver routine.
 */
async function archive() {
    console.log('[Archiver] 🔍 Checking evolution log...');

    await fs.ensureFile(LOG_PATH);
    const stat = await fs.stat(LOG_PATH);
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

    console.log(`[Archiver] Log size: ${sizeMB} MB (threshold: 1 MB)`);

    const raw = await fs.readFile(LOG_PATH, 'utf8');
    const summary = parseLog(raw);

    // ── Always print summary ────────────────────────────────────
    console.log('\n[Archiver] 📊 EVOLUTION LOG SUMMARY');
    console.log(`  Total entries    : ${summary.totalEntries}`);
    console.log(`  Evolution cycles : ${summary.totalCycles}`);
    console.log(`  Top patch target : ${summary.topPatchTarget} (patched ${summary.topPatchCount}x)`);

    if (summary.filePatchCounts && Object.keys(summary.filePatchCounts).length > 0) {
        console.log('\n  File patch frequency:');
        const sorted = Object.entries(summary.filePatchCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        for (const [file, count] of sorted) {
            console.log(`    ${count}x  ${file}`);
        }
    }

    // ── Rotate if over threshold ─────────────────────────────
    if (stat.size < MAX_BYTES) {
        console.log('\n[Archiver] ✅ Log is within size limit. No rotation needed.\n');
        return summary;
    }

    const date = new Date().toISOString().split('T')[0];
    const backupName = `evolution_log.${date}.jsonl.bak`;
    const backupPath = path.join(ROOT, 'memory', backupName);

    console.log(`\n[Archiver] ⚠️  Log exceeds 1 MB. Rotating → ${backupName}`);
    await fs.copy(LOG_PATH, backupPath);
    await fs.writeFile(LOG_PATH, ''); // Truncate original

    console.log(`[Archiver] ✅ Rotation complete. Backup: memory/${backupName}`);
    console.log(`[Archiver] 🧹 Active log cleared. Fresh start.\n`);

    return { ...summary, rotated: true, backupFile: backupName };
}

// ─── Run ──────────────────────────────────────────────────────
archive()
    .then(result => {
        if (result.rotated) {
            console.log('[Archiver] 📦 Summary written. Rotation done.');
        }
    })
    .catch(err => {
        console.error('[Archiver] ❌ Error:', err.message);
        process.exit(1);
    });

export { archive, parseLog };
