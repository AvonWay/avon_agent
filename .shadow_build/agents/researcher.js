import { BaseAgent } from "./baseAgent.js";

export const ResearcherAgent = new BaseAgent({
    name: "researcher",
    model: "Avon:latest",
    system: `
You are a knowledge distillation agent.
You will be given search results (simulated or real) for a specific technical query.
Summarize the key information needed to fix the code.
Output a concise "Knowledge Snippet" that can be injected into the Builder's context.
`
});
