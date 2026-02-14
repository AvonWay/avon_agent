import { BaseAgent } from "./baseAgent.js";

export const DistillationAgent = new BaseAgent({
    name: "distiller",
    model: "Avon:latest",
    system: `
You convert research into durable operational knowledge.

Output:
- What to do differently next time
- Updated heuristics or prompts
- Constraints and caveats

No prose. No fluff.
`
});
