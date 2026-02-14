import fs from 'fs-extra';
import { PlannerAgent } from "./planner.js";
import { BuilderAgent } from "./builder.js";
import { ReviewerAgent } from "./reviewer.js";
import { ReflectionAgent } from "./reflection.js";
import { DistillationAgent } from "./distiller.js";
import { webSearch } from "../io/search.js";
import { RSI_LIMITS } from "../kernel/config.js";

const HEURISTICS_PATH = "memory/heuristics.md";

export class SupervisorAgent {
    constructor() {
        this.maxRetries = RSI_LIMITS.maxRetriesPerTask;
    }

    async execute(goal) {
        console.log("Supervisor: Starting workflow for goal:", goal);

        // 1. Planner
        console.log("Supervisor: Requesting Plan...");
        const planResponse = await PlannerAgent.think([
            { role: "user", content: goal }
        ]);
        const plan = planResponse.message.content;
        console.log("Supervisor: Plan received.");

        let artifact = null;
        let attempts = 0;

        // Heuristics context to inject
        let distilledWisdom = "";

        // 2. Build Loop
        while (attempts < this.maxRetries) {
            console.log(`\n--- Attempt ${attempts + 1}/${this.maxRetries} ---`);

            // Builder
            const builderContext = `
Goal: ${goal}
Plan:
${plan}

${distilledWisdom ? `[LEARNED DISTILLED KNOWLEDGE]:\n${distilledWisdom}\n` : ""}

Previous Artifact (if any):
${artifact || "None"}

Generate the code now.
`;
            const buildResponse = await BuilderAgent.think([
                { role: "user", content: builderContext }
            ]);
            artifact = buildResponse.message.content;
            console.log("Supervisor: Artifact built.");

            // Reviewer
            console.log("Supervisor: Requesting Review...");
            const reviewResponse = await ReviewerAgent.think([
                { role: "user", content: `Review this code for correctness and security:\n${artifact}` }
            ]);
            const review = reviewResponse.message.content;

            if (review.includes("PASS")) {
                console.log("Supervisor: Review PASSED. Workflow Complete.");
                return { status: "success", artifact, plan };
            }

            console.warn("Supervisor: Review FAILED.");

            // 3. Reflection
            console.log("Supervisor: Reflecting on failure...");
            const reflectionRes = await ReflectionAgent.think([
                { role: "user", content: `Code:\n${artifact}\n\nReview Issues:\n${review}` }
            ]);

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
