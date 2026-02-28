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

import { RSI_LIMITS } from "../kernel/config.js";

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const HEURISTICS_PATH = path.join(PROJECT_ROOT, "memory/heuristics.md");
const CONSTITUTION_PATH_MD = path.join(PROJECT_ROOT, "PROJECT_CONSTITUTION.md");
const CONSTITUTION_PATH_JSON = path.join(PROJECT_ROOT, ".velocity_constitution.json");



export class SupervisorAgent {
    constructor() {
        this.maxRetries = RSI_LIMITS.maxRetriesPerTask;
        // Log the full model routing table on first instantiation
        logModelRouting();
    }

    async execute(goal) {
        console.log(`\n--- Velocity Swarm Initiated: '${goal}' ---`);

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

        // 2. PARALLEL EXECUTION (The Swarm)
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
                // DeepSeek Coder handles all code synthesis
                'logic': { role: 'Logic Engine', profile: 'logic', agent: BuilderAgent },
                'techlead': { role: 'Tech Lead (DeepSeek)', profile: 'techlead', agent: BuilderAgent },
                'guardian': { role: 'Guardian (CodeGemma)', profile: 'guardian', agent: BuilderAgent },
                'avon_bot': { role: 'Avon Scaffold', profile: 'avon_bot', agent: AvonBotAgent }
            };

            const taskConfig = profileMap[task.type] || { role: 'Generalist', profile: 'standard', agent: BuilderAgent };
            const agentRole = taskConfig.role;
            const profile = taskConfig.profile;
            const TargetAgent = taskConfig.agent;

            const brandContext = taskGraph.brand_dna ? `\n[BRAND DNA]: ${JSON.stringify(taskGraph.brand_dna)}` : "";
            const blueprintContext = taskGraph.blueprint ? `\n[ARCHITECT BLUEPRINT]: ${JSON.stringify(taskGraph.blueprint)}` : "";

            console.log(`Supervisor: 🚀 ${agentRole} is processing ${task.id}...`);
            const res = await TargetAgent.think([
                { role: "system", content: `${coreRules}${brandContext}${blueprintContext}` },
                { role: "user", content: `Overall Goal: ${goal}\nSub-task: ${task.description}\nContext From Previous Tasks:\n${Object.entries(results).map(([id, val]) => `[${id}]: ${val.substring(0, 300)}...`).join('\n')}` }
            ], profile);

            results[task.id] = res.message.content;
            completedTasks.add(task.id);
            console.log(`Supervisor: ✅ ${agentRole} task [${task.id}] Completed.`);
        }

        // Spawn all tasks; runTask handles synchronization
        await Promise.all(taskGraph.tasks.map(runTask));
        console.log("Supervisor: Swarm Synthesis Complete.");

        // Merge results (Gather Strategy)
        let artifact = Object.values(results).join("\n\n");

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

            // 4b. Guardian (Visual Hardening Pass)
            console.log("Supervisor: 🛡️ Guardian is hardening visual fidelity...");
            const guardRes = await GuardianAgent.think([
                { role: "system", content: coreRules },
                { role: "user", content: `Harden and polish this artifact for the Velocity brand:\n${artifact}` }
            ]);
            artifact = guardRes.message.content;
            console.log("Supervisor: Visual Hardening Complete.");

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

                return { status: "success", artifact, plan: JSON.stringify(taskGraph) };
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
