/**
 * ============================================================
 *  kernel/stateManager.js — Velocity Universal State Manager
 *
 *  The "Single Source of Truth" for session state.
 *  Handles:
 *  - Abstract session state (blueprint, artifacts, event log)
 *  - Context compression for mid-session model switching
 *  - JIT format translation per-provider
 *  - Tiered context windowing (Recent + Archive)
 * ============================================================
 */

import { MODEL_PROFILES } from './config.js';

// ─── Context Window Sizes (approximate, conservative) ────────
const CONTEXT_LIMITS = {
    // Frontier models
    'gemini-2.5-pro':      1_000_000,
    'gemini-2.5-flash':    1_000_000,
    'gemini-1.5-pro':      2_000_000,
    'gemini-1.5-flash':    1_000_000,
    'gpt-4o':              128_000,
    'gpt-4o-mini':         128_000,
    'gpt-4-turbo':         128_000,
    'claude-3.5-sonnet':   200_000,
    'claude-3-opus':       200_000,
    'claude-4-opus':       200_000,
    // Local models (conservative defaults)
    'Avon_Agent':          8_000,
    'llama3':              8_000,
    'llama3:70b':          8_000,
    'llama3.1':            128_000,
    'deepseek-coder':      16_000,
    'deepseek-v3':         128_000,
    'mistral':             32_000,
    'codellama':           16_000,
    'codegemma':           8_000,
    'phi-4':               16_000,
    'qwen2.5-coder':       32_000,
};

const DEFAULT_CONTEXT_LIMIT = 8_000;

/**
 * SessionState — Abstracted, provider-agnostic session record
 */
export class SessionState {
    constructor(sessionId) {
        this.sessionId = sessionId || `session_${Date.now()}`;
        this.createdAt = new Date().toISOString();

        // ── The Universal State Record ──
        this.blueprint = '';            // The overarching goal/prompt
        this.artifacts = new Map();     // filename → current content
        this.eventLog = [];             // Structured action history
        this.messages = [];             // Raw message history (provider-agnostic format)

        // ── Engine Tracking ──
        this.activeProvider = null;     // Current provider name
        this.activeModel = null;        // Current model name
        this.switchHistory = [];        // Log of engine switches

        // ── Metrics ──
        this.totalTokensEstimate = 0;
        this.totalSwitches = 0;
    }

    /**
     * Record a message in provider-agnostic format
     */
    addMessage(role, content, metadata = {}) {
        const entry = {
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            role,       // 'system' | 'user' | 'assistant'
            content,
            timestamp: new Date().toISOString(),
            model: this.activeModel,
            provider: this.activeProvider,
            ...metadata
        };
        this.messages.push(entry);
        this.totalTokensEstimate += Math.ceil(content.length / 4); // rough estimate
        return entry;
    }

    /**
     * Record a structured action in the event log
     */
    logAction(action, details = {}) {
        const entry = {
            id: `evt_${Date.now()}`,
            action,     // e.g., 'READ_FILE', 'GENERATE_CODE', 'SWITCH_ENGINE'
            details,
            timestamp: new Date().toISOString(),
            model: this.activeModel,
            provider: this.activeProvider
        };
        this.eventLog.push(entry);
        return entry;
    }

    /**
     * Set the active engine (provider + model)
     */
    setEngine(provider, model) {
        const prev = { provider: this.activeProvider, model: this.activeModel };
        this.activeProvider = provider;
        this.activeModel = model;
        this.totalSwitches++;

        this.switchHistory.push({
            from: prev,
            to: { provider, model },
            timestamp: new Date().toISOString(),
            messageCount: this.messages.length
        });

        this.logAction('SWITCH_ENGINE', { from: prev, to: { provider, model } });
    }

    /**
     * Get the context limit for a given model
     */
    getContextLimit(model) {
        return CONTEXT_LIMITS[model] || DEFAULT_CONTEXT_LIMIT;
    }

