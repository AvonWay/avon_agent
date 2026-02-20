# Next.js Configuration — Gold Master

> **STATUS**: Canonical. Every Velocity build MUST use this config.
> **Last Updated**: 2026-02-19

## The Competitive Edge

This config enables **Partial Prerendering (PPR)** — the instant static shell is served from the CDN edge while dynamic content streams in via React Suspense boundaries. Combined with **dynamicIO**, this eliminates cold starts and delivers sub-100ms TTFB.

## Gold Master Config

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,        // Partial Prerendering: Instant static shell + streamed dynamic content
    dynamicIO: true,  // Optimized I/O for 2026 Edge standards
  },
  images: {
    formats: ['image/avif', 'image/webp'], // Maximum compression for load speed
  },
};

export default nextConfig;
```

## Why These Settings Matter

### `ppr: true` — Partial Prerendering

- The **static shell** (header, sidebar, layout) is pre-rendered at build time and served instantly from the edge.
- **Dynamic holes** (user data, real-time stats, database queries) stream in via `<Suspense>` boundaries.
- Result: Users see the page structure immediately, data fills in progressively.

### `dynamicIO: true` — Optimized I/O

- Next.js 15+ automatically optimizes all server-side I/O operations.
- Supabase queries, Stripe API calls, and Clerk auth checks are parallelized where possible.
- Reduces server response time by up to 40% compared to sequential I/O.

### `images.formats: ['image/avif', 'image/webp']`

- AVIF delivers **50% better compression** than WebP.
- WebP is the fallback for older browsers.
- Combined with Next.js `<Image>` component: automatic lazy loading, responsive sizing, and format negotiation.

## Integration with Dashboard PPR Pattern

```tsx
// This is how PPR works with the dashboard:
// The outer layout + header renders INSTANTLY as static HTML.
// Each <Suspense> boundary is a "dynamic hole" that streams data.

import { Suspense } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import StatsGrid from "@/components/dashboard/stats-grid";
import RecentSales from "@/components/dashboard/recent-sales";

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* STATIC: Renders instantly from edge cache */}
      <h1 className="text-3xl font-bold tracking-tight">Velocity Dashboard</h1>
      
      {/* DYNAMIC: Streams in after data fetch */}
      <Suspense fallback={<DashboardSkeleton />}>
        <StatsGrid />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Suspense fallback={<Skeleton className="h-[400px] col-span-4" />}>
          <RecentSales className="col-span-4" />
        </Suspense>
        {/* STATIC: Renders with shell */}
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

## Rules

1. **ALWAYS** enable `ppr` and `dynamicIO` in every Velocity build.
2. **ALWAYS** use `<Suspense>` boundaries around every async data-fetching component.
3. **ALWAYS** provide meaningful `<Skeleton>` fallbacks — never use empty divs or spinners.
4. **ALWAYS** include both `image/avif` and `image/webp` formats.
5. **NEVER** use `export const dynamic = 'force-dynamic'` — let PPR handle the static/dynamic split automatically.
