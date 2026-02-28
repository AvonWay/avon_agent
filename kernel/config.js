/**
 * ============================================================
 *  kernel/config.js  — Velocity Multi-Model Intelligence Layer
 *
 *  MODEL ROSTER (all local, no cloud required):
 *  ─────────────────────────────────────────────────────────
 *  Avon:latest           — Master Architect & Orchestrator
 *  deepseek-coder-v2     — Primary Code Builder (purpose-built)
 *  codegemma             — Code Reviewer & Security Auditor
 *  llama3:8b             — Logic, Reasoning & Planning
 *  llama3.2              — Fast QC, Distillation, Summaries
 * ============================================================
 */

export const RSI_LIMITS = {
    maxRetriesPerTask: 3,       // bumped from 2 — more attempts with better models
    maxWebSearches: 3,
    confidenceThreshold: 0.85
};

// ─── Provider resolution ────────────────────────────────────
// Falls back gracefully: OpenAI keys → cloud, otherwise fully local
const USE_CLOUD = !!process.env.OPENAI_API_KEY;
const P = USE_CLOUD ? 'openai' : 'ollama';

/**
 * MODEL PROFILES — each role mapped to the best available model.
 *
 * Design rationale:
 *  - architect:   Avon (custom fine-tune) writes the strategic plan & JSON task graph
 *  - builder:     deepseek-coder-v2 produces the actual code — it's a dedicated code model
 *  - techlead:    deepseek-coder-v2 as well — it excels at component-level HTML/CSS/JS
 *  - guardian:    codegemma performs the visual hardening pass — Google's code specialist
 *  - reviewer:    codegemma reviews and audits — same specialist, different prompt
 *  - security:    codegemma is trained on secure coding patterns
 *  - logic:       llama3:8b reasons through business logic and data structures
 *  - planner:     llama3:8b plans tasks and dependency graphs
 *  - reflection:  llama3:8b reflects on failures (it reasons well)
 *  - distiller:   llama3.2 is fast and cheap for summarisation/extraction
 *  - standard:    llama3.2 for general-purpose lightweight tasks
 *  - evolution:   deepseek-coder-v2 for self-patching (it writes code, not Avon)
 */
export const MODEL_PROFILES = {
    // ── Strategic Layer ──────────────────────────────────────
    architect: {
        provider: P,
        model: process.env.MODEL_ARCHITECT
            || (USE_CLOUD ? 'gpt-4o' : 'Avon:latest'),
        description: 'Master Orchestrator — Avon designs the full task graph & brand DNA'
    },

    // ── Code Generation Layer ─────────────────────────────────
    builder: {
        provider: P,
        model: process.env.MODEL_BUILDER
            || (USE_CLOUD ? 'gpt-4o' : 'deepseek-coder-v2:latest'),
        description: 'Primary Code Synthesizer — DeepSeek Coder builds production HTML/CSS/JS'
    },
    techlead: {
        provider: P,
        model: process.env.MODEL_TECHLEAD
            || (USE_CLOUD ? 'gpt-4o' : 'deepseek-coder-v2:latest'),
        description: 'Tech Lead — DeepSeek Coder architects components and implements features'
    },
    evolution: {
        provider: P,
        model: process.env.MODEL_EVOLUTION
            || (USE_CLOUD ? 'gpt-4o' : 'deepseek-coder-v2:latest'),
        description: 'Self-Patcher — DeepSeek Coder writes its own evolution patches'
    },

    // ── Review & Hardening Layer ──────────────────────────────
    guardian: {
        provider: P,
        model: process.env.MODEL_GUARDIAN
            || (USE_CLOUD ? 'gpt-4o' : 'codegemma:latest'),
        description: 'Visual Guardian — CodeGemma hardens UI fidelity and accessibility'
    },
    reviewer: {
        provider: P,
        model: process.env.MODEL_REVIEWER
            || (USE_CLOUD ? 'gpt-4o' : 'codegemma:latest'),
        description: 'Quality Reviewer — CodeGemma audits correctness, security, aesthetics'
    },
    security: {
        provider: P,
        model: process.env.MODEL_SECURITY
            || (USE_CLOUD ? 'gpt-4o' : 'codegemma:latest'),
        description: 'Security Auditor — CodeGemma performs SAST and vulnerability analysis'
    },

    // ── Reasoning & Logic Layer ───────────────────────────────
    logic: {
        provider: P,
        model: process.env.MODEL_LOGIC
            || (USE_CLOUD ? 'gpt-4o-mini' : 'llama3:8b'),
        description: 'Logic Engine — LLaMA 3 handles data structures and business logic'
    },
    planner: {
        provider: P,
        model: process.env.MODEL_PLANNER
            || (USE_CLOUD ? 'gpt-4o-mini' : 'llama3:8b'),
        description: 'Task Planner — LLaMA 3 decomposes goals and resolves dependencies'
    },
    reflection: {
        provider: P,
        model: process.env.MODEL_REFLECTION
            || (USE_CLOUD ? 'gpt-4o-mini' : 'llama3:8b'),
        description: 'Reflector — LLaMA 3 analyzes failures and proposes strategy pivots'
    },

    // ── Lightweight / Fast Layer ──────────────────────────────
    distiller: {
        provider: P,
        model: process.env.MODEL_DISTILLER
            || (USE_CLOUD ? 'gpt-4o-mini' : 'llama3.2:latest'),
        description: 'Distiller — LLaMA 3.2 summarizes learnings into constitution patterns'
    },
    standard: {
        provider: P,
        model: process.env.MODEL_STANDARD
            || (USE_CLOUD ? 'gpt-4o-mini' : 'llama3.2:latest'),
        description: 'General Purpose — LLaMA 3.2 handles lightweight tasks and QC checks'
    },
    avon_bot: {
        provider: P,
        model: process.env.MODEL_AVON_BOT
            || (USE_CLOUD ? 'gpt-4o' : 'Avon:latest'),
        description: 'Avon Bot scaffold — Avon builds the initial high-fidelity HTML scaffold'
    }
};

// ─── Helper: print routing table to console on boot ─────────
export function logModelRouting() {
    const source = USE_CLOUD ? '☁️  OpenAI (cloud)' : '🖥️  Ollama (local)';
    console.log(`\n[Config] Intelligence Layer — Provider: ${source}`);
    console.log('[Config] Role → Model assignments:');
    const roles = Object.entries(MODEL_PROFILES);
    const maxRole = Math.max(...roles.map(([r]) => r.length));
    roles.forEach(([role, { model }]) => {
        console.log(`  ${role.padEnd(maxRole)}  →  ${model}`);
    });
    console.log('');
}
