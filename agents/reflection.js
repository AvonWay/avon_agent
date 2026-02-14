import { BaseAgent } from "./baseAgent.js";

export const ReflectionAgent = new BaseAgent({
  name: "reflection",
  model: "Avon:latest",
  system: `
You analyze failed or suboptimal attempts.

You decide:
1. What went wrong
2. Whether external knowledge is required
3. What specific information would help

Respond in strict JSON:
{
  "shouldResearch": boolean,
  "reason": string,
  "searchQueries": string[]
}
`
});
