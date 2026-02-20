// Use native fetch (Node 18+)

async function main() {
    console.log("🚀 Running Local Build Test...");

    try {
        // 1. Login
        const loginRes = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'test_user', role: 'industrial' })
        });
        const auth = await loginRes.json();
        if (!auth.token) throw new Error("Login failed");

        console.log("✅ Configured Auth Token:", auth.token.substring(0, 10) + "...");

        // 2. Trigger Build
        const prompt = "A futuristic clean energy company dashboard";
        console.log(`🏗️  Requesting AI Build: "${prompt}" (Tone: Light Blue)...`);

        const buildRes = await fetch('http://localhost:4000/api/generate-site', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`
            },
            body: JSON.stringify({
                prompt,
                templateId: 'vibe-01',
                tone: 'Light Blue',
                theme: 'light'
            })
        });

        const buildData = await buildRes.json();

        if (buildData.node_id) {
            console.log("✅ Build Successful!");
            console.log(`🆔 Node ID: ${buildData.node_id}`);
            console.log(`🌐 URL: http://localhost:3001/?id=${buildData.node_id}`);
            console.log("📝 Plan Preview:", buildData.plan ? buildData.plan.substring(0, 100) + "..." : "N/A");
        } else {
            console.error("❌ Build Response Error:", buildData);
        }

    } catch (err) {
        console.error("❌ Test Failed:", err);
    }
}

main();
