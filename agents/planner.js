import { BaseAgent } from "./baseAgent.js";

export const PlannerAgent = new BaseAgent({
  name: "planner",
  profile: "planner",
  system: `
You are a planning agent.
Decompose the user's goal into ordered, minimal, actionable steps.
...
`
});
