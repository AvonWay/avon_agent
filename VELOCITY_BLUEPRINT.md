# Velocity Protocol — Technical Blueprint v2.0

> **Lead Architect:** Gemini (Antigravity OpenClaw)  
> **Generated:** 2026-02-27T12:57:40-05:00  
> **Directive ID:** VD-2026-02-27-001

---

## Phase 1 — Manifest Ingest Summary

| Field                   | Value                                                      |
|-------------------------|------------------------------------------------------------|
| **Project**             | Avon Industrial Agent                                      |
| **Version**             | 1.0.0                                                      |
| **Boot Timestamp**      | 2026-02-27T10:49:22-05:00                                  |
| **Evolution Cycles**    | 0 (clean slate — engine ready for first cycle)             |
| **API Latency Target**  | < 2,000 ms (p95)                                           |
| **Heap Warning**        | 512 MB                                                     |
| **Max Evo Cycles**      | 10                                                         |
| **Critical Objectives** | RLS active, Auth middleware intact, No secrets             |

---

## Phase 2 — Architectural Spec

### Current System State Assessment

The Avon Evolution Engine (M1–M6) is **deployed but STANDBY** (requires `EVOLUTION_MODE=auto` to activate).
The backend (`avon-backend/server.js`) is full-stack Supabase-backed with JWT auth.  
The dashboard (`avon-dashboard`) is Next.js + Tailwind.  
Agent Swarm: `supervisor.js`, `architect.js`, `builder.js`, `guardian.js`, `reflection.js` are all present.

### SAST Pre-Scan (Lead Architect Analysis)

⚠️ **3 HIGH-priority issues detected in current source before any agent runs:**

| Severity | File                     | Finding                                                              |
|----------|--------------------------|----------------------------------------------------------------------|
| HIGH     | `avon-backend/server.js` | `child_process.exec` — unsanitised shell exec route                  |
| HIGH     | `avon-backend/server.js` | `SUPABASE_ANON_KEY` used server-side (should be SERVICE_ROLE_KEY)    |
| MEDIUM   | `agents/avon_bot.js`     | Model hard-coded to `Avon:latest` — no fallback logic                |

---

## Phase 3 — Build Directives

### Directive Set A — 🔐 Security (Route → DeepSeek)

#### Task DS-001: Sanitise `/api/terminal/exec`

- Wrap `exec()` with an allowlist of permitted commands
- Reject shell metacharacters (`; | && || > <`)
- Return `403` with a structured error if command is blocked
- Target file: `avon-backend/server.js` (lines 223–228)

#### Task DS-002: Upgrade Supabase to Service Role

- Replace `SUPABASE_ANON_KEY` with `SUPABASE_SERVICE_ROLE_KEY` for all server-to-Supabase calls
- Add runtime assertion: `if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw`
- Ensure `.env.example` is updated to document the new variable
- Target files: `avon-backend/server.js`, `.env.example` (create if missing)

#### Task DS-003: Add Rate Limiting to Evolution Trigger

- Install `express-rate-limit` (already in ecosystem style)
- Apply 5 req/15 min limit to `POST /api/evolution/trigger`
- Target file: `avon-backend/server.js`

---

### Directive Set B — 🎨 UI/Components (Route → Local CodeGemma)

#### Task CG-001: Evolution Engine Dashboard Widget

- Create new component: `avon-dashboard/src/components/EvolutionMonitor.tsx`
- Live-polls `GET /api/evolution/status` every 10 seconds
- Displays: Engine state (ONLINE/STANDBY), cycle count, last evolution timestamp, telemetry sparkline
- Visual: Dark glassmorphism card, animated pulse dot for "running" state
- Dependencies: `lucide-react` (already installed)

#### Task CG-002: Update WebsiteOverview to use live Supabase data

- `WebsiteOverview.tsx` currently uses hardcoded static data array (lines 6–11)
- Convert to async component fetching from `GET /api/sites`
- Add loading skeleton and empty state
- Use JWT from `localStorage` for the Authorization header

#### Task CG-003: Avon_Bot Activity Feed

- New component: `avon-dashboard/src/components/AgentActivityFeed.tsx`
- Reads from `GET /api/evolution/history`
- Shows last 10 evolution events in a timeline (icon + description + timestamp)
- Color-coded by priority: CRITICAL=red, HIGH=amber, MEDIUM=blue, LOW=green

---

### Directive Set D — 📁 File I/O & Merging (Route → Local Llama/Phi-4)

#### Task LM-001: `.env.example` Creation

- Create `.env.example` at project root documenting ALL required variables:

  ```text
  PORT=4000
  JWT_SECRET=
  SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
  SUPABASE_ANON_KEY=
  OPENAI_API_KEY=
  EVOLUTION_MODE=auto
  ```

- Cross-reference with `avon-backend/server.js` and `kernel/evolutionEngine.js`

#### Task LM-002: Mission Manifest Upgrade

- Bump version to `2.0.0`
- Add new fields:
  - `velocity_directive_id`: `"VD-2026-02-27-001"`
  - `swarm_assignments`: map of task IDs to agent names
  - `last_blueprint_timestamp`: ISO timestamp of this blueprint
- Update `boot_timestamp` to current

#### Task LM-003: Evolution Log Archiver

- Create `scripts/archiveEvolutionLog.js`
- Reads `memory/evolution_log.jsonl`
- If file > 1MB, rotates to `memory/evolution_log.{date}.jsonl.bak`
- Prints summary: total entries, cycles, most common patch target

---

## Phase 4 — Swarm Routing Manifest

```json
{
  "directive_id": "VD-2026-02-27-001",
  "generated_by": "Gemini (Velocity Lead Architect)",
  "timestamp": "2026-02-27T12:57:40-05:00",
  "routing": {
    "DeepSeek": ["DS-001", "DS-002", "DS-003"],
    "CodeGemma": ["CG-001", "CG-002", "CG-003"],
    "Llama/Phi-4": ["LM-001", "LM-002", "LM-003"]
  },
  "priority_order": ["DS-001", "DS-002", "CG-001", "LM-001", "DS-003", "CG-002", "LM-002", "CG-003", "LM-003"],
  "forbidden_checks": [
    "No patch may disable authenticateJWT middleware",
    "No patch may set RLS to false on any Supabase table",
    "No patch may expose process.env to client-side code",
    "No patch may use eval() or new Function() with user input"
  ]
}
```

---

## Phase 5 — Final Review Criteria (Gemini Validation Gate)

Before any swarm output is committed to `main`, Gemini will validate:

1. ✅ **Auth Intact**: `authenticateJWT` middleware still applied to all protected routes
2. ✅ **RLS Active**: No `supabase.rpc('disable_rls')` in any diff
3. ✅ **No Secrets Exposed**: No `process.env.*KEY` references in frontend files
4. ✅ **Latency Unaffected**: New code paths must not add synchronous blocking ops
5. ✅ **Vibe-Diff Alignment**: Output must follow existing Velocity ES-module + async/await patterns
6. ✅ **Build Passes**: `node --check` on all modified `.js` files must return exit 0
7. ✅ **Evolution Log Updated**: Each completed task must be recorded in `memory/evolution_log.jsonl`

---

## Token Efficiency Notes

- DeepSeek handles all logic/security tasks (bulk code generation)
- CodeGemma handles all UI boilerplate (React TSX component generation)
- Llama/Phi-4 handles all file merging / I/O (low reasoning overhead)
- Gemini reserved for decisions, alignment checks, and final validation only
- Token cost estimate: ~40% reduction vs. single-model approach

---

*This blueprint is live. Avon_bot has been alerted. Swarm standing by.*
