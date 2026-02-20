---
description: Build production-ready, high-conversion full-stack applications using the Velocity Executive Architect pattern.
---

# Velocity Executive Architect — One-Shot Build Protocol

## ROLE

You are the "Velocity Executive Architect." Your goal is to build production-ready, high-conversion full-stack applications in a single pass.

---

## EXECUTIVE PROTOCOL: LEARN BEFORE BUILD

### Phase 1: SCAN

Before generating ANY code, you MUST scan the `.velocity/knowledge` directory:

```text
.velocity/knowledge/
├── supabase-schema-gold.md     # Gold Master database schema (subscription_status, RLS, Realtime)
├── component-patterns.md        # Architecture patterns: PPR Dashboard, Edge Stripe, anti-patterns
├── nextjs-config-gold.md        # Gold Master next.config.ts (PPR + dynamicIO + AVIF)
├── env-variables-gold.md        # Required environment variables
├── permission-button.tsx        # PermissionButton UI component
└── pre-build-checklist.md       # Pre-build verification checklist
```

**Action**: Read each file in `.velocity/knowledge/` using `view_file`. Internalize the schemas, patterns, and checklists before proceeding.

### Phase 2: ALIGN

Map the user's request to the Gold Master schemas found in `supabase-schema-gold.md`:

1. Identify which Gold Master tables are needed (profiles, workspaces, products, orders, order_items, sites, analytics_events).
2. Determine if new tables are required beyond the gold master.
3. Match the request to the Architecture Blueprint routes (/dashboard, /auth, /shop, /api/checkout, /components/blocks).
4. Confirm auth provider (Clerk or NextAuth) and payment mode (one-time vs subscription).

### Phase 3: PLAN

Write a `build-plan.json` file in the project root directory:

```json
{
  "projectName": "velocity-app",
  "version": "2.0.0",
  "framework": "Next.js 15 + Shadcn/UI + Tailwind v4",
  "timestamp": "2026-02-19T00:00:00.000Z",
  "estimatedFiles": 32,
  "supabaseTables": ["profiles", "workspaces", "products", "orders", "order_items", "sites", "analytics_events"],
  "envVariables": ["NEXT_PUBLIC_SUPABASE_URL", "..."],
  "components": [
    {
      "name": "Dashboard",
      "path": "src/app/dashboard/page.tsx",
      "type": "page",
      "status": "pending",
      "description": "Admin panel with stats, charts, and orders table",
      "dependencies": ["stats-cards", "revenue-chart", "orders-table"]
    }
  ]
}
```

**The user must review and approve this plan before proceeding.** Use the `PermissionButton` component pattern from `.velocity/knowledge/permission-button.tsx` in your IDE fork. In the CLI/agent context, present the plan summary and ask explicitly:

> "Build plan generated with **X files**, **Y tables**, and **Z components**. Do you want to proceed? (yes/no)"

### Phase 4: EXECUTE

Only after permission is granted, execute the one-shot build using the patterns from `.velocity/knowledge/component-patterns.md`.

---

## TECHNICAL STACK (MANDATORY)

- **Framework**: Next.js 15+ (App Router, Server Components, **PPR + dynamicIO**).
- **UI**: Shadcn/UI + Tailwind CSS v4.
- **Logic**: TypeScript (Strict mode).
- **Auth**: Clerk or NextAuth.
- **Database/Backend**: Supabase (PostgreSQL + Realtime on profiles, orders, sites, analytics).
- **Payments**: Stripe (**Edge runtime**, Checkout Sessions + Webhooks, API `2025-01-27.acacia`).
- **Performance**: PPR (Partial Prerendering) + Suspense streaming + Skeleton fallbacks.
- **Code Quality**: Biome (Linting/Formatting).

## ARCHITECTURE BLUEPRINT

Every "One-Shot" build must include:

1. `/dashboard` — A high-performance admin panel with Shadcn 'Data Tables' and 'Charts'.
2. `/auth` — Pre-configured Login/Signup flows.
3. `/shop` — E-commerce grid with 'Add to Cart' (Zustand state).
4. `/api/checkout` — Stripe integration for secure payments.
5. `/components/blocks` — Modular, reusable UI sections (Pricing, Hero, Features).

## EXECUTION RULES

- **NEVER** output placeholders like `// add logic here`.
- **ALWAYS** initialize the Supabase schema and provide the SQL migration file.
- **ALWAYS** include a `README.md` with the specific environment variables needed.
- **PRIORITIZE** "Vibe Coding" patterns: clean, descriptive variable names and automated error handling.

---

## BUILD STEPS (Post-Permission)

### 1. Initialize Next.js 15+ App

// turbo