    /**
     * Export the full state snapshot (for persistence/debugging)
     */
    toSnapshot() {
        return {
            sessionId: this.sessionId,
            createdAt: this.createdAt,
            blueprint: this.blueprint,
            artifacts: Object.fromEntries(this.artifacts),
            eventLog: this.eventLog,
            messageCount: this.messages.length,
            activeProvider: this.activeProvider,
            activeModel: this.activeModel,
            totalTokensEstimate: this.totalTokensEstimate,
            totalSwitches: this.totalSwitches,
            switchHistory: this.switchHistory
        };
    }
}

/**
 * ContextCompressor — Handles context window management during engine switches
 *
 * When switching from a large-context model (e.g., Gemini 2M tokens) to a
 * small-context local model (e.g., Llama 3 8K tokens), this compressor:
 * 1. Splits history into "Recent" (last N messages) and "Archive" (everything before)
 * 2. Summarizes the Archive into a dense system note
 * 3. Returns a context payload that fits within the target model's window
 */
export class ContextCompressor {
    constructor() {
        this.RECENT_MESSAGE_COUNT = 6;    // Keep last 6 messages verbatim
        this.CHARS_PER_TOKEN = 4;         // Conservative estimate
    }

    /**
     * Compress session messages for a target model's context window
     *
     * @param {SessionState} session - The current session state
     * @param {string} targetModel - The model we're switching TO
     * @param {string} [systemPrompt] - Optional system prompt to include
     * @returns {{ messages: Array, compressed: boolean, summary: string }}
     */
    compress(session, targetModel, systemPrompt) {
        const limit = session.getContextLimit(targetModel);
        const limitChars = limit * this.CHARS_PER_TOKEN;

        // Calculate current size
        let totalChars = (systemPrompt || '').length;
        for (const msg of session.messages) {
            totalChars += msg.content.length;
        }

        // If everything fits, return as-is
        if (totalChars <= limitChars * 0.85) {  // 85% threshold for safety
            return {
                messages: session.messages.map(m => ({ role: m.role, content: m.content })),
                compressed: false,
                summary: null
            };
        }

        // ── Split into Recent + Archive ──
        const recentCount = Math.min(this.RECENT_MESSAGE_COUNT, session.messages.length);
        const archiveMessages = session.messages.slice(0, -recentCount);
        const recentMessages = session.messages.slice(-recentCount);

        // ── Build Archive Summary ──
        const summary = this._buildArchiveSummary(session, archiveMessages);

        // ── Construct compressed payload ──
        const compressedMessages = [];

        // Inject archive summary as a system-level context note
        if (summary) {
            compressedMessages.push({
                role: 'system',
                content: `[CONTEXT HANDOFF — Prior Session Summary]\n${summary}\n[END SUMMARY — Continue from the recent messages below]`
            });
        }

        // Add recent messages verbatim
        for (const msg of recentMessages) {
            compressedMessages.push({ role: msg.role, content: msg.content });
        }

        // Final size check — if STILL too large, truncate recent messages
        let finalSize = compressedMessages.reduce((sum, m) => sum + m.content.length, 0);
        if (systemPrompt) finalSize += systemPrompt.length;

        if (finalSize > limitChars * 0.85) {
            // Truncate the oldest recent messages until we fit
            while (compressedMessages.length > 2 && finalSize > limitChars * 0.85) {
                const removed = compressedMessages.splice(1, 1)[0]; // Keep system, remove oldest user/assistant
                finalSize -= removed.content.length;
            }
        }

        console.log(`[StateManager] 📦 Context compressed: ${session.messages.length} msgs → ${compressedMessages.length} msgs (${Math.round(finalSize / 1000)}K chars for ${targetModel})`);

        return {
            messages: compressedMessages,
            compressed: true,
            summary
        };
    }

