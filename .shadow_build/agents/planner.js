import { BaseAgent } from "./baseAgent.js";

// We don't construct the instance directly if we want to inherit, 
// but the user's code just instantiates BaseAgent directly.
// This is fine. The user provided:
// export const PlannerAgent = new BaseAgent({ ... })

export const PlannerAgent = new BaseAgent({
  name: "planner",
  model: "Avon:latest",
  system: `
You are a planning agent.
Decompose the user's goal into ordered, minimal, actionable steps.
Do not execute code. Do not write extensive code blocks.
Your output must be pure JSON with this structure:
{
  "steps": [
    "Step 1 description",
    "Step 2 description"
  ]
}
`
});
