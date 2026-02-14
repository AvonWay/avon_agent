import { runModel } from "../kernel/modelRouter.js";

export class BaseAgent {
    constructor({ name, model = "Avon:latest", provider = "ollama", system }) {
        this.name = name;
        this.model = model;
        this.provider = provider;
        this.system = system;
    }

    async think(messages) {
        return runModel({
            provider: this.provider,
            model: this.model,
            system: this.system,
            messages
        });
    }
}
