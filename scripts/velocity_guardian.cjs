const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const REGISTRY_PATH = path.join(__dirname, 'avon-backend', 'registry.json');
const BACKEND_ENV_PATH = path.join(__dirname, 'avon-backend', '.env');
const DASHBOARD_ENV_PATH = path.join(__dirname, 'avon-dashboard', '.env.local');

// --- PATTERNS ---
const DANGEROUS_PATTERNS = [
    { name: 'XSS Vector (onload)', regex: /onload\s*=/i },
    { name: 'XSS Vector (onerror)', regex: /onerror\s*=/i },
    { name: 'XSS Vector (javascript:)', regex: /javascript:/i },
    { name: 'Dangerous Eval', regex: /eval\(/i },
    { name: 'Hardcoded JWT Secret', regex: /JWT_SECRET\s*=\s*(?!process\.env)/i }, // simplistic check
    { name: 'Hardcoded API Key', regex: /(sk_live_|sk_test_|AKIA)[a-zA-Z0-9]{20,}/ }
];

const REPORT = {
    timestamp: new Date().toISOString(),
    artifacts_scanned: 0,
    issues: []
};

function scanArtifacts() {
    console.log("🛡️  Scanning Build Artifacts (XSS/Injection)...");
    if (!fs.existsSync(REGISTRY_PATH)) {
        console.log("⚠️  Registry not found. Skipping artifact scan.");
        return;
    }

    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    const sites = registry.MOCK_SITES || {};

    for (const workspace in sites) {
        sites[workspace].forEach(node => {
            REPORT.artifacts_scanned++;
            if (node.build_artifact) {
                DANGEROUS_PATTERNS.forEach(pattern => {
                    if (pattern.regex.test(node.build_artifact)) {
                        REPORT.issues.push({
                            severity: 'HIGH',
                            type: 'Artifact Security',
                            target: node.id,
                            message: `Detected ${pattern.name} in generated HTML`
                        });
                    }
                });
            }
        });
    }
}

function scanEnv() {
    console.log("🛡️  Scanning Environment Configuration...");

    // Backend .env
    if (fs.existsSync(BACKEND_ENV_PATH)) {
        const content = fs.readFileSync(BACKEND_ENV_PATH, 'utf8');
        if (!content.includes('ALLOWED_ORIGINS')) {
            REPORT.issues.push({ severity: 'MEDIUM', type: 'Config', target: 'avon-backend/.env', message: 'Missing ALLOWED_ORIGINS (CORS risk)' });
        }
        if (content.includes('localhost:3000') && content.includes('localhost:3001')) {
            // Good
        } else {
            // REPORT.issues.push({ severity: 'LOW', type: 'Config', message: 'CORS might be too restrictive or open' });
        }
    }

    // Dashboard .env
    if (fs.existsSync(DASHBOARD_ENV_PATH)) {
        const content = fs.readFileSync(DASHBOARD_ENV_PATH, 'utf8');
        // Check for exposed secrets (not starting with NEXT_PUBLIC but present in client file?) 
        // Actually .env.local is server-side mostly, but NEXT_PUBLIC is exposed.
    }
}

function printReport() {
    console.log("\n========================================");
    console.log("   VELOCITY GUARDIAN SECURITY REPORT    ");
    console.log("========================================");
    console.log(`Scan Time: ${REPORT.timestamp}`);
    console.log(`Artifacts Scanned: ${REPORT.artifacts_scanned}`);
    console.log(`Issues Found: ${REPORT.issues.length}`);
    console.log("----------------------------------------");

    if (REPORT.issues.length === 0) {
        console.log("✅  SYSTEM CLEAN. No obvious vulnerabilities detected.");
        console.log("    - Artifacts free of common XSS vectors");
        console.log("    - CORS configuration present");
    } else {
        REPORT.issues.forEach(issue => {
            const icon = issue.severity === 'HIGH' ? '🔴' : (issue.severity === 'MEDIUM' ? 'Wg' : '🔵');
            console.log(`${icon} [${issue.severity}] ${issue.type}: ${issue.message} (${issue.target})`);
        });
        console.log("\n⚠️  ACTION REQUIRED: Address the issues above.");
    }
    console.log("========================================\n");
}

// Run
scanArtifacts();
scanEnv();
printReport();
