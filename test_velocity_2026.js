import { Supervisor } from "./agents/supervisor.js";

async function runTest() {
    console.log("🚀 TESTING VELOCITY 2026 PROTOCOL...");
    const goal = "Create a high-performance landing page for a decentralized quantum compute network. Must include a real-time node stats dashboard and a glassmorphism pricing section.";

    try {
        const result = await Supervisor.execute(goal);
        console.log("\n--- TEST RESULT ---");
        console.log("Status:", result.status);
        if (result.status === 'success') {
            console.log("✅ Workflow executed with Parallel Swarms and Self-Healing.");
            // console.log("Artifact Preview:", result.artifact.substring(0, 200) + "...");
        }
    } catch (err) {
        console.error("❌ Test Failed:", err);
    }
}

runTest();
