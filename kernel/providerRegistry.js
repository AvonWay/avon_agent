/**
 * ============================================================
 *  kernel/providerRegistry.js — Dynamic Provider Registry
 *
 *  Runtime provider management for the BYOE architecture.
 *  Handles:
 *  - Provider registration & removal
 *  - Health checks & connectivity probing
 *  - User-scoped engine preferences
 *  - Custom endpoint support (BYO URLs)
 * ============================================================
 */

import { runOllama } from '../providers/ollama.js';
import { runOpenAI } from '../providers/openai.js';
import { runGemini } from '../providers/gemini.js';
import { runAnthropic } from '../providers/anthropic.js';

/**
 * Provider metadata schema
 * @typedef {Object} ProviderEntry
 * @property {string} id - Unique provider identifier
 * @property {string} type - 'local' | 'frontier' | 'custom'
 * @property {string} name - Human-readable name
 * @property {Function} runner - The execution function
 * @property {string} [endpoint] - API endpoint URL
 * @property {string[]} [models] - Available models
 * @property {string} status - 'online' | 'offline' | 'unknown'
 * @property {number} [contextWindow] - Default context window size
 * @property {Object} [capabilities] - Feature flags
 */

class ProviderRegistry {
    constructor() {
        /** @type {Map<string, ProviderEntry>} */
        this.providers = new Map();

        /** @type {Map<string, Object>} User preferences keyed by session/user ID */
        this.userPreferences = new Map();

        // Register built-in providers
        this._registerBuiltins();
    }

    /**
     * Register the built-in providers (Ollama, OpenAI, Gemini, Anthropic)
     */
    _registerBuiltins() {
        // ── Local: Ollama ──
        this.register({
            id: 'ollama',
            type: 'local',
            name: 'Ollama (Local)',
            runner: runOllama,
            endpoint: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
            models: [],
            status: 'unknown',
            contextWindow: 8_000,
            capabilities: {
                streaming: true,
                functionCalling: false,
                vision: false,
                costPerToken: 0
            }
        });

        // ── Frontier: OpenAI ──
        if (process.env.OPENAI_API_KEY) {
            this.register({
                id: 'openai',
                type: 'frontier',
                name: 'OpenAI',
                runner: runOpenAI,
                endpoint: 'https://api.openai.com/v1',
                models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview', 'o1-mini'],
                status: 'online',
                contextWindow: 128_000,
                capabilities: {
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    costPerToken: 0.00001  // approximate $/token
                }
            });
        }

        // ── Frontier: Gemini ──
        if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
            this.register({
                id: 'gemini',
                type: 'frontier',
                name: 'Google Gemini',
                runner: runGemini,
                endpoint: 'https://generativelanguage.googleapis.com/v1beta',
                models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
                status: 'online',
                contextWindow: 1_000_000,
                capabilities: {
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    costPerToken: 0.000003
                }
            });
        }

        // ── Frontier: Anthropic ──
        if (process.env.ANTHROPIC_API_KEY) {
            this.register({
                id: 'anthropic',
                type: 'frontier',
                name: 'Anthropic (Claude)',
                runner: runAnthropic,
                endpoint: 'https://api.anthropic.com/v1',
                models: ['claude-4-opus', 'claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
                status: 'online',
                contextWindow: 200_000,
                capabilities: {
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    costPerToken: 0.000008
                }
            });
        }
    }

    /**
     * Register a new provider
     */
    register(entry) {
        if (!entry.id || !entry.runner) {
            throw new Error('Provider must have an id and a runner function');
        }
        this.providers.set(entry.id, {
            status: 'unknown',
            models: [],
            capabilities: {},
            ...entry
        });
        console.log(`[Registry] ✅ Registered provider: ${entry.name} (${entry.id})`);
    }

    /**
     * Remove a provider
     */
    unregister(providerId) {
        if (this.providers.has(providerId)) {
            const name = this.providers.get(providerId).name;
            this.providers.delete(providerId);
            console.log(`[Registry] ❌ Unregistered provider: ${name}`);
            return true;
        }
        return false;
    }

