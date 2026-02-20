# Velocity Pre-Build Checklist

> This file documents the SCAN → ALIGN → PLAN checks to verify before every build.

## SCAN Phase Checklist

- [ ] Read `.velocity/knowledge/supabase-schema-gold.md`
- [ ] Read `.velocity/knowledge/component-patterns.md`
- [ ] Read `.velocity/knowledge/nextjs-config-gold.md`
- [ ] Read `.velocity/knowledge/env-variables-gold.md`
- [ ] Check existing `supabase_schema.sql` for drift from gold master
- [ ] Check existing components in `avon-dashboard/src/` for reusable patterns
- [ ] Check `memory/heuristics.md` for Safe Lane rules

## ALIGN Phase Checklist

- [ ] Map user request to Gold Master tables (add new tables if needed)
- [ ] Identify which Architecture Blueprint routes are required
- [ ] Identify which Shadcn/UI components are needed
- [ ] Confirm auth provider (Clerk vs NextAuth)
- [ ] Confirm payment requirements (Stripe modes: payment vs subscription)

## PLAN Phase Checklist

- [ ] Generate `build-plan.json` in project root
- [ ] Plan includes every component with path, type, and dependencies
- [ ] Plan lists all Supabase tables to be created/modified
- [ ] Plan lists all required environment variables
- [ ] Plan includes estimated file count
- [ ] Present PermissionButton to user for approval

## EXECUTE Phase Rules

- [ ] Only proceed after explicit "Grant Build Permission" from user
- [ ] Generate files in dependency order (lib → store → components → pages → api)
- [ ] No placeholder code (`// TODO`, `// add logic here`)
- [ ] Every file must be complete and production-ready
- [ ] Run `npm run build` after generation to verify zero errors
