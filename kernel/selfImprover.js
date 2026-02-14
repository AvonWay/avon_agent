export class SelfImprover {
    constructor({ memory, search, reviewer }) {
        this.memory = memory;
        this.search = search;
        this.reviewer = reviewer;
    }

    async improve({ task, attempt, result, errors }) {
        const reflection = await this.reviewer.reflect({
            task,
            attempt,
            result,
            errors
        });

        if (!reflection.shouldResearch) return null;

        const findings = await this.search.query(
            reflection.searchQueries
        );

        const distilled = await this.reviewer.distill({
            reflection,
            findings
        });

        await this.memory.store(distilled);

        return distilled;
    }
}
