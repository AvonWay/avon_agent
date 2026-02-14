export const AVAILABLE_MODELS = [
    {
        id: "avon",
        name: "Avon (Local)",
        provider: "ollama",
        model: "Avon:latest",
        locked: true
    }
];

export function getDefaultModel() {
    return AVAILABLE_MODELS[0];
}

export function resolveModel(requestedModel) {
    return {
        provider: "ollama",
        model: "Avon:latest"
    };
}