    /**
     * Register a custom OpenAI-compatible endpoint (e.g., LM Studio, Oobabooga, vLLM)
     */
    registerCustomEndpoint({ id, name, endpoint, models = [], apiKey }) {
        // Custom endpoints use the OpenAI-compatible format
        const runner = async ({ model, messages, system, stream, signal }) => {
            const headers = { 'Content-Type': 'application/json' };
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

            if (system) {
                messages = [{ role: 'system', content: system }, ...messages];
            }

            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${endpoint}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ model, messages, stream: !!stream }),
                signal
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                throw new Error(`Custom endpoint error: ${errBody.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return {
                message: data.choices[0].message,
                raw: data
            };
        };

        this.register({
            id: id || `custom_${Date.now()}`,
            type: 'custom',
            name: name || `Custom (${endpoint})`,
            runner,
            endpoint,
            models,
            status: 'unknown',
            contextWindow: 8_000,
            capabilities: {
                streaming: true,
                functionCalling: false,
                vision: false,
                costPerToken: 0
            }
        });
    }

    /**
     * Get a provider by ID
     */
    get(providerId) {
        return this.providers.get(providerId);
    }

    /**
     * Get the runner function for a provider
     */
    getRunner(providerId) {
        const provider = this.providers.get(providerId);
        if (!provider) throw new Error(`Unknown provider: ${providerId}`);
        return provider.runner;
    }

    /**
     * List all registered providers
     */
    list() {
        return Array.from(this.providers.values()).map(p => ({
            id: p.id,
            type: p.type,
            name: p.name,
            endpoint: p.endpoint,
            models: p.models,
            status: p.status,
            contextWindow: p.contextWindow,
            capabilities: p.capabilities
        }));
    }

    /**
     * Probe Ollama for available local models
     */
    async probeOllama() {
        const ollama = this.providers.get('ollama');
        if (!ollama) return { status: 'not_registered', models: [] };

        try {
            const fetch = (await import('node-fetch')).default;
            const endpoint = ollama.endpoint || 'http://127.0.0.1:11434';
            const res = await fetch(`${endpoint}/api/tags`, { 
                signal: AbortSignal.timeout(5000) 
            });

            if (!res.ok) {
                ollama.status = 'offline';
                return { status: 'offline', models: [] };
            }

            const data = await res.json();
            const models = (data.models || []).map(m => ({
                name: m.name,
                size: m.size,
                modified: m.modified_at,
                digest: m.digest?.slice(0, 12)
            }));

            ollama.models = models.map(m => m.name);
            ollama.status = 'online';

            console.log(`[Registry] 🔍 Ollama probe: ${models.length} model(s) found`);
            return { status: 'online', models, endpoint };
        } catch (err) {
            ollama.status = 'offline';
            console.log(`[Registry] 🔍 Ollama probe: OFFLINE (${err.message})`);
            return { status: 'offline', models: [], error: err.message };
        }
    }

    /**
     * Full health check across all providers
     */
    async healthCheck() {
        const results = {};

        // Check Ollama
        const ollamaResult = await this.probeOllama();
        results.ollama = ollamaResult;

        // Check frontier providers (simple API key presence check)
        for (const [id, provider] of this.providers) {
            if (id === 'ollama') continue;
            results[id] = {
                status: provider.status,
                models: provider.models,
                type: provider.type
            };
        }

        return results;
    }

    /**
     * Save user engine preferences
     */
    setUserPreferences(userId, prefs) {
        this.userPreferences.set(userId, {
            ...this.userPreferences.get(userId),
            ...prefs,
            updatedAt: new Date().toISOString()
        });
    }

    /**
     * Get user engine preferences
     */
    getUserPreferences(userId) {
        return this.userPreferences.get(userId) || {
            defaultProvider: null,
            defaultModel: null,
            taskRouting: {},
            localEndpoint: null
        };
    }
}

// ─── Singleton Registry ──────────────────────────────────────
export const registry = new ProviderRegistry();

export default ProviderRegistry;
