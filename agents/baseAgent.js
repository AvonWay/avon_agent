import { runModel } from "../kernel/modelRouter.js";

export class BaseAgent {
    constructor({ name, model = "Avon:latest", provider = "ollama", system, profile = "standard" }) {
        this.name = name;
        this.model = model;
        this.provider = provider;
        this.system = system;
        this.profile = profile;
    }

    async think(messages, customProfile = null) {
        return runModel({
            provider: this.provider,
            model: this.model,
            profile: customProfile || this.profile,
            system: this.system,
            messages
        });
    }

}
