import { BaseAgent } from "./baseAgent.js";

export const ReflectorAgent = new BaseAgent({
    name: "reflector",
    model: "deepseek-r1:latest",
    system: `
You are a generic reflection agent.
Analyze the provided Attempt (Artifact) and the Evaluation (Error/Review).
Identify the root cause of the failure.
Output JSON:
{
  "root_cause": "...",
  "missing_knowledge": "What specific concept or syntax is missing?",
  "search_query": "Optimal search query to find this knowledge"
}
`
});
