async function checkSeedNode() {
    console.log("🔍 VERIFYING SEED NODE...");
    const API_URL = 'http://localhost:4000/api';

    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'avon_admin', role: 'industrial' })
        });
        const { token } = await loginRes.json();

        const sitesRes = await fetch(`${API_URL}/sites`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const sites = await sitesRes.json();

        console.log("📊 SITES DETECTED:", JSON.stringify(sites, null, 2));
        if (sites.length > 0) {
            console.log("✅ SEED NODE IS LIVE!");
        } else {
            console.log("❌ NO NODES FOUND!");
        }
    } catch (err) {
        console.error("❌ CONNECTION FAILED:", err.message);
    }
}

checkSeedNode();
