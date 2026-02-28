import fetch from 'node-fetch';

async function verifyAgents() {
    const API_URL = 'http://localhost:4000/api';

    console.log("🔍 Verifying Velocity Agent Swarm Connectivity...");

    try {
        // 1. Health Check
        console.log("📡 Checking System Health...");
        const healthRes = await fetch(`${API_URL}/health`);
        if (!healthRes.ok) throw new Error("Backend offline");
        const health = await healthRes.json();

        console.log(`✅ System Status: ${health.status.toUpperCase()}`);
        console.log(`🧬 Active Provider: ${health.provider}`);
        console.log("🤖 Agent Status:");
        Object.entries(health.agents).forEach(([name, status]) => {
            console.log(`   - ${name.padEnd(12)}: ${status}`);
        });

        // 2. Auth Test
        console.log("\n🔑 Verifying REST API Authentication...");
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'verify_bot', role: 'industrial' })
        });
        const { token } = await loginRes.json();
        if (token) console.log("✅ Auth Handshake: SUCCESS");

        // 3. Swarm Core Capability Check (Dry Run)
        console.log("\n🚀 Testing Swarm Trigger Capability...");
        const dryRunRes = await fetch(`${API_URL}/generate-site`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                prompt: "Verification Dry Run",
                theme: 'swarm'
            })
        });
        const buildInfo = await dryRunRes.json();
        if (buildInfo.node_id) {
            console.log(`✅ Swarm Orchestration: INITIALIZED (Node: ${buildInfo.node_id})`);
            console.log(`✨ Result: Agents are connected to the REST API and ready for headless operation.`);
        }

    } catch (err) {
        console.error("❌ Connectivity Failure:", err.message);
        console.log("\nTroubleshooting:");
        console.log("1. Ensure the backend is running: cd avon-backend && npm run dev");
        console.log("2. Check for port 4000 availability.");
        console.log("3. If running remotely, ensure OPENAI_API_KEY is in your environment.");
    }
}

verifyAgents();
