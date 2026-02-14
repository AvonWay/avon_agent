import ollama from 'ollama';
import promptSync from 'prompt-sync';
import fs from 'fs-extra';
import { execSync } from 'child_process';

const prompt = promptSync();

const AVON_SYSTEM_PROMPT = `
# ROLE: Avon, High-Velocity Vibe Coding Agent
You are Avon, a specialized AI agent designed for "Velocity Scaling"—the massive industrialization of web development. Your core mission is to build and deploy up to 1,000 websites monthly, moving from a single prompt to a live URL in under 60 seconds.

# CORE TECH STACK
- Frontend: 10Web (AI Generation) & GitHub Pages (Static Hosting)
- Backend/Memory: Supabase (Postgres, Edge Functions, RLS)
- Automation: GitHub Actions & Supabase Webhooks
- Dev Environment: Vite (HMR, Dev Server, Watch Mode)

# GOALS & BEHAVIORS
1. MASSIVE SCALE (NODE ARCHITECTURE):
   - Treat every website as a "Node" in a larger deployment grid. 
   - Prioritize templated efficiency and programmatic workflows over manual customization.
2. SUPABASE INTEGRATION (MANDATORY):
   - Every site MUST be registered with a unique site_id in the deployments table.
   - Automatically provision Row-Level Security (RLS) policies for every new user/site instance.
   - Maintain strict logging: Store deployment logs, performance metrics, and site metadata in Supabase.
3. GITHUB PAGES AUTOMATION:
   - Programmatically interact with the GitHub API to spin up repositories.
   - Force-push "Vibe Coded" assets directly to the gh-pages branch.
4. DEV OPS:
   - Capable of initializing a local development server with Hot Module Replacement (HMR).
   - Ensures build processes stay active in 'Watch Mode' for live previews.

# OPERATIONAL RULES
- ERROR HANDLING: If a site fails, log the error code to Supabase immediately and move to the next build.
- PERFORMANCE: Use 'Small/Clean' code architecture.
- DYNAMIC HYBRID: Keep frontend static on GitHub Pages; use Supabase Edge Functions for dynamic logic.

# COMMAND PROTOCOLS
- TRIGGER: "Initialize Dev Server"
- TRIGGER: "Build [X] sites for [Industry]"
- WORKFLOW: 
  1. Generate optimized code/config.
  2. Provide terminal commands to scaffold, install, and run.
  3. Return result as a Markdown block.
`;

async function startVibeCoder() {
    console.log("🚀 Vibe Coder Initialized (Velocity Mode)");

    // Phase 1: Input
    // We allow both the structured questioning or a direct instruction
    const choice = prompt("[?] Structured Questions (s) or Direct Instruction (d)? ");
    let userInput = "";

    if (choice.toLowerCase() === 's') {
        let buildSpecs = {};
        const questions = [
            { key: 'purpose', q: "What is the primary vibe/purpose of this app?" },
            { key: 'tech', q: "Any specific stack? (e.g., React, Node, Python)" },
            { key: 'ui', q: "Should the UI be Dark, Minimal, or Brutalist?" },
            { key: 'features', q: "List 3 'must-have' features for this build:" }
        ];

        for (let item of questions) {
            buildSpecs[item.key] = prompt(`[?] ${item.q}: `);
        }
        userInput = `Build plan for specs: ${JSON.stringify(buildSpecs)}`;
    } else {
        userInput = prompt("[?] What would you like Avon to do? ");
    }

    console.log("\n⚡ Analyzing specs and preparing Velocity Build Plan...");

    // Phase 2: Agent Reasoning via Ollama
    const response = await ollama.chat({
        model: 'Avon:latest',
        messages: [
            { role: 'system', content: AVON_SYSTEM_PROMPT },
            {
                role: 'user',
                content: `${userInput}. Output only the essential terminal commands needed to achieve this. If it involves a dev server, ensure it includes the command to start it with HMR.`
            }
        ],
    });

    const plan = response.message.content;

    // Phase 3: Display & Execute
    console.log("\n--- VELOCITY BUILD PLAN ---");
    console.log(plan);

    const confirm = prompt("Ready to execute these commands? (y/n): ");
    if (confirm && confirm.toLowerCase() === 'y') {
        await fs.writeFile('build_plan.md', plan);
        console.log("✅ Plan saved to build_plan.md. Executing...");

        // Extract commands from markdown code blocks
        const commandsMatches = plan.match(/```(?:bash|powershell|sh|cmd)?\s*([\s\S]*?)```/g);
        if (commandsMatches) {
            for (let block of commandsMatches) {
                const cmdLines = block.replace(/```(?:bash|powershell|sh|cmd)?/g, '').replace(/```/g, '').trim().split('\n');
                for (let cmd of cmdLines) {
                    if (cmd.trim() && !cmd.trim().startsWith('#')) {
                        console.log(`\n> Executing: ${cmd}`);
                        try {
                            // Using spawn for better handling of interactive or long-running commands like dev servers
                            execSync(cmd, { stdio: 'inherit', shell: true });
                        } catch (e) {
                            console.error(`Execution failed: ${cmd}`);
                        }
                    }
                }
            }
        } else {
            console.log("No commands found in the plan to execute.");
        }
    }
}

startVibeCoder();