    /**
     * Build a dense summary of archived messages
     */
    _buildArchiveSummary(session, archiveMessages) {
        if (archiveMessages.length === 0) return null;

        const parts = [];

        // Blueprint context
        if (session.blueprint) {
            parts.push(`Goal: ${session.blueprint}`);
        }

        // Action summary from event log
        const relevantEvents = session.eventLog
            .filter(e => e.action !== 'SWITCH_ENGINE')
            .slice(-20) // Last 20 meaningful actions
            .map(e => `- [${e.action}] ${JSON.stringify(e.details).slice(0, 120)}`);

        if (relevantEvents.length > 0) {
            parts.push(`Actions taken:\n${relevantEvents.join('\n')}`);
        }

        // Key decisions from archive (extract assistant messages that look important)
        const keyDecisions = archiveMessages
            .filter(m => m.role === 'assistant')
            .slice(-5)
            .map(m => {
                // Take first 200 chars of each response as a summary line
                const preview = m.content.slice(0, 200).replace(/\n/g, ' ');
                return `- ${preview}...`;
            });

        if (keyDecisions.length > 0) {
            parts.push(`Key decisions/outputs:\n${keyDecisions.join('\n')}`);
        }

        // Artifact inventory
        if (session.artifacts.size > 0) {
            const artifactList = Array.from(session.artifacts.keys()).join(', ');
            parts.push(`Active artifacts: ${artifactList}`);
        }

        return parts.join('\n\n');
    }
}

/**
 * FormatAdapter — JIT translation of messages to provider-specific formats
 */
export class FormatAdapter {
    /**
     * Translate provider-agnostic messages into the format expected by a specific provider
     *
     * @param {Array} messages - Provider-agnostic messages [{role, content}]
     * @param {string} provider - Target provider ('ollama', 'openai', 'gemini', 'anthropic')
     * @param {string} [systemPrompt] - Optional system prompt
     * @returns {{ messages: Array, system?: string }}
     */
    static adapt(messages, provider, systemPrompt) {
        switch (provider) {
            case 'openai':
                return FormatAdapter._toOpenAI(messages, systemPrompt);
            case 'gemini':
                return FormatAdapter._toGemini(messages, systemPrompt);
            case 'anthropic':
                return FormatAdapter._toAnthropic(messages, systemPrompt);
            case 'ollama':
            default:
                return FormatAdapter._toOllama(messages, systemPrompt);
        }
    }

    /** OpenAI format: system prompt as first message, roles as-is */
    static _toOpenAI(messages, systemPrompt) {
        const formatted = [];
        if (systemPrompt) {
            formatted.push({ role: 'system', content: systemPrompt });
        }
        for (const msg of messages) {
            // OpenAI uses 'system', 'user', 'assistant' — same as our agnostic format
            formatted.push({ role: msg.role, content: msg.content });
        }
        return { messages: formatted };
    }

    /** Gemini format: system instruction separate, 'assistant' → 'model' */
    static _toGemini(messages, systemPrompt) {
        const formatted = messages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content }));

        // Merge system messages into the system prompt
        const systemFromMessages = messages
            .filter(m => m.role === 'system')
            .map(m => m.content)
            .join('\n');

        const finalSystem = [systemPrompt, systemFromMessages].filter(Boolean).join('\n\n');

        return {
            messages: formatted,
            system: finalSystem || undefined
        };
    }

    /** Anthropic format: system prompt separate, roles as-is */
    static _toAnthropic(messages, systemPrompt) {
        const formatted = [];
        const systemParts = [];

        if (systemPrompt) systemParts.push(systemPrompt);

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemParts.push(msg.content);
            } else {
                formatted.push({ role: msg.role, content: msg.content });
            }
        }

        return {
            messages: formatted,
            system: systemParts.join('\n\n') || undefined
        };
    }

    /** Ollama format: system prompt as first system message */
    static _toOllama(messages, systemPrompt) {
        const formatted = [];
        if (systemPrompt) {
            formatted.push({ role: 'system', content: systemPrompt });
        }
        for (const msg of messages) {
            formatted.push({ role: msg.role, content: msg.content });
        }
        return { messages: formatted };
    }
}

// ─── Session Store (in-memory, keyed by session ID) ──────────
const _sessions = new Map();

/**
 * Get or create a session
 */
export function getSession(sessionId) {
    if (!_sessions.has(sessionId)) {
        _sessions.set(sessionId, new SessionState(sessionId));
    }
    return _sessions.get(sessionId);
}

/**
 * List all active sessions
 */
export function listSessions() {
    return Array.from(_sessions.values()).map(s => s.toSnapshot());
}

/**
 * Delete a session
 */
export function deleteSession(sessionId) {
    return _sessions.delete(sessionId);
}

// ─── Singleton compressor ────────────────────────────────────
export const compressor = new ContextCompressor();
