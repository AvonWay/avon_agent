import fetch from 'node-fetch';

async function checkNodes() {
    try {
        const loginRes = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'avon_admin', role: 'industrial' })
        });
        const { token } = await loginRes.json();

        const sitesRes = await fetch('http://localhost:4000/api/sites', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const sites = await sitesRes.json();

        console.log("Current Nodes in Velocity Backend:");
        if (sites.length === 0) console.log(" (No nodes found)");
        sites.forEach(s => {
            console.log(`- [${s.status}] ${s.name} (ID: ${s.id})`);
            if (s.build_artifact) {
                console.log(`  Artifact Size: ${s.build_artifact.length} chars`);
            }
        });
    } catch (err) {
        console.error("Failed to check backend:", err.message);
    }
}

checkNodes();
