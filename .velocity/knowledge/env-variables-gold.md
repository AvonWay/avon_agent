# Environment Variables — Gold Master

> **STATUS**: Canonical. Every Velocity build must document these exact variables.
> **Last Updated**: 2026-02-19

## Required Variables

### Supabase

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server ONLY | Supabase service role key (bypasses RLS) |

### Clerk Auth

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client + Server | Clerk publishable key |
| `CLERK_SECRET_KEY` | Server ONLY | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Client | Sign-in page path (default: `/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Client | Sign-up page path (default: `/sign-up`) |

### Stripe

| Variable | Scope | Description |
|----------|-------|-------------|
| `STRIPE_SECRET_KEY` | Server ONLY | Stripe secret key (starts with `sk_`) |
| `STRIPE_WEBHOOK_SECRET` | Server ONLY | Stripe webhook endpoint secret (starts with `whsec_`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Stripe publishable key (starts with `pk_`) |

### Application

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | Client + Server | Application base URL (e.g., `http://localhost:3000`) |

## .env.local Template

```env
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# === Clerk Auth ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# === Stripe ===
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# === App ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Rules

1. **NEVER** commit `.env.local` — it must be in `.gitignore`.
2. **NEVER** prefix server-only keys with `NEXT_PUBLIC_`.
3. `SUPABASE_SERVICE_ROLE_KEY` must ONLY be used in API routes and server actions.
4. `STRIPE_SECRET_KEY` must ONLY be used in API routes.
5. `CLERK_SECRET_KEY` must ONLY be used in middleware and API routes.
