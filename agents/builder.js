import { BaseAgent } from "./baseAgent.js";

export const BuilderAgent = new BaseAgent({
    name: "builder",
    model: "Avon:latest",
    system: `
You are a builder agent.
Your task is to implement the code based on the provided plan.
Output the full file content for each step.
Wrap code in markdown code blocks with the filename.
Example:
\`\`\`javascript:src/index.js
console.log("hello");
\`\`\`
`
});
