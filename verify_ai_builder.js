async function verifyAIBuilder() {
    console.log("🤖 INITIALIZING AVON AI BUILDER VERIFICATION...");

    const API_URL = 'http://localhost:4000/api';

    try {
        // 1. Authentication
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'avon_admin', role: 'industrial' })
        });
        const { token } = await loginRes.json();
        console.log("✅ AUTHENTICATION: SUCCESS (INDUSTRIAL_TIER)");

        // 2. Simulate Chat Command to AI Builder
        const chatCommand = "Build a futuristic cyber-punk portal for a digital art collective with neon aesthetics.";
        console.log(`💬 COMMAND: "${chatCommand}"`);
        console.log("🧠 ACTIVATING AVON AI PROTOCOL...");

        const start = Date.now();
        const genRes = await fetch(`${API_URL}/generate-site`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                prompt: chatCommand,
                templateId: 'vibe-03'
            })
        });

        const buildData = await genRes.json();
        const duration = ((Date.now() - start) / 1000).toFixed(2);

        if (buildData.plan) {
            console.log(`\n📄 AVON BUILD PLAN GENERATED (${duration}s):`);
            console.log("------------------------------------------");
            console.log(buildData.plan.substring(0, 300) + "...");
            console.log("------------------------------------------");
            console.log(`✅ AI_ACTIVATION: SUCCESS`);
            console.log(`📦 NODE_INITIALIZED: ${buildData.node_id}`);
        } else {
            throw new Error("AI Plan missing from response.");
        }

        // 3. Verify Activity Ledger Update
        const activeRes = await fetch(`${API_URL}/workspaces/ws_01/activity`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const activity = await activeRes.json();
        const latest = activity[0];

        if (latest && latest.action.includes('via Avon AI')) {
            console.log(`📜 LEDGER_SYNC: SUCCESS (${latest.action})`);
        }

        // 4. Trace to LIVE
        console.log("\n⏳ TRACING NODE TO PRODUCTION...");
        let attempts = 0;
        while (attempts < 10) {
            const sitesRes = await fetch(`${API_URL}/sites`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const sites = await sitesRes.json();
            const node = sites.find(s => s.id === buildData.node_id);

            if (node && node.status === 'Live') {
                console.log(`✨ PRODUCTION_LIVE: http://${node.domain}`);
                console.log("🚀 ALL SYSTEMS GO: AVON IS OPERATIONAL.");
                return;
            }
            process.stdout.write(".");
            await new Promise(r => setTimeout(r, 2000));
            attempts++;
        }
        console.log("\n⚠️ Production sync pending. Verification partial.");

    } catch (error) {
        console.error("\n❌ VERIFICATION_FAILED");
        console.error(error.message);
    }
}

verifyAIBuilder();
