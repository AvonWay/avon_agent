import promptSync from 'prompt-sync';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { ensureOllama } from "./kernel/ollamaSupervisor.js";
import { runWithFailover } from "./kernel/failover.js";
import { detectTemplate, TEMPLATES } from "./kernel/templateManifest.js";

const prompt = promptSync();

const AVON_SYSTEM_PROMPT = `
# ROLE: Avon, High-Velocity Template Architect

You are Avon, a specialized AI agent designed for "Velocity Scaling"—the massive industrialization of web development. Your core mission is to build and deploy up to 1,000 websites monthly, moving from a single prompt to a live URL in under 60 seconds.

# CRITICAL DIRECTIVE: TEMPLATE INJECTION MODE
Do NOT "start from zero" for standard requests. You are equipped with an internal Template Manifest.

When a user requests an E-commerce or Real Estate site, BYPASS the exploratory phase and INJECT the pre-configured stack immediately.

## [Template: E-COMMERCE_CORE]
- Stack: Next.js 15, Tailwind CSS, Shadcn UI
- Logic: Pre-configured cart-store.ts (Zustand), stripe-webhook.ts, product-grid components
- Data: Auto-generate mock-products.json so the UI is populated instantly
- State: Zustand for cart state — "Add to Cart" MUST work on first load

## [Template: REAL_ESTATE_CORE]
- Stack: Next.js 15, Leaflet/Mapbox, Framer Motion
- Logic: Pre-built filter-engine.js (Price, Beds, Baths), listing-card components, agent-contact-form
- Data: Auto-generate listings-db.sql for Supabase or mock-listings.json for local state

# EXECUTION RULES
1. When the user says "Build me a [Category] site", DO NOT ASK QUESTIONS.
2. Instantiate the FULL folder structure in ONE blast.
3. Use PLACEHOLDERS for branding (Logo/Colors) so the user can "Vibe Code" the aesthetic AFTER functionality is live.
4. PRIORITIZE INTERACTIVITY over visual polish in the first 30 seconds:
   - Buttons MUST click
   - Cart MUST update
   - Filters MUST filter
   - Forms MUST submit

# CORE TECH STACK
- Frontend: Next.js 15 + Tailwind CSS + Shadcn UI
- Backend/Memory: Supabase (Postgres, Edge Functions, RLS)
- State: Zustand (client) / React Context (lightweight)
- Automation: GitHub Actions & Supabase Webhooks
- Dev Environment: Vite or Next.js dev server (HMR, Watch Mode)

# OPERATIONAL RULES
- ERROR HANDLING: If a site fails, log the error and move to the next build.
- PERFORMANCE: Use 'Small/Clean' code architecture.
- MOCK DATA FIRST: NEVER deliver an empty site. Always include mock data.
- DYNAMIC HYBRID: Keep frontend static; use Edge Functions for dynamic logic.

# COMMAND PROTOCOLS
- TRIGGER: "Initialize Dev Server"
- TRIGGER: "Build [X] sites for [Industry]"
- WORKFLOW:
  1. Detect template (or generate custom).
  2. Inject folder structure + mock data.
  3. Provide terminal commands to scaffold, install, and run.
  4. Return result as a Markdown block.
`;

async function startAgents() {
    console.log("🚀 Avon Initialized (Template Injection Mode)");

    // Phase 1: Input
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

    // Phase 1.5: Template Detection
    const template = detectTemplate(userInput);

    if (template) {
        console.log(`\n⚡ TEMPLATE DETECTED: ${template.name}`);
        console.log(`   Stack: ${template.stack.join(", ")}`);
        console.log(`   Files: ${template.structure.length} pre-configured`);
        console.log(`   Injecting template context into AI...\n`);

        // Inject template context into the prompt
        userInput += `\n\n[TEMPLATE INJECTED: ${template.name}]
Stack: ${template.stack.join(", ")}
Required Files: ${template.structure.join(", ")}
Placeholders: ${JSON.stringify(template.placeholders)}
IMPORTANT: Generate ALL files listed above. Include mock data. Buttons must work. Cart/Filters must be functional.`;
    } else {
        console.log("\n⚡ No template match — entering generative mode...\n");
    }

    console.log("⚡ Analyzing specs and preparing Velocity Build Plan...");

    // Phase 2: Agent Reasoning via Ollama (with Failover)
    const response = await runWithFailover({
        system: AVON_SYSTEM_PROMPT,
        messages: [
            {
                role: 'user',
                content: `${userInput}. Output only the essential terminal commands needed to achieve this. If it involves a dev server, ensure it includes the command to start it with HMR.`
            }
        ],
        attempts: [
            { model: "Avon:latest", timeoutMs: 90_000 }
        ]
    });

    const plan = response.message.content;

    // Phase 3: Display & Execute
    console.log("\n--- VELOCITY BUILD PLAN ---");
    console.log(plan);

    const confirm = prompt("Ready to execute these commands? (y/n): ");
    if (confirm && confirm.toLowerCase() === 'y') {
        await fs.writeFile('build_plan.md', plan);
        console.log("✅ Plan saved to build_plan.md. Executing...");

        // If template was detected, copy mock data fixtures first
        if (template) {
            const fixturesDir = path.resolve("kernel/fixtures");
            const targetDataDir = path.resolve("src/data");
            await fs.ensureDir(targetDataDir);

            if (template.name === "E-Commerce Core") {
                await fs.copy(
                    path.join(fixturesDir, "mock-products.json"),
                    path.join(targetDataDir, "mock-products.json")
                );
                console.log("📦 Injected: mock-products.json");
            } else if (template.name === "Real Estate Core") {
                await fs.copy(
                    path.join(fixturesDir, "mock-listings.json"),
                    path.join(targetDataDir, "mock-listings.json")
                );
                await fs.copy(
                    path.join(fixturesDir, "listings-db.sql"),
                    path.join(targetDataDir, "listings-db.sql")
                );
                console.log("📦 Injected: mock-listings.json + listings-db.sql");
            }
        }

        // Extract commands from markdown code blocks
        const commandsMatches = plan.match(/```(?:bash|powershell|sh|cmd)?\s*([\s\S]*?)```/g);
        if (commandsMatches) {
            for (let block of commandsMatches) {
                const cmdLines = block.replace(/```(?:bash|powershell|sh|cmd)?/g, '').replace(/```/g, '').trim().split('\n');
                for (let cmd of cmdLines) {
                    if (cmd.trim() && !cmd.trim().startsWith('#')) {
                        console.log(`\n> Executing: ${cmd}`);
                        try {
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

async function bootAntigravity() {
    await ensureOllama();
    await startAgents();
}

bootAntigravity();
