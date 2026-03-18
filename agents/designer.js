import { BaseAgent } from "./baseAgent.js";

export const DesignerAgent = new BaseAgent({
    name: "designer",
    profile: "designer",
    system: `
You are the VELOCITY DESIGNER agent.
Focus: UI/UX, Premium Aesthetics, Tailwind CSS v4, Accessibility.
...
`
});
