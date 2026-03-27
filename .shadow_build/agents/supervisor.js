import fs from 'fs-extra';
import path from 'path';
import { PlannerAgent } from "./planner.js";
import { BuilderAgent } from "./builder.js";
import { ReviewerAgent } from "./reviewer.js";
import { ReflectionAgent } from "./reflection.js";
import { DistillationAgent } from "./distiller.js";
import { DesignerAgent } from "./designer.js";
import { ArchitectAgent } from "./architect.js";
import { GuardianAgent } from "./guardian.js";
import { SecurityAgent } from "./security.js";
import { VerifyAgent } from "./verify.js";
import { AvonBotAgent } from "./avon_bot.js";
import { webSearch } from "../io/search.js";
import { runReviewEnsemble } from "../kernel/modelRouter.js";
import { logModelRouting } from "../kernel/config.js";
import { TEMPLATES } from "../kernel/templateManifest.js";
import { LiaisonAgent, getClientApproval } from "./liaison.js";


import { RSI_LIMITS } from "../kernel/config.js";

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const HEURISTICS_PATH = path.join(PROJECT_ROOT, "memory/heuristics.md");
const CONSTITUTION_PATH_MD = path.join(PROJECT_ROOT, "PROJECT_CONSTITUTION.md");
const CONSTITUTION_PATH_JSON = path.join(PROJECT_ROOT, ".velocity_constitution.json");

/**
 * Parse multi-page artifacts from raw swarm output.
 * Looks for markdown code blocks tagged with filenames (e.g. ```index.html ... ```)
 * and extracts each file into a structured pages object.
 */
function parseMultiPageArtifact(rawArtifact) {
    const pages = {};
    // Match code blocks with filename labels: ```filename.ext ... ```
    const fileBlockRegex = /```(\S+\.(?:html|css|js))\s*\n([\s\S]*?)```/gi;
    let match;
    while ((match = fileBlockRegex.exec(rawArtifact)) !== null) {
        const filename = match[1].trim();
        const content = match[2].trim();
        if (content.length > 50) { // Only keep substantial content
            pages[filename] = content;
        }
    }
    // If no filename-tagged blocks found, check for <!DOCTYPE markers
    if (Object.keys(pages).length === 0) {
        // Try to find raw HTML — treat entire artifact as index.html
        const htmlMatch = rawArtifact.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
        if (htmlMatch) {
            pages['index.html'] = htmlMatch[0];
        }
    }
    return pages;
}



class SupervisorAgent {
    constructor() {
        this.maxRetries = RSI_LIMITS.maxRetriesPerTask;
        // Log the full model routing table on first instantiation
        logModelRouting();
    }

