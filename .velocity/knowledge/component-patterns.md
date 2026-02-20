# Velocity Build Architecture — Component Patterns

> **STATUS**: Canonical reference for all component patterns.
> **Last Updated**: 2026-02-19

## Component Hierarchy

```text
src/
├── app/
│   ├── (auth)/                    # Auth group route
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   └── layout.tsx
│   ├── dashboard/
│   │   ├── page.tsx               # PPR Dashboard (static shell + streamed data)
│   │   └── layout.tsx             # Dashboard shell with sidebar
│   ├── shop/
│   │   ├── page.tsx               # Product grid (Server Component)
│   │   └── [slug]/page.tsx        # Product detail
│   ├── api/
│   │   ├── checkout/route.ts      # Stripe Checkout Session (Edge runtime)
│   │   └── webhooks/stripe/route.ts  # Stripe webhook handler
│   ├── layout.tsx                 # Root layout (Clerk provider)
│   ├── page.tsx                   # Landing page
│   └── globals.css
├── components/
│   ├── blocks/                    # Marketing/landing page blocks
│   │   ├── hero-section.tsx
│   │   ├── pricing-section.tsx
│   │   └── features-section.tsx
│   ├── layout/                    # Structural components
│   │   ├── site-header.tsx
│   │   ├── site-footer.tsx
│   │   └── sidebar-nav.tsx
│   ├── shop/                      # Shop-specific components
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── cart-sheet.tsx
│   │   └── checkout-button.tsx
│   ├── dashboard/                 # Dashboard-specific components
│   │   ├── stats-grid.tsx         # KPI stat grid (async Server Component)
│   │   ├── recent-sales.tsx       # Recent sales table (async Server Component)
│   │   ├── revenue-chart.tsx      # Recharts revenue chart
│   │   ├── orders-table.tsx       # Shadcn Data Table
│   │   └── recent-activity.tsx    # Activity feed
│   └── ui/                        # Shadcn/UI primitives (auto-generated)
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   └── server.ts              # Server Component client
│   ├── stripe.ts                  # Stripe SDK init
│   └── utils.ts                   # cn() helper
└── store/
    └── cart-store.ts              # Zustand cart state
```

---

## ⚡ Pattern: PPR Dashboard (Gold Master)

The dashboard uses **Partial Prerendering** — the static shell renders instantly from the edge, while async components stream in through `<Suspense>` boundaries.

```typescript
// app/dashboard/page.tsx — GOLD MASTER REFERENCE
import { Suspense } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import StatsGrid from "@/components/dashboard/stats-grid";
import RecentSales from "@/components/dashboard/recent-sales";

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* STATIC SHELL: Renders instantly from edge cache (PPR) */}
      <h1 className="text-3xl font-bold tracking-tight">Velocity Dashboard</h1>
      
      {/* DYNAMIC HOLE: Streams in after Supabase data fetch */}
      <Suspense fallback={<DashboardSkeleton />}>
        <StatsGrid /> 
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* DYNAMIC HOLE: Streams in after orders query */}
        <Suspense fallback={<Skeleton className="h-[400px] col-span-4" />}>
          <RecentSales className="col-span-4" />
        </Suspense>
        
        {/* STATIC SHELL: Renders with initial page load */}
        <div className="col-span-3 border p-4 rounded-xl bg-card">
          <h2 className="font-semibold mb-4">Stripe Revenue</h2>
          <p className="text-2xl font-mono">$12,450.00</p>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}
```

### Key Rules

- Every async data-fetching component must be wrapped in `<Suspense>`.
- Every `<Suspense>` fallback must use `<Skeleton>` components, never spinners or empty divs.
- Static content (headings, labels, layout chrome) sits OUTSIDE Suspense boundaries.
- PPR splits these automatically at build time — no manual `dynamic` exports needed.

---

## Pattern: Server Component Data Fetching

```typescript
// app/dashboard/page.tsx
import { createServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return <OrdersTable orders={orders ?? []} />;
}
```

---

## Pattern: Zustand Cart Store

```typescript
// store/cart-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalCents: () => number;
  itemCount: () => number;
}
```

---

## ⚡ Pattern: Stripe Checkout Route — Edge Runtime (Gold Master)

```typescript
// app/api/checkout/route.ts — GOLD MASTER REFERENCE
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'edge'; // THE COMPETITIVE ADVANTAGE: No cold starts

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/pricing`,
      metadata: { userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

### Key Rules

- Checkout route uses `export const runtime = 'edge'` for zero cold starts.
- Stripe API version is pinned to `'2025-01-27.acacia'`.
- Mode is `'subscription'` by default (not `'payment'`).
- Success URL redirects to `/dashboard` with `session_id` for verification.
- Cancel URL redirects to `/pricing` for retry.
- `userId` is passed as metadata for webhook fulfillment.

---

## Pattern: Stripe Webhook (Node Runtime)

```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Webhooks MUST use Node runtime (needs raw body access for signature verification)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  switch (event.type) {
    case "checkout.session.completed":
      // Fulfill order in Supabase
      break;
    case "payment_intent.succeeded":
      // Update order status
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## Pattern: Dashboard Stats Card Interface

```typescript
// components/dashboard/stats-cards.tsx
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}
```

---

## IMPORTANT: Anti-Patterns to AVOID

1. ❌ `// TODO: add logic here` — Every function must be complete.
2. ❌ Client-side Supabase in Server Components — Use `createServerClient`.
3. ❌ Storing Stripe secrets in `NEXT_PUBLIC_` vars — Server-only.
4. ❌ Using spinners or empty divs as Suspense fallbacks — Use `<Skeleton>` components.
5. ❌ Un-typed Supabase responses — Always use generated types or explicit interfaces.
6. ❌ Using `export const dynamic = 'force-dynamic'` — Let PPR handle static/dynamic splitting.
7. ❌ Missing `<Suspense>` around async components — Every async component needs a boundary.
8. ❌ Hardcoded Stripe API versions — Always pin to `'2025-01-27.acacia'`.
