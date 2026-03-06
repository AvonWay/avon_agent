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
const HAS_GEMINI = !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
const HAS_OPENAI = !!process.env.OPENAI_API_KEY;

// If we are NOT on localhost, we MUST use a cloud provider (Gemini preferred)
const IS_REMOTE = process.env.NODE_ENV === 'production' || process.env.REMOTE_DEPLOY === 'true';

const P = (IS_REMOTE || HAS_GEMINI) ? 'gemini' 
          : HAS_OPENAI ? 'openai' 
          : 'ollama';

const DEFAULT_CLOUD_MODEL = HAS_GEMINI ? 'gemini-1.5-pro' : 'gpt-4o';
const DEFAULT_LITE_MODEL = HAS_GEMINI ? 'gemini-1.5-flash' : 'gpt-4o-mini';

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
            || (P !== 'ollama' ? DEFAULT_CLOUD_MODEL : 'Avon:latest'),
        description: 'Master Orchestrator — Avon designs the full task graph & brand DNA'
    },

    // ── Code Generation Layer ─────────────────────────────────
    builder: {
        provider: P,
        model: process.env.MODEL_BUILDER
            || (P !== 'ollama' ? DEFAULT_CLOUD_MODEL : 'deepseek-coder-v2:latest'),
        description: 'Primary Code Synthesizer — DeepSeek Coder builds production HTML/CSS/JS'
    },
    techlead: {
        provider: P,
        model: process.env.MODEL_TECHLEAD
            || (P !== 'ollama' ? DEFAULT_CLOUD_MODEL : 'deepseek-coder-v2:latest'),
        description: 'Tech Lead — DeepSeek Coder architects components and implements features'
    },
    evolution: {
        provider: P,
        model: process.env.MODEL_EVOLUTION
            || (P !== 'ollama' ? DEFAULT_CLOUD_MODEL : 'deepseek-coder-v2:latest'),
        description: 'Self-Patcher — DeepSeek Coder writes its own evolution patches'
    },

    // ── Review & Hardening Layer ──────────────────────────────
    guardian: {
        provider: P,
        model: process.env.MODEL_GUARDIAN
            || (P !== 'ollama' ? DEFAULT_LITE_MODEL : 'codegemma:latest'),
        description: 'Visual Guardian — CodeGemma hardens UI fidelity and accessibility'
    },
    reviewer: {
        provider: P,
        model: process.env.MODEL_REVIEWER
            || (P !== 'ollama' ? DEFAULT_LITE_MODEL : 'codegemma:latest'),
        description: 'Quality Reviewer — CodeGemma audits correctness, security, aesthetics'
    },
    security: {
        provider: P,
        model: process.env.MODEL_SECURITY
            || (P !== 'ollama' ? DEFAULT_LITE_MODEL : 'codegemma:latest'),
        description: 'Security Auditor — CodeGemma performs SAST and vulnerability analysis'
    },

    // ── Reasoning & Logic Layer ───────────────────────────────
    logic: {
        provider: P,
        model: process.env.MODEL_LOGIC
            || (P !== 'ollama' ? DEFAULT_LITE_MODEL : 'llama3:8b'),
        description: 'Logic Engine — LLaMA 3 handles data structures and business logic'
    },
    planner: {
        provider: P,
        model: process.env.MODEL_PLANNER
            || (P !== 'ollama' ? DEFAULT_LITE_MODEL : 'llama3:8b'),
        description: 'Task Planner — LLaMA 3 decomposes goals and resolves dependencies'
    },
    reflection: {
        provider: P,
        model: process.env.MODEL_REFLECTION
            || (P !== 'ollama' ? DEFAULT_LITE_MODEL : 'llama3:8b'),
        description: 'Reflector — LLaMA 3 analyzes failures and proposes strategy pivots'
    },

    // ── Lightweight / Fast Layer ──────────────────────────────
    distiller: {
        provider: P,
        model: process.env.MODEL_DISTILLER
            || (P !== 'ollama' ? DEFAULT_LITE_MODEL : 'llama3.2:latest'),
        description: 'Distiller — LLaMA 3.2 summarizes learnings into constitution patterns'
    },
    standard: {
        provider: P,
        model: process.env.MODEL_STANDARD
            || (P !== 'ollama' ? DEFAULT_LITE_MODEL : 'llama3.2:latest'),
        description: 'General Purpose — LLaMA 3.2 handles lightweight tasks and QC checks'
    },
    avon_bot: {
        provider: P,
        model: process.env.MODEL_AVON_BOT
            || (P !== 'ollama' ? DEFAULT_CLOUD_MODEL : 'Avon:latest'),
        description: 'Avon Bot scaffold — Avon builds the initial high-fidelity HTML scaffold'
    }
};

// ─── Helper: print routing table to console on boot ─────────
export function logModelRouting() {
    const source = P === 'gemini' ? '✨ Gemini (cloud)' 
                 : P === 'openai' ? '☁️  OpenAI (cloud)' 
                 : '🖥️  Ollama (local)';
    console.log(`\n[Config] Intelligence Layer — Provider: ${source}`);
    console.log('[Config] Role → Model assignments:');
    const roles = Object.entries(MODEL_PROFILES);
    const maxRole = Math.max(...roles.map(([r]) => r.length));
    roles.forEach(([role, { model }]) => {
        console.log(`  ${role.padEnd(maxRole)}  →  ${model}`);
    });
    console.log('');
}