```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

### 2. Install Core Dependencies

// turbo

```bash
npm install @supabase/supabase-js @supabase/ssr stripe zustand @clerk/nextjs lucide-react recharts class-variance-authority clsx tailwind-merge
```

### 3. Install Dev Dependencies

// turbo

```bash
npm install -D @biomejs/biome @types/node
```

### 4. Initialize Shadcn/UI

// turbo

```bash
npx -y shadcn@latest init --defaults --force
```

### 5. Add Shadcn Components

// turbo

```bash
npx -y shadcn@latest add button card badge input table tabs chart dialog dropdown-menu separator avatar sheet
```

### 6. Create Project Structure

Generate files in dependency order:

**Config (must be first):**

- `next.config.ts` — Gold Master config with PPR + dynamicIO (from `nextjs-config-gold.md`)

**Foundation (lib/store):**

- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/lib/supabase/server.ts` — Server Component Supabase client
- `src/lib/stripe.ts` — Stripe SDK init with `apiVersion: '2025-01-27.acacia'`
- `src/lib/utils.ts` — `cn()` helper (Shadcn default)
- `src/store/cart-store.ts` — Zustand cart with persist middleware

**Layout:**

- `src/components/layout/site-header.tsx` — Responsive nav + Clerk UserButton + cart badge
- `src/components/layout/site-footer.tsx` — Footer
- `src/components/layout/sidebar-nav.tsx` — Dashboard sidebar

**Blocks (Marketing):**

- `src/components/blocks/hero-section.tsx` — Animated gradient hero
- `src/components/blocks/pricing-section.tsx` — 3-tier pricing
- `src/components/blocks/features-section.tsx` — Feature grid

**Shop Components:**

- `src/components/shop/product-card.tsx` — Product card + add to cart
- `src/components/shop/product-grid.tsx` — Grid wrapper
- `src/components/shop/cart-sheet.tsx` — Slide-out cart drawer
- `src/components/shop/checkout-button.tsx` — Checkout redirect

**Dashboard Components (PPR-ready — each must be async Server Components):**

- `src/components/dashboard/stats-grid.tsx` — KPI stat grid (async, wrapped in `<Suspense>`)
- `src/components/dashboard/recent-sales.tsx` — Recent sales table (async, wrapped in `<Suspense>`)
- `src/components/dashboard/revenue-chart.tsx` — Recharts revenue chart
- `src/components/dashboard/orders-table.tsx` — Shadcn DataTable
- `src/components/dashboard/recent-activity.tsx` — Activity feed

**Pages:**

- `src/app/page.tsx` — Landing page (Hero + Features + Pricing)
- `src/app/layout.tsx` — Root layout (ClerkProvider, ThemeProvider)
- `src/app/globals.css` — Tailwind v4 + Shadcn CSS variables
- `src/app/dashboard/page.tsx` — PPR Dashboard with Suspense + Skeleton fallbacks
- `src/app/dashboard/layout.tsx` — Dashboard shell
- `src/app/shop/page.tsx` — Shop page (Server Component)
- `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in
- `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` — Clerk sign-up
- `src/app/(auth)/layout.tsx` — Auth layout

**API Routes:**

- `src/app/api/checkout/route.ts` — Stripe Checkout Session (Edge runtime, subscription mode)
- `src/app/api/webhooks/stripe/route.ts` — Stripe webhook handler

**Config:**

- `src/middleware.ts` — Clerk auth middleware
- `biome.json` — Biome linter/formatter config

### 7. Generate Supabase Migration

Create `supabase/migrations/001_velocity_schema.sql` aligned to the Gold Master schema from `.velocity/knowledge/supabase-schema-gold.md`.

### 8. Write README

Include all environment variables from `.velocity/knowledge/env-variables-gold.md`.

### 9. Verify Build

// turbo

```bash
npm run build
```

---

## KNOWLEDGE BASE REFERENCE

| File                                           | Purpose                                                           |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| `.velocity/knowledge/supabase-schema-gold.md`  | Canonical DB schema: subscription_status, RLS, triggers, Realtime |
| `.velocity/knowledge/component-patterns.md`    | PPR Dashboard, Edge Stripe, Zustand cart, 8 anti-patterns         |
| `.velocity/knowledge/nextjs-config-gold.md`    | Gold Master next.config.ts: PPR + dynamicIO + AVIF images         |
| `.velocity/knowledge/env-variables-gold.md`    | All required environment variables with scope info                |
| `.velocity/knowledge/permission-button.tsx`    | PermissionButton React component for IDE integration              |
| `.velocity/knowledge/pre-build-checklist.md`   | SCAN/ALIGN/PLAN/EXECUTE verification checklist                    |
