import { Supervisor } from './agents/supervisor.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCLI() {
    const args = process.argv.slice(2);
    const goal = args.join(' ').trim();

    if (!goal) {
        console.error("❌ Error: Please provide a goal.");
        console.error("Example: node cli.js \"build a cyberpunk react native mobile app\"");
        process.exit(1);
    }

    console.log(`🚀 Velocity CLI Initiating...\nGoal: "${goal}"\n`);

    try {
        const result = await Supervisor.execute(goal);

        console.log("\n=================================");
        if (result.status === "success") {
            const projectAura = goal.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
            const timestamp = Date.now();
            const projectDir = path.join(process.cwd(), 'previews', `build_${projectAura}_${timestamp}`);
            fs.mkdirSync(projectDir, { recursive: true });

            // Write all extracted pages/files
            if (result.pages && Object.keys(result.pages).length > 0) {
                for (const [filename, content] of Object.entries(result.pages)) {
                    const filePath = path.join(projectDir, filename);
                    // Create subdirectories if the filename includes a path
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });
                    fs.writeFileSync(filePath, content);
                    console.log(`  📄 Written: ${filename} (${content.length} bytes)`);
                }
                console.log(`\n✅ Velocity Build Complete: ${Object.keys(result.pages).length} files saved.`);
                console.log(`📁 Project Directory: ${projectDir}`);
            } else {
                // Fallback: save raw artifact
                const outPath = path.join(projectDir, 'latest_build.html');
                fs.writeFileSync(outPath, result.artifact || '<!-- No artifact generated -->');
                console.log(`✅ Velocity Single-file Build Saved: ${outPath}`);
            }

            // Auto-launch local preview server
            console.log("\n🌐 Starting local preview server...");
            try {
                const { exec } = await import('child_process');
                const child = exec(`npx -y serve -s "${projectDir}" -l 3333`, { shell: true });
                child.stdout?.on('data', d => process.stdout.write(d));
                child.stderr?.on('data', d => process.stderr.write(d));
                console.log(`🌐 Preview: http://localhost:3333`);
                console.log("   Press Ctrl+C to stop the server.\n");
            } catch (e) {
                console.warn(`⚠️ Could not start preview server: ${e.message}`);
            }
        } else if (result.status === "cancelled") {
            console.log(`🚫 Build Cancelled: ${result.reason}`);
        } else {
            console.log("❌ Velocity Build Failed.");
            console.log(result.error || 'Unknown error');
            
            // Save failed artifact for debugging
            if (result.lastArtifact) {
                const debugDir = path.join(process.cwd(), 'previews', 'debug_failed_builds');
                fs.mkdirSync(debugDir, { recursive: true });
                const debugPath = path.join(debugDir, `failed_${Date.now()}.html`);
                fs.writeFileSync(debugPath, result.lastArtifact);
                console.log(`🛠️ Failed artifact saved for debugging: ${debugPath}`);
            }
        }
    } catch (err) {
        console.error("💥 Critical Error during CLI execution:", err.message);
        console.error(err.stack);
    }
}

runCLI();
