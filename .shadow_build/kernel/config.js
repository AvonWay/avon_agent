/**
 * ============================================================
 *  kernel/config.js  — Velocity Hybrid Intelligence Layer
 *
 *  MODEL ROSTER:
 *  ─────────────────────────────────────────────────────────
 *  CLOUD LANE (Gemini):  Architect, Builder, Logic, Evolution
 *  LOCAL LANE (Ollama):  Guardian, Reviewer, Distiller, Avon Bot
 * ============================================================
 */

// ⚠️ CRITICAL: Load .env BEFORE any process.env reads.
// ES modules evaluate top-level code at import time, so dotenv
// must run here — not in the calling file.
import dotenv from 'dotenv';
dotenv.config();

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

// ─── Hybrid Intelligence: Two provider lanes ────────────────
// CLOUD = Gemini for heavy synthesis (architect, builder, evolution)
// LOCAL = Ollama for fast audits, distillation, and brand-aware tasks
const CLOUD = (IS_REMOTE || HAS_GEMINI) ? 'gemini'
             : HAS_OPENAI ? 'openai'
             : 'ollama';

const LOCAL = 'ollama'; // Always available for fast local tasks

const DEFAULT_CLOUD_MODEL = HAS_GEMINI ? 'gemini-2.5-flash' : 'gpt-4o';
const DEFAULT_LITE_MODEL  = HAS_GEMINI ? 'gemini-2.5-flash' : 'gpt-4o-mini';

/**
 * MODEL PROFILES — Hybrid Intelligence Routing
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  CLOUD LANE (Gemini)          │  LOCAL LANE (Ollama)           │
 * │  Heavy synthesis, reasoning   │  Fast audits, brand memory     │
 * ├───────────────────────────────┼────────────────────────────────┤
 * │  architect  → gemini-2.0-flash│  guardian  → codegemma         │
 * │  builder    → gemini-2.0-flash│  reviewer  → codegemma         │
 * │  techlead   → gemini-2.0-flash│  security  → codegemma         │
 * │  evolution  → gemini-2.0-flash│  distiller → llama3.2          │
 * │  logic      → gemini-2.0-flash│  standard  → llama3.2          │
 * │  planner    → gemini-2.0-flash│  avon_bot  → Avon:latest       │
 * │  reflection → gemini-2.0-flash│                                │
 * └───────────────────────────────┴────────────────────────────────┘
 *
 * Avon:latest (LOCAL) retains its role as the brand-aware scaffold
 * builder. It knows the Velocity DNA from its Modelfile system prompt.
 * Gemini handles the complex reasoning, code generation, and planning.
 */
export const MODEL_PROFILES = {
    // ── Strategic Layer (CLOUD — needs deep reasoning) ───────
    architect: {
        provider: CLOUD,
        model: process.env.MODEL_ARCHITECT
            || (CLOUD !== 'ollama' ? DEFAULT_CLOUD_MODEL : 'Avon:latest'),
        description: 'Master Orchestrator — designs the full task graph & brand DNA'
    },

    // ── Code Generation Layer (CLOUD — needs precision) ──────
    builder: {
        provider: CLOUD,
        model: process.env.MODEL_BUILDER
            || (CLOUD !== 'ollama' ? DEFAULT_CLOUD_MODEL : 'deepseek-coder-v2:latest'),
        description: 'Primary Code Synthesizer — builds production HTML/CSS/JS'
    },
    techlead: {
        provider: CLOUD,
        model: process.env.MODEL_TECHLEAD
            || (CLOUD !== 'ollama' ? DEFAULT_CLOUD_MODEL : 'deepseek-coder-v2:latest'),
        description: 'Tech Lead — architects components and implements features'
    },
    evolution: {
        provider: CLOUD,
        model: process.env.MODEL_EVOLUTION
            || (CLOUD !== 'ollama' ? DEFAULT_CLOUD_MODEL : 'deepseek-coder-v2:latest'),
        description: 'Self-Patcher — writes evolution patches for the codebase'
    },

    // ── Reasoning Layer (CLOUD — complex multi-step logic) ───
    logic: {
        provider: CLOUD,
        model: process.env.MODEL_LOGIC
            || (CLOUD !== 'ollama' ? DEFAULT_CLOUD_MODEL : 'llama3:8b'),
        description: 'Logic Engine — handles data structures and business logic'
    },
    planner: {
        provider: CLOUD,
        model: process.env.MODEL_PLANNER
            || (CLOUD !== 'ollama' ? DEFAULT_CLOUD_MODEL : 'llama3:8b'),
        description: 'Task Planner — decomposes goals and resolves dependencies'
    },
    reflection: {
        provider: CLOUD,
        model: process.env.MODEL_REFLECTION
            || (CLOUD !== 'ollama' ? DEFAULT_CLOUD_MODEL : 'llama3:8b'),
        description: 'Reflector — analyzes failures and proposes strategy pivots'
    },

    // ── Review & Hardening Layer (LOCAL — fast, purpose-built) ─
    guardian: {
        provider: LOCAL,
        model: process.env.MODEL_GUARDIAN || 'codegemma:latest',
        description: 'Visual Guardian — CodeGemma hardens UI fidelity and accessibility'
    },
    reviewer: {
        provider: LOCAL,
        model: process.env.MODEL_REVIEWER || 'codegemma:latest',
        description: 'Quality Reviewer — CodeGemma audits correctness, security, aesthetics'
    },
    security: {
        provider: LOCAL,
        model: process.env.MODEL_SECURITY || 'codegemma:latest',
        description: 'Security Auditor — CodeGemma performs SAST and vulnerability analysis'
    },

    // ── Lightweight / Fast Layer (LOCAL — speed priority) ─────
    distiller: {
        provider: LOCAL,
        model: process.env.MODEL_DISTILLER || 'llama3.2:latest',
        description: 'Distiller — LLaMA 3.2 summarizes learnings into constitution patterns'
    },
    standard: {
        provider: LOCAL,
        model: process.env.MODEL_STANDARD || 'llama3.2:latest',
        description: 'General Purpose — LLaMA 3.2 handles lightweight tasks and QC checks'
    },

    // ── Brand-Aware Scaffold (LOCAL — Avon knows the DNA) ────
    avon_bot: {
        provider: LOCAL,
        model: process.env.MODEL_AVON_BOT || 'Avon:latest',
        description: 'Avon Bot scaffold — builds the initial high-fidelity HTML scaffold with brand memory'
    }
};

// ─── Helper: print routing table to console on boot ─────────
export function logModelRouting() {
    const cloudSource = CLOUD === 'gemini' ? '✨ Gemini (cloud)'
                      : CLOUD === 'openai' ? '☁️  OpenAI (cloud)'
                      : '🖥️  Ollama (local)';
    console.log(`\n[Config] ══ HYBRID INTELLIGENCE LAYER ══`);
    console.log(`[Config] Cloud Lane: ${cloudSource}`);
    console.log(`[Config] Local Lane: 🖥️  Ollama (local)`);
    console.log('[Config] Role → Model assignments:');
    const roles = Object.entries(MODEL_PROFILES);
    const maxRole = Math.max(...roles.map(([r]) => r.length));
    roles.forEach(([role, { model, provider }]) => {
        const lane = provider === 'ollama' ? '🖥️' : '☁️';
        console.log(`  ${lane} ${role.padEnd(maxRole)}  →  ${model}`);
    });
    console.log('');
}

