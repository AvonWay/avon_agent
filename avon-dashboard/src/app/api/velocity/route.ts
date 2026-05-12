import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// POST /api/velocity
// Starts the Velocity CLI Swarm
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { goal } = body;

        if (!goal) {
            return NextResponse.json({ error: "Goal is required" }, { status: 400 });
        }

        console.log(`[Next.js] Spawning Velocity Swarm for goal: "${goal}"`);

        // The dashboard is in Avon_Agent/avon-dashboard, 
        // the CLI is in Avon_Agent/cli.js
        const workingDir = String(process.cwd()).replace(/\\/g, '/').replace('/avon-dashboard', '');
        const cliPath = `${workingDir}/cli.js`;

        // Spawn the background process
        const child = spawn('node', [cliPath, goal], {
            cwd: workingDir,
            shell: true,
            detached: true, // Let it run independently
            stdio: 'ignore' // We will implement WebSocket/SSE streaming in the next step
        });

        child.unref(); // Don't wait for it to finish to return the HTTP response

        return NextResponse.json({ 
            status: "success", 
            message: "Swarm initiated in background",
            goal: goal,
            pid: child.pid
        });

    } catch (error: any) {
        console.error("[Next.js] API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
