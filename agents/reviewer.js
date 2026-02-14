import { BaseAgent } from "./baseAgent.js";

export const ReviewerAgent = new BaseAgent({
    name: "reviewer",
    model: "Avon:latest",
    system: `
You are a code reviewer agent.
Review the provided code for logic errors, security vulnerabilities, and adherence to the plan.
If the code is good, output "PASS".
If the code has issues, output "FAIL" followed by a list of specific issues to fix.
`
});
