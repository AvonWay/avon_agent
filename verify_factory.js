async function scaleFirstNode() {
    console.log("🚀 INITIALIZING INDUSTRIAL VELOCITY TEST...");

    // 1. Handshake with Backend
    try {
        const loginRes = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'avon_admin', role: 'industrial' })
        });
        const { token } = await loginRes.json();
        console.log("✅ AUTHENTICATION_LOCKED.");

        // 2. Trigger Site Factory
        console.log("🛠️ TRIGGERING SITE_FACTORY_NODE...");
        const genRes = await fetch('http://localhost:4000/api/generate-site', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                prompt: 'Industrial Verification Node #001',
                templateId: 'vibe-03'
            })
        });
        const buildData = await genRes.json();
        console.log(`📦 BUILD_QUEUED: ${buildData.node_id}`);

        // 3. Poll for "Live" Status
        console.log("⏳ POLLING CI/CD PIPELINE...");
        let isLive = false;
        let attempts = 0;

        while (!isLive && attempts < 15) {
            const sitesRes = await fetch('http://localhost:4000/api/sites', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const sites = await sitesRes.json();
            const node = sites.find(s => s.id === buildData.node_id);

            if (node && node.status === 'Live') {
                console.log("\n✨ VELOCITY_CRITICAL_SUCCESS!");
                console.log(`🌐 LIVE URL: http://${node.domain}`);
                console.log(`📊 STATUS: ${node.status}`);
                console.log(`🛡️ TIER: INDUSTRIAL`);
                isLive = true;
                break;
            } else {
                process.stdout.write(".");
                await new Promise(r => setTimeout(r, 2000));
                attempts++;
            }
        }

        if (!isLive) console.log("\n❌ TIMEOUT: Pipeline slow but operational.");
    } catch (e) {
        console.error("❌ FACTORY_OFFLINE: Ensure backend is running at http://localhost:4000");
        console.error(e.message);
    }
}

scaleFirstNode();
