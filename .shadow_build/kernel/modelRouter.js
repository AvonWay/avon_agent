/**
 * ============================================================
 *  kernel/modelRouter.js  — Velocity Intelligent Model Router
 *
 *  BYOE (Bring Your Own Engine) Architecture
 *
 *  Features:
 *  - Routes each role to its specialist model via ProviderRegistry
 *  - Session-aware context compression for mid-session switches
 *  - JIT format adaptation per provider
 *  - Ensemble consensus for critical code review decisions
 *  - Automatic retry with fallback model on timeout/error
 *  - Streams support preserved
 * ============================================================
 */

import { registry } from "./providerRegistry.js";
import { compressor, FormatAdapter, getSession } from "./stateManager.js";
import { MODEL_PROFILES } from "./config.js";

// Fallback chain: if primary model errors, try Avon_Agent (sole local model)
const FALLBACK_CHAIN = [
    'Avon_Agent'
];

/**
 * Core model runner — routes profile → specialist model
 * 
 * Now uses the ProviderRegistry for dynamic provider resolution
 * and the StateManager for context-aware session handling.
 */
export async function runModel({
    profile = "standard",
    provider,
    model: customModel,
    messages,
    system,
    stream = false,
    timeoutMs = 1_200_000,
    sessionId = null   // NEW: optional session for state tracking
}) {
    const config = MODEL_PROFILES[profile] || MODEL_PROFILES.standard;

    // Priority: Explicit arg > Env override (already in config) > Profile default
    const finalProvider = provider || config.provider;
    const finalModel = (customModel && customModel !== 'Avon_Agent')
        ? customModel
        : config.model;

    console.log(`[Router] ${profile.padEnd(12)} → ${finalModel} (${finalProvider})`);

    // ── Resolve runner from registry (with fallback to legacy map) ──
    let runner;
    const registeredProvider = registry.get(finalProvider);
    if (registeredProvider) {
        runner = registeredProvider.runner;
    } else {
        // Legacy fallback for unregistered providers
        const legacyProviders = {
            ollama: (await import('../providers/ollama.js')).runOllama,
            openai: (await import('../providers/openai.js')).runOpenAI,
            gemini: (await import('../providers/gemini.js')).runGemini,
            anthropic: (await import('../providers/anthropic.js')).runAnthropic,
        };
        runner = legacyProviders[finalProvider];
    }

    if (!runner) throw new Error(`Unknown provider: ${finalProvider}`);

    // ── Session-aware context compression ──
    let finalMessages = messages;
    let finalSystem = system;

    if (sessionId) {
        const session = getSession(sessionId);

        // If the engine changed, compress context for the new model
        if (session.activeModel && session.activeModel !== finalModel) {
            const compressed = compressor.compress(session, finalModel, system);
            if (compressed.compressed) {
                finalMessages = compressed.messages;
                console.log(`[Router] 📦 Context compressed for ${finalModel} (${compressed.messages.length} msgs)`);
            }
        }

        // Update session engine tracking
        session.setEngine(finalProvider, finalModel);

        // Apply JIT format adaptation
        const adapted = FormatAdapter.adapt(finalMessages, finalProvider, finalSystem);
        finalMessages = adapted.messages;
        if (adapted.system) finalSystem = adapted.system;
    }

    // ── Execute with timeout ──
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const result = await runner({
            model: finalModel,
            messages: finalMessages,
            system: finalSystem,
            stream,
            signal: controller.signal
        });

        // Track in session if available
        if (sessionId) {
            const session = getSession(sessionId);
            const userMsg = messages[messages.length - 1];
            if (userMsg) session.addMessage(userMsg.role, userMsg.content);
            if (result.message?.content) {
                session.addMessage('assistant', result.message.content, {
                    model: finalModel,
                    provider: finalProvider
                });
            }
        }

        return result;
    } catch (err) {
        // If this was already a fallback or explicit model request, don't retry
        if (customModel || err.message === 'Request timed out') throw err;

        // Attempt fallback chain
        for (const fallbackModel of FALLBACK_CHAIN) {
            if (fallbackModel === finalModel) continue; 
            console.warn(`[Router] ⚡ Primary ${finalModel} failed (${err.message}). Falling back to local ${fallbackModel}...`);
            
            try {
                const fController = new AbortController();
                const fTimeout = setTimeout(() => fController.abort(), timeoutMs);
                
                // Get Ollama runner from registry
                const ollamaRunner = registry.get('ollama')?.runner;
                const fallbackRunner = ollamaRunner || (await import('../providers/ollama.js')).runOllama;

                const result = await fallbackRunner({
                    model: fallbackModel, 
                    messages: finalMessages || messages, 
                    system: finalSystem || system, 
                    stream,
                    signal: fController.signal
                });
                
                clearTimeout(fTimeout);
                console.log(`[Router] ✅ Fallback ${fallbackModel} succeeded.`);
                return result;
            } catch (fallbackErr) {
                console.error(`[Router] ❌ Fallback to ${fallbackModel} failed:`, fallbackErr.message);
                /* try next fallback if any */
            }
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
async function runEnsemble({ profiles, messages, system }) {
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
