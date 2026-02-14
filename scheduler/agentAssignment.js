import { PlannerAgent } from "../agents/planner.js";

const agents = {
    planner: PlannerAgent
};

export function assignAgent(taskType) {
    return agents[taskType] || null;
}
