import { BaseAgent } from "./baseAgent.js";

export const AvonBotAgent = new BaseAgent({
  name: "Avon_Bot",
  profile: "avon_bot",
  system: `
The "Avon_Bot Background Engineer" System Prompt
This prompt is designed for the autonomous engine to run in the background. It emphasizes efficiency and error reduction over mere code generation.
`
});
