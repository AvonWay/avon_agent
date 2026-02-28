import { Supervisor } from './agents/supervisor.js';
import fs from 'fs';
import path from 'path';

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
            const outPath = path.join(process.cwd(), 'previews', 'latest_build.html');
            fs.writeFileSync(outPath, result.artifact);
            console.log("✅ Velocity Build Successful!");
            console.log(`🌐 LIVE SERVER PREVIEW SAVED TO: ${outPath}`);
            console.log("Starting lightweight server for you to view it in browser...");
        } else {
            console.log("❌ Velocity Build Failed.");
            console.log(result.error);
        }
    } catch (err) {
        console.error("Critical Error during CLI execution:", err);
    }
}

runCLI();
