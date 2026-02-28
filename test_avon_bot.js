import { Supervisor } from './agents/supervisor.js';

async function testAvonBot() {
    console.log("🚀 Testing Avon_Bot (formerly OpenClaw) via Swarm Supervisor...");

    // We provide a prompt that clearly indicates a need for scaffolding/app/web/game dev
    // so the Architect knows to assign an "avon_bot" task.
    const goal = "Scaffold a new Next.js and Tailwind CSS project for a cyberpunk web application. Ensure production readiness.";

    console.log(`\nGoal: "${goal}"\n`);

    try {
        const result = await Supervisor.execute(goal);

        console.log("\n=================================");
        if (result.status === "success") {
            console.log("✅ Avon_Bot Test Successful!");
            console.log("Blueprint Plan:\n", JSON.parse(result.plan));
            console.log("\nGenerated Artifact:\n", result.artifact.substring(0, 1500) + "\n...[truncated]");
        } else {
            console.log("❌ Avon_Bot Test Failed.");
            console.log(result.error);
        }
    } catch (err) {
        console.error("Critical Error during test:", err);
    }
}

testAvonBot();
