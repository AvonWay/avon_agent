/**
 * ============================================================
 *  kernel/config.js  — Velocity Tiered Intelligence Layer
 *
 *  MODEL ROSTER:
 *  ─────────────────────────────────────────────────────────
 *  TIER 1 — STRATEGIST (Gemini 3.1 Pro):
 *      Architect, Synthesis, Reflection, Evolution
 *      Deep reasoning, complex planning, multi-page coherence
 *
 *  TIER 2 — WORKHORSE (Gemini 2.5 Flash):
 *      Builder, Guardian, Reviewer, Security, Scaffold
 *      Fast parallel execution, code generation, audits
 *
 *  TIER 3 — UNDERSTUDY (Avon_Agent):
 *      Universal local fallback — learning from Tiers 1 & 2
 * ============================================================
 */

// ⚠️ CRITICAL: Load .env BEFORE any process.env reads.
import dotenv from 'dotenv';
dotenv.config();

export const RSI_LIMITS = {
    maxRetriesPerTask: 3,
    maxWebSearches: 3,
    confidenceThreshold: 0.85
};

// ─── Provider resolution ────────────────────────────────────
const HAS_GEMINI = !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
const HAS_OPENAI = !!process.env.OPENAI_API_KEY;

const IS_REMOTE = process.env.NODE_ENV === 'production' || process.env.REMOTE_DEPLOY === 'true';

// ─── Three-tier intelligence ────────────────────────────────
const CLOUD = HAS_GEMINI ? 'gemini' : (HAS_OPENAI ? 'openai' : 'ollama');

const LOCAL = 'ollama'; // Avon_Agent — sole local model

// Tier 1: Pro for strategic/reasoning tasks
const STRATEGIST_MODEL = HAS_GEMINI ? 'gemini-2.5-pro' : 'gpt-4o';
// Tier 2: Flash for fast execution tasks  
const WORKHORSE_MODEL  = HAS_GEMINI ? 'gemini-2.5-flash' : 'gpt-4o-mini';
const LOCAL_MODEL = 'Avon_Agent';

/**
 * MODEL PROFILES — Three-Tier Intelligence
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  TIER 1: STRATEGIST            │  TIER 2: WORKHORSE                    │
 * │  Gemini 3.1 Pro                 │  Gemini 2.5 Flash                     │
 * │  Deep reasoning & planning      │  Fast execution & review              │
 * ├────────────────────────────────┼───────────────────────────────────────┤
 * │  architect  → gemini-3.1-pro    │  builder    → gemini-2.5-flash       │
 * │  evolution  → gemini-3.1-pro    │  techlead   → gemini-2.5-flash       │
 * │  reflection → gemini-3.1-pro    │  logic      → gemini-2.5-flash       │
 * │  planner    → gemini-3.1-pro    │  guardian   → gemini-2.5-flash       │
 * │                                │  reviewer   → gemini-2.5-flash       │
 * │                                │  security   → gemini-2.5-flash       │
 * │                                │  distiller  → gemini-2.5-flash       │
 * │                                │  standard   → gemini-2.5-flash       │
 * │                                │  avon_bot   → gemini-2.5-flash       │
 * └────────────────────────────────┴───────────────────────────────────────┘
 * │  TIER 3: UNDERSTUDY — Avon_Agent (universal local fallback)           │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * WHY THIS SPLIT:
 * • Pro excels at complex multi-step reasoning — perfect for designing
 *   5-page architectures, weaving synthesis, and analyzing failures.
 * • Flash excels at fast, high-quality code generation — perfect for
 *   building individual pages in parallel, running security audits,
 *   and hardening UI at speed.
 * • Together they're 10x more effective than either alone.
 * • Avon_Agent observes ALL outputs from both tiers to learn.
 */
