/**
 * ============================================================
 *  kernel/modelRouter.js  — Velocity Intelligent Model Router
 *
 *  Features:
 *  - Routes each role to its specialist model
 *  - Ensemble consensus for critical code review decisions
 *  - Automatic retry with fallback model on timeout/error
 *  - Streams support preserved
 * ============================================================
 */

import { runOllama } from "../providers/ollama.js";
import { runOpenAI } from "../providers/openai.js";
import { MODEL_PROFILES } from "./config.js";

const providers = {
    ollama: runOllama,
    openai: runOpenAI,
};

// Fallback chain: if primary model errors, try these in order
const FALLBACK_CHAIN = [
    'llama3:8b',
    'llama3.2:latest',
    'Avon:latest'
];

/**
 * Core model runner — routes profile → specialist model
 */
export async function runModel({
    profile = "standard",
    provider,
    model: customModel,
    messages,
    system,
    stream = false,
    timeoutMs = 300_000
}) {
    const config = MODEL_PROFILES[profile] || MODEL_PROFILES.standard;

    // Priority: Explicit arg > Env override (already in config) > Profile default
    const finalProvider = provider || config.provider;
    const finalModel = (customModel && customModel !== 'Avon:latest')
        ? customModel
        : config.model;

    console.log(`[Router] ${profile.padEnd(12)} → ${finalModel} (${finalProvider})`);

    const runner = providers[finalProvider];
    if (!runner) throw new Error(`Unknown provider: ${finalProvider}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await runner({ model: finalModel, messages, system, stream, signal: controller.signal });
    } catch (err) {
        // If this was already a fallback or explicit model request, don't retry
        if (customModel || err.message === 'Request timed out') throw err;

        // Attempt fallback chain
        for (const fallbackModel of FALLBACK_CHAIN) {
            if (fallbackModel === finalModel) continue; // skip if same
            console.warn(`[Router] ⚡ Primary ${finalModel} failed. Falling back to ${fallbackModel}...`);
            try {
                const fController = new AbortController();
                const fTimeout = setTimeout(() => fController.abort(), timeoutMs);
                const result = await runner({
                    model: fallbackModel, messages, system, stream,
                    signal: fController.signal
                });
                clearTimeout(fTimeout);
                console.log(`[Router] ✅ Fallback ${fallbackModel} succeeded.`);
                return result;
            } catch { /* try next fallback */ }
        }
        throw err; // all fallbacks exhausted
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Ensemble runner — queries multiple models and returns majority consensus.
 * Used for critical code review (PASS/FAIL) decisions.
 *
 * @param {string[]} profiles - Array of profiles to query (e.g. ['reviewer', 'security', 'guardian'])
 * @param {Array}    messages - Messages to send to each model
 * @param {string}   [system] - Optional system prompt
 * @returns {{ consensus: string, votes: object[], passed: boolean }}
 */
export async function runEnsemble({ profiles, messages, system }) {
    console.log(`[Router] 🗳️  Ensemble vote: [${profiles.join(', ')}]`);

    const votes = await Promise.allSettled(
        profiles.map(profile => runModel({ profile, messages, system }))
    );

    const results = votes.map((v, i) => ({
        profile: profiles[i],
        model: MODEL_PROFILES[profiles[i]]?.model ?? 'unknown',
        status: v.status,
        content: v.status === 'fulfilled' ? (v.value.message?.content ?? '') : null,
        error: v.status === 'rejected' ? v.reason?.message : null
    }));

    // Tally PASS/FAIL votes from fulfilled responses
    let passes = 0, fails = 0;
    results.forEach(r => {
        if (!r.content) return;
        if (/\bPASS\b/i.test(r.content)) passes++;
        else if (/\bFAIL\b/i.test(r.content)) fails++;
    });

    const total = passes + fails;
    const passed = total > 0 && passes > fails; // simple majority
    const consensus = passed ? 'PASS' : 'FAIL';

    console.log(`[Router] 🗳️  Ensemble result: ${consensus} (${passes} PASS / ${fails} FAIL / ${results.filter(r => !r.content).length} no-vote)`);

    return { consensus, passed, passes, fails, votes: results };
}

/**
 * Convenience: run a single-step review through the full reviewer+security ensemble.
 * This replaces the old single-reviewer check in supervisor.js for critical gates.
 */
export async function runReviewEnsemble({ artifact, rules }) {
    return runEnsemble({
        profiles: ['reviewer', 'security'],
        messages: [{
            role: 'user',
            content: `Review this code for correctness, security, and adherence to the Velocity constitution:\n${artifact}`
        }],
        system: rules ? `[PROJECT CONSTITUTION]:\n${rules}` : undefined
    });
}
