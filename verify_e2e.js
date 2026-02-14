async function testEndToEndBuild() {
    console.log("🚀 TRIGGERING END-TO-END VELOCITY BUILD...");
    const API_URL = 'http://localhost:4000/api';

    try {
        // 1. Auth
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'avon_admin', role: 'industrial' })
        });
        const { token } = await loginRes.json();

        // 2. Generate Site
        const prompt = "A futuristic cyber-security landing page for a quantum computing firm.";
        console.log(`📡 Command: ${prompt}`);
        const genRes = await fetch(`${API_URL}/generate-site`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt, templateId: 'vibe-03' })
        });
        const site = await genRes.json();

        console.log("✅ SITE GENERATED:");
        console.log(`   ID: ${site.node_id}`);
        console.log(`   URL: http://localhost:3001/?id=${site.node_id}`);
        console.log(`   Plan: ${site.plan.substring(0, 100)}...`);

        console.log("\n✨ VELOCITY HANDSHAKE SUCCESS! You can now view this ID in the dashboard.");
    } catch (err) {
        console.error("❌ BUILD FAILED:", err.message);
    }
}

testEndToEndBuild();