export const MODEL_PROFILES = {
    // ══════════════════════════════════════════════════════════
    //  TIER 1: STRATEGIST (Gemini 2.5 Pro)
    //  Tasks that need deep reasoning, planning, coherence
    // ══════════════════════════════════════════════════════════

    architect: {
        provider: CLOUD,
        model: process.env.MODEL_ARCHITECT
            || (CLOUD !== 'ollama' ? STRATEGIST_MODEL : LOCAL_MODEL),
        description: 'TIER 1 — Master Orchestrator: designs 5-page task graphs, brand DNA, and architecture plans'
    },
    evolution: {
        provider: CLOUD,
        model: process.env.MODEL_EVOLUTION
            || (CLOUD !== 'ollama' ? STRATEGIST_MODEL : LOCAL_MODEL),
        description: 'TIER 1 — Self-Patcher: writes evolution patches requiring deep codebase understanding'
    },
    reflection: {
        provider: CLOUD,
        model: process.env.MODEL_REFLECTION
            || (CLOUD !== 'ollama' ? STRATEGIST_MODEL : LOCAL_MODEL),
        description: 'TIER 1 — Reflector: analyzes failures with multi-step reasoning and proposes strategy pivots'
    },
    planner: {
        provider: CLOUD,
        model: process.env.MODEL_PLANNER
            || (CLOUD !== 'ollama' ? STRATEGIST_MODEL : LOCAL_MODEL),
        description: 'TIER 1 — Task Planner: decomposes complex goals into ordered dependency graphs'
    },

    // ══════════════════════════════════════════════════════════
    //  TIER 2: WORKHORSE (Gemini 2.5 Flash)
    //  Tasks that need speed, parallel execution, code output
    // ══════════════════════════════════════════════════════════

    builder: {
        provider: CLOUD,
        model: process.env.MODEL_BUILDER
            || (CLOUD !== 'ollama' ? WORKHORSE_MODEL : LOCAL_MODEL),
        description: 'TIER 2 — Code Synthesizer: builds production HTML/CSS/JS pages at speed'
    },
    techlead: {
        provider: CLOUD,
        model: process.env.MODEL_TECHLEAD
            || (CLOUD !== 'ollama' ? WORKHORSE_MODEL : LOCAL_MODEL),
        description: 'TIER 2 — Tech Lead: architects components and implements features'
    },
    logic: {
        provider: CLOUD,
        model: process.env.MODEL_LOGIC
            || (CLOUD !== 'ollama' ? WORKHORSE_MODEL : LOCAL_MODEL),
        description: 'TIER 2 — Logic Engine: handles data structures, state management, business logic'
    },
    guardian: {
        provider: CLOUD,
        model: process.env.MODEL_GUARDIAN
            || (CLOUD !== 'ollama' ? WORKHORSE_MODEL : LOCAL_MODEL),
        description: 'TIER 2 — Visual Guardian: hardens UI fidelity, accessibility, cross-page consistency'
    },
    reviewer: {
        provider: CLOUD,
        model: process.env.MODEL_REVIEWER
            || (CLOUD !== 'ollama' ? WORKHORSE_MODEL : LOCAL_MODEL),
        description: 'TIER 2 — Quality Reviewer: audits correctness, security, aesthetics'
    },
    security: {
        provider: CLOUD,
        model: process.env.MODEL_SECURITY
            || (CLOUD !== 'ollama' ? WORKHORSE_MODEL : LOCAL_MODEL),
        description: 'TIER 2 — Security Auditor: performs SAST and vulnerability analysis'
    },
    distiller: {
        provider: CLOUD,
        model: process.env.MODEL_DISTILLER
            || (CLOUD !== 'ollama' ? WORKHORSE_MODEL : LOCAL_MODEL),
        description: 'TIER 2 — Distiller: summarizes learnings into constitution patterns'
    },
    standard: {
        provider: CLOUD,
        model: process.env.MODEL_STANDARD
            || (CLOUD !== 'ollama' ? WORKHORSE_MODEL : LOCAL_MODEL),
        description: 'TIER 2 — General Purpose: handles lightweight tasks and QC checks'
    },
    avon_bot: {
        provider: CLOUD,
        model: process.env.MODEL_AVON_BOT
            || (CLOUD !== 'ollama' ? WORKHORSE_MODEL : LOCAL_MODEL),
        description: 'TIER 2 — Avon_Agent scaffold: builds high-fidelity HTML scaffolds with brand memory'
    },
    designer: {
        provider: CLOUD,
        model: process.env.MODEL_DESIGNER
            || (CLOUD !== 'ollama' ? WORKHORSE_MODEL : LOCAL_MODEL),
        description: 'TIER 2 — Designer: handles UI/UX, aesthetics, and theme generation'
    },
    researcher: {
        provider: CLOUD,
        model: process.env.MODEL_RESEARCHER
            || (CLOUD !== 'ollama' ? WORKHORSE_MODEL : LOCAL_MODEL),
        description: 'TIER 2 — Researcher: knowledge distillation and technical analysis'
    }
};

// ─── Helper: print routing table to console on boot ─────────
export function logModelRouting() {
    const cloudSource = CLOUD === 'gemini' ? '✨ Gemini (cloud)'
                      : CLOUD === 'openai' ? '☁️  OpenAI (cloud)'
                      : '🤖 Avon_Agent (solo — no cloud key)';
    console.log(`\n[Config] ══ VELOCITY THREE-TIER INTELLIGENCE ══`);
    console.log(`[Config] Tier 1 (Strategist): ${CLOUD === 'gemini' ? '🧠 Gemini 3.1 Pro' : cloudSource}`);
    console.log(`[Config] Tier 2 (Workhorse):  ${CLOUD === 'gemini' ? '⚡ Gemini 2.5 Flash' : cloudSource}`);
    console.log(`[Config] Tier 3 (Understudy): 🤖 Avon_Agent (local — learning)`);
    console.log('[Config] Role → Model assignments:');
    const roles = Object.entries(MODEL_PROFILES);
    const maxRole = Math.max(...roles.map(([r]) => r.length));
    roles.forEach(([role, { model, provider, description }]) => {
        const tier = description.startsWith('TIER 1') ? '🧠' 
                   : description.startsWith('TIER 2') ? '⚡' 
                   : '🤖';
        console.log(`  ${tier} ${role.padEnd(maxRole)}  →  ${model}`);
    });
    console.log('');
}
