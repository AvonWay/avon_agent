import fetch from 'node-fetch';

async function triggerBuild() {
    try {
        const loginRes = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'avon_admin', role: 'industrial' })
        });
        const { token } = await loginRes.json();

        console.log("🚀 Manually triggering Swarm Build for Betting Engine...");
        const res = await fetch('http://localhost:4000/api/generate-site', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                prompt: "Betting Scraper & Probability Engine (Top 5 Platforms)",
                templateId: 'vibe-01',
                tone: 'Industrial Blue',
                theme: 'swarm'
            })
        });
        const data = await res.json();
        console.log("✅ Build Response:", data);

        console.log("\nWaiting for Swarm to complete (check backend logs)...");
    } catch (err) {
        console.error("Failed to trigger build:", err.message);
    }
}

triggerBuild();