    async execute(goal) {
        console.log(`\n--- Velocity Swarm Initiated: '${goal}' ---`);

        // INITIAL CLIENT BRIEFING
        const briefing = await LiaisonAgent.think([
            { role: "user", content: `Explain to the client that we are initiating a "Tier 1" elite build for: "${goal}". Mention that we are mobilizing a specialized swarm of agents and the first step is the Blueprinting phase.` }
        ]);
        console.log(`\n[Client Liaison]: ${briefing.message.content}\n`);


        const constitutionJson = await fs.readJson(CONSTITUTION_PATH_JSON).catch(() => ({ patterns: [], rules: [] }));
        const coreRules = constitutionJson.rules.join('\n');

        // 1. ARCHITECT PHASE (Avon)
        console.log("Supervisor: 🚀 Architect (Avon) is processing plan...");
        const archResponse = await ArchitectAgent.think([
            { role: "system", content: `[PROJECT CONSTITUTION]:\n${coreRules}` },
            { role: "user", content: goal }
        ], "architect");

        let taskGraph;
        try {
            const jsonStr = archResponse.message.content.match(/\{[\s\S]*\}/)[0];
            taskGraph = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Supervisor: Failed to parse task graph. Falling back to linear mode.");
            taskGraph = {
                tasks: [
                    { id: "logic_task", type: "logic", description: `Logic for ${goal}`, dependencies: [] },
                    { id: "ui_task", type: "techlead", description: `UI for ${goal}`, dependencies: [] }
                ]
            };
        }

        // CLIENT APPROVAL GATE: The Blueprint
        const planExplanation = await LiaisonAgent.think([
            { role: "user", content: `Translate this technical architecture plan into a professional client-friendly summary. Focus on the 5-page scope, the Brand DNA, and the "Signature Complexity" feature. Here is the plan: ${JSON.stringify(taskGraph)}` }
        ]);
        
        const decision = await getClientApproval(planExplanation.message.content);
        
        if (decision === 'no') {
            return { status: "cancelled", reason: "Client declined the blueprint." };
        } else if (decision === 'refine') {
            const refinement = prompt("What would you like to refine? ");
            return this.execute(`${goal} (REFINEMENT: ${refinement})`);
        }

        console.log("\n[Client Liaison]: Excellent choice. I'm now mobilizing the engineering teams to begin construction.");

        // 2. PARALLEL EXECUTION (The Swarm)
        const swarmUpdate = await LiaisonAgent.think([
            { role: "user", content: "Explain that the specialized engineering swarm is now working in parallel on the different components of the project (Logic, UI, and Systems)." }
        ]);
        console.log(`\n[Client Liaison]: ${swarmUpdate.message.content}\n`);

        console.log("Supervisor: Starting Swarm Execution (Logic Engine & Tech Lead)...");

        const results = {};
        const completedTasks = new Set();

        async function runTask(task) {
            // Wait for dependencies
            for (const depId of task.dependencies) {
                while (!completedTasks.has(depId)) {
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            const profileMap = {
                'logic': { role: 'Logic Engine', profile: 'logic', agent: BuilderAgent },
                'techlead': { role: 'Tech Lead', profile: 'techlead', agent: BuilderAgent },
                'synthesis': { role: 'Master Synthesizer', profile: 'builder', agent: BuilderAgent },
                'guardian': { role: 'Guardian', profile: 'guardian', agent: BuilderAgent },
                'avon_bot': { role: 'Avon Scaffold', profile: 'avon_bot', agent: AvonBotAgent },
                'designer': { role: 'Designer', profile: 'designer', agent: BuilderAgent },
                'researcher': { role: 'Researcher', profile: 'researcher', agent: BuilderAgent }
            };

            const taskConfig = profileMap[task.type] || { role: 'Generalist', profile: 'standard', agent: BuilderAgent };
            const agentRole = taskConfig.role;
            const profile = taskConfig.profile;
            const TargetAgent = taskConfig.agent;

            const templateContext = taskGraph.template && taskGraph.template !== "NONE" && TEMPLATES[taskGraph.template] 
                ? `\n[SELECTED TEMPLATE STRUCTURE]: Please follow this structure strictly:\n${JSON.stringify(TEMPLATES[taskGraph.template])}`
                : `\n[BUILD FROM SCRATCH]: No predefined template used. Follow the architecture plan strictly.`;

            const brandContext = taskGraph.brand_dna ? `\n[BRAND DNA]: ${JSON.stringify(taskGraph.brand_dna)}` : "";
            const architectureContext = taskGraph.architecture ? `\n[ARCHITECT PLAN]: ${JSON.stringify(taskGraph.architecture)}` : "";

            console.log(`Supervisor: 🚀 ${agentRole} is processing ${task.id}...`);
            
            // CONTEXT SCOPING: Only pass results from declared dependencies
            const contextFromPrev = (task.dependencies || [])
                .map(depId => {
                    const result = results[depId];
                    if (!result) return `[${depId}]: (No data - dependency might have failed or been skipped)`;
                    return `[${depId}]:\n${result}`;
                })
                .join('\n\n---\n\n');

            const res = await TargetAgent.think([
                { role: "system", content: `${coreRules}${templateContext}${brandContext}${architectureContext}` },
                { role: "user", content: `Overall Goal: ${goal}\nSub-task: ${task.id}: ${task.description}\n\nContext From Previous Dependencies:\n${contextFromPrev || "None"}` }
            ], profile);


            results[task.id] = res.message.content;
            completedTasks.add(task.id);
            console.log(`Supervisor: ✅ ${agentRole} task [${task.id}] Completed.`);
        }

        // Spawn all tasks; runTask handles synchronization
        await Promise.all(taskGraph.tasks.map(runTask));
        console.log("Supervisor: Swarm Synthesis Complete.");

        // 3. PAGE COLLECTION (Incremental Strategy)
        // We no longer rely on a single synthesis task. We collect all pages generated in parallel.
        const pages = {};
        
        // Match results that look like standalone pages or components
        for (const [taskId, content] of Object.entries(results)) {
            // Find which page this task targets (e.g. task_home -> index.html)
            const pageMatch = (taskGraph.pages || []).find(p => taskId.includes(p.replace('.html', '')));
            if (pageMatch) {
                pages[pageMatch] = content;
            } else {
                // Also check for code blocks with filenames within generic tasks
                const extracted = parseMultiPageArtifact(content);
                Object.assign(pages, extracted);
            }
        }

        // If no pages were explicitly matched, fallback to parse the last task
        if (Object.keys(pages).length === 0) {
            const lastTask = taskGraph.tasks[taskGraph.tasks.length - 1];
            Object.assign(pages, parseMultiPageArtifact(results[lastTask.id]));
        }

        let artifact = Object.entries(pages).map(([f, c]) => `FILE: ${f}\n${c}`).join('\n\n---\n\n');

        let attempts = 0;
        let distilledWisdom = "";

        // 3. Build Loop (Hardening & Self-Healing)
        while (attempts < this.maxRetries) {
            console.log(`\n--- Attempt ${attempts + 1}/${this.maxRetries} ---`);

            // 4. Automated "Vibe Testing" (Pillar 5)
            console.log("Supervisor: Running Automated Build Verification...");
            const buildCheck = await VerifyAgent.checkBuild("avon-dashboard");
            const vibeCheck = await VerifyAgent.checkVibe(artifact, constitutionJson.rules);

            if (!buildCheck.success || !vibeCheck.success) {
                console.warn("Supervisor: Verification FAILED. Initiating Self-Healing...");
                const errorContext = [
                    !buildCheck.success ? `Build Logs:\n${buildCheck.logs}` : "",
                    !vibeCheck.success ? `Constitution Violations:\n${vibeCheck.violations.join('\n')}` : ""
                ].filter(Boolean).join('\n\n');

                const healRes = await ReflectionAgent.think([
                    { role: "system", content: coreRules },
                    { role: "user", content: `Code Verification Failed.\n\n${errorContext}\n\nExisting Artifact:\n${artifact}\n\nFIX the code now to meet build and constitution standards.` }
                ]);
                artifact = healRes.message.content;
                console.log("Supervisor: Self-Healing Patch Applied.");
            } else {
                console.log("Supervisor: Verification PASSED (Build & Vibe).");
            }

            // 4b. Per-Page Guardian (Visual Hardening Pass)
            console.log("Supervisor: 🛡️ Guardian is hardening visual fidelity (Incremental)...");
            
            for (const [filename, content] of Object.entries(pages)) {
                console.log(`Supervisor: 🛡️ Hardening ${filename}...`);
                const guardRes = await GuardianAgent.think([
                    { role: "system", content: coreRules },
                    { role: "user", content: `Harden and polish this specific page for the Velocity brand:\nFILE: ${filename}\nCONTENT:\n${content}` }
                ]);
                pages[filename] = guardRes.message.content;
            }
            
            artifact = Object.entries(pages).map(([f, c]) => `FILE: ${f}\n${c}`).join('\n\n---\n\n');
            
            const polishUpdate = await LiaisonAgent.think([
                { role: "user", content: "Explain that the 'Visual Guardian' has just finished custom-polishing all the pages to ensure they meet the modern 'Velocity' brand standards (glassmorphism, responsiveness, and premium aesthetics)." }
            ]);
            console.log(`\n[Client Liaison]: ${polishUpdate.message.content}\n`);

            console.log("Supervisor: Visual Hardening Complete for all pages.");


            // 5. Reviewer (Human-like Quality Check)
            // 4b. Ensemble Review Gate — reviewer (CodeGemma) + security (CodeGemma) vote
            // Replace single-model reviewer with multi-model consensus for critical decisions
            console.log("Supervisor: 🗳️  Running Ensemble Review Gate (Reviewer + Security)...");
            const ensembleResult = await runReviewEnsemble({ artifact, rules: coreRules });
            const review = ensembleResult.consensus; // 'PASS' or 'FAIL'
            console.log(`Supervisor: Ensemble voted: ${review} (${ensembleResult.passes} PASS / ${ensembleResult.fails} FAIL)`);

            if (review === "PASS" || ensembleResult.passed) {
                console.log("Supervisor: Review PASSED. Workflow Complete.");

                // Active Memory Loop (Constitution Pillar)
                console.log("Supervisor: Syncing Project Constitution (Learning Loop)...");
                // Distillation via LLaMA 3.2 — fast extraction of styling rules
                const learningRes = await DistillationAgent.think([
                    { role: "user", content: `Review this success and extract 1-2 styling rules that should be permanent standards. Code:\n${artifact}` }
                ], 'distiller');

                // Update both JSON and MD
                constitutionJson.patterns.push({
                    timestamp: new Date().toISOString(),
                    summary: learningRes.message.content
                });
                await fs.writeJson(CONSTITUTION_PATH_JSON, constitutionJson, { spaces: 4 });
                await fs.appendFile(CONSTITUTION_PATH_MD, `\n- ${learningRes.message.content}\n`);

                return { status: "success", artifact, pages: parseMultiPageArtifact(artifact), plan: JSON.stringify(taskGraph) };
            }



            console.warn("Supervisor: Review FAILED.");

            // 6. Reflection — LLaMA 3 reasons about what went wrong
            console.log("Supervisor: Reflecting on failure (LLaMA 3)...");
            const reflectionRes = await ReflectionAgent.think([
                { role: "system", content: coreRules },
                { role: "user", content: `Code:\n${artifact}\n\nReview Issues:\n${review}\n\nEnsemble votes:\nReviewer=${ensembleResult.votes.find(v => v.profile === 'reviewer')?.content?.slice(0, 300)}\nSecurity=${ensembleResult.votes.find(v => v.profile === 'security')?.content?.slice(0, 300)}` }
            ], 'reflection');


            let reflection;
            try {
                // Attempt to parse JSON response from Reflection Agent
                const jsonMatch = reflectionRes.message.content.match(/\{[\s\S]*\}/);
                reflection = jsonMatch ? JSON.parse(jsonMatch[0]) : { shouldResearch: false, reason: "Parse Error" };
            } catch (e) {
                console.error("Supervisor: Failed to parse reflection JSON.", e);
                reflection = { shouldResearch: false };
            }

            if (!reflection.shouldResearch) {
                console.log(`Supervisor: No research needed. Reason: ${reflection.reason}`);
            } else {
                // 4. Web Search
                console.log(`Supervisor: Researching queries: ${reflection.searchQueries.join(", ")}`);
                let searchResults = [];
                for (const query of reflection.searchQueries.slice(0, RSI_LIMITS.maxWebSearches)) {
                    const results = await webSearch(query);
                    searchResults.push(...results.map(r => `Source: ${r.url}\nWait: ${r.snippet}`));
                }
                const rawKnowledge = searchResults.join("\n\n");

                // 5. Distillation
                console.log("Supervisor: Distilling knowledge...");
                const distillRes = await DistillationAgent.think([
                    { role: "user", content: `Original Error:\n${review}\n\nfound Research:\n${rawKnowledge}` }
                ]);
                const newLesson = distillRes.message.content;

                // 6. Memory Update
                console.log("Supervisor: Updating Memory...");
                await fs.appendFile(HEURISTICS_PATH, `\n\n## Learned ${new Date().toISOString()}\n${newLesson}`);

                // 7. Policy/Context Update for next loop
                distilledWisdom += `\n${newLesson}`;
            }

            attempts++;
        }

        console.error("Supervisor: Max retries exceeded. Task Failed.");
        return { status: "failed", error: "Max retries exceeded", lastArtifact: artifact };
    }
}

export const Supervisor = new SupervisorAgent();
