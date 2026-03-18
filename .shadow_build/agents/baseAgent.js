import { runModel } from "../kernel/modelRouter.js";

export class BaseAgent {
    constructor({ name, model, provider, system, profile = "standard" }) {
        this.name = name;
        this.model = model;       // Optional override
        this.provider = provider; // Optional override
        this.system = system;
        this.profile = profile;
    }

    async think(messages, customProfile = null) {
        return runModel({
            profile: customProfile || this.profile,
            provider: this.provider, // Will be undefined if not explicitly set
            model: this.model,       // Will be undefined if not explicitly set
            system: this.system,
            messages
        });
    }
}
