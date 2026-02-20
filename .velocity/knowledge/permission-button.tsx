"use client";

import { useState } from "react";

interface BuildPlanComponent {
    name: string;
    path: string;
    type: "page" | "api" | "component" | "lib" | "store" | "config";
    status: "pending" | "approved" | "building" | "complete";
    description: string;
    dependencies: string[];
}

interface BuildPlan {
    projectName: string;
    version: string;
    framework: string;
    timestamp: string;
    components: BuildPlanComponent[];
    supabaseTables: string[];
    envVariables: string[];
    estimatedFiles: number;
}

interface PermissionButtonProps {
    buildPlan: BuildPlan;
    onApprove: () => void;
    onReject?: () => void;
}

export function PermissionButton({
    buildPlan,
    onApprove,
    onReject,
}: PermissionButtonProps) {
    const [isReviewing, setIsReviewing] = useState(false);
    const [isApproved, setIsApproved] = useState(false);

    const handleApprove = () => {
        setIsApproved(true);
        onApprove();
    };

    const typeIcons: Record<BuildPlanComponent["type"], string> = {
        page: "📄",
        api: "⚡",
        component: "🧩",
        lib: "📚",
        store: "🗄️",
        config: "⚙️",
    };

    const typeColors: Record<BuildPlanComponent["type"], string> = {
        page: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        api: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        component: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        lib: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        store: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        config: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    };

    if (isApproved) {
        return (
            <div className="p-6 border-2 border-green-500/50 rounded-2xl bg-green-950/20 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-xl">✅</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-green-400">
                            Build Permission Granted
                        </h3>
                        <p className="text-sm text-green-400/70">
                            Avon is generating {buildPlan.estimatedFiles} files...
                        </p>
                    </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-green-900/50 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full animate-pulse w-3/4" />
                </div>
            </div>
        );
    }

    return (
        <div className="border-2 border-primary/30 rounded-2xl bg-background/50 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <span className="text-2xl">🏗️</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight">
                            Avon is Ready to Build
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {buildPlan.framework} •{" "}
                            {buildPlan.estimatedFiles} files •{" "}
                            {buildPlan.supabaseTables.length} tables •{" "}
                            {buildPlan.envVariables.length} env vars
                        </p>
                    </div>
                </div>
            </div>

            {/* Collapsible Plan Review */}
            {isReviewing && (
                <div className="p-6 border-b border-border/50 max-h-[400px] overflow-y-auto">
                    <div className="space-y-4">
                        {/* Components List */}
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Components ({buildPlan.components.length})
                            </h4>
                            <div className="grid gap-2">
                                {buildPlan.components.map((component, index) => (
                                    <div
                                        key={`${component.path}-${index}`}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <span className="text-base flex-shrink-0">
                                            {typeIcons[component.type]}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {component.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-mono truncate">
                                                {component.path}
                                            </p>
                                        </div>
                                        <span
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeColors[component.type]}`}
                                        >
                                            {component.type.toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Supabase Tables */}
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Supabase Tables
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {buildPlan.supabaseTables.map((table) => (
                                    <span
                                        key={table}
                                        className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    >
                                        {table}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Env Variables */}
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Required Environment Variables
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {buildPlan.envVariables.map((envVar) => (
                                    <span
                                        key={envVar}
                                        className="text-xs font-mono px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    >
                                        {envVar}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="p-6 flex items-center gap-3">
                <button
                    onClick={() => setIsReviewing(!isReviewing)}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-5 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                    {isReviewing ? "Hide Plan" : "📋 Review Plan"}
                </button>
                {onReject && (
                    <button
                        onClick={onReject}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-5 border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        ✕ Reject
                    </button>
                )}
                <button
                    onClick={handleApprove}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold h-10 px-6 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25 transition-all hover:shadow-green-600/40 ml-auto"
                >
                    ✅ Grant Build Permission
                </button>
            </div>
        </div>
    );
}

/**
 * Generates a default Velocity build plan.
 * This function is called during the PLAN phase of the Executive Protocol.
 */
export function generateDefaultBuildPlan(
    projectName: string
): BuildPlan {
    return {
        projectName,
        version: "2.0.0",
        framework: "Next.js 15 + Shadcn/UI + Tailwind v4",
        timestamp: new Date().toISOString(),
        estimatedFiles: 32,
        supabaseTables: [
            "profiles",
            "workspaces",
            "products",
            "orders",
            "order_items",
            "sites",
            "analytics_events",
        ],
        envVariables: [
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
            "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
            "CLERK_SECRET_KEY",
            "STRIPE_SECRET_KEY",
            "STRIPE_WEBHOOK_SECRET",
            "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
            "NEXT_PUBLIC_APP_URL",
        ],
        components: [
            {
                name: "Landing Page",
                path: "src/app/page.tsx",
                type: "page",
                status: "pending",
                description: "Hero + Features + Pricing marketing page",
                dependencies: ["hero-section", "features-section", "pricing-section"],
            },
            {
                name: "Dashboard",
                path: "src/app/dashboard/page.tsx",
                type: "page",
                status: "pending",
                description:
                    "Admin panel with stats cards, revenue chart, and orders table",
                dependencies: [
                    "stats-cards",
                    "revenue-chart",
                    "orders-table",
                    "supabase-server",
                ],
            },
            {
                name: "Dashboard Layout",
                path: "src/app/dashboard/layout.tsx",
                type: "page",
                status: "pending",
                description: "Dashboard shell with sidebar navigation",
                dependencies: ["sidebar-nav"],
            },
            {
                name: "Shop",
                path: "src/app/shop/page.tsx",
                type: "page",
                status: "pending",
                description:
                    "Product grid with filters, fetched from Supabase via Server Components",
                dependencies: [
                    "product-grid",
                    "product-card",
                    "cart-sheet",
                    "supabase-server",
                ],
            },
            {
                name: "Sign In",
                path: "src/app/(auth)/sign-in/[[...sign-in]]/page.tsx",
                type: "page",
                status: "pending",
                description: "Clerk-powered sign-in page",
                dependencies: ["@clerk/nextjs"],
            },
            {
                name: "Sign Up",
                path: "src/app/(auth)/sign-up/[[...sign-up]]/page.tsx",
                type: "page",
                status: "pending",
                description: "Clerk-powered sign-up page",
                dependencies: ["@clerk/nextjs"],
            },
            {
                name: "Checkout API",
                path: "src/app/api/checkout/route.ts",
                type: "api",
                status: "pending",
                description:
                    "Creates Stripe Checkout Sessions from cart items",
                dependencies: ["stripe", "supabase-server"],
            },
            {
                name: "Stripe Webhook",
                path: "src/app/api/webhooks/stripe/route.ts",
                type: "api",
                status: "pending",
                description:
                    "Handles Stripe events: checkout.session.completed, payment_intent.succeeded",
                dependencies: ["stripe", "supabase-admin"],
            },
            {
                name: "Hero Section",
                path: "src/components/blocks/hero-section.tsx",
                type: "component",
                status: "pending",
                description: "Animated gradient hero with CTA buttons",
                dependencies: [],
            },
            {
                name: "Pricing Section",
                path: "src/components/blocks/pricing-section.tsx",
                type: "component",
                status: "pending",
                description: "3-tier pricing cards (Free, Pro, Industrial)",
                dependencies: [],
            },
            {
                name: "Features Section",
                path: "src/components/blocks/features-section.tsx",
                type: "component",
                status: "pending",
                description: "Icon grid with feature descriptions",
                dependencies: ["lucide-react"],
            },
            {
                name: "Site Header",
                path: "src/components/layout/site-header.tsx",
                type: "component",
                status: "pending",
                description: "Responsive nav with Clerk UserButton and cart badge",
                dependencies: ["@clerk/nextjs", "cart-store"],
            },
            {
                name: "Site Footer",
                path: "src/components/layout/site-footer.tsx",
                type: "component",
                status: "pending",
                description: "Footer with links and branding",
                dependencies: [],
            },
            {
                name: "Sidebar Nav",
                path: "src/components/layout/sidebar-nav.tsx",
                type: "component",
                status: "pending",
                description: "Dashboard sidebar with navigation links",
                dependencies: ["lucide-react"],
            },
            {
                name: "Product Card",
                path: "src/components/shop/product-card.tsx",
                type: "component",
                status: "pending",
                description: "Product display card with image, price, and add-to-cart button",
                dependencies: ["cart-store"],
            },
            {
                name: "Cart Sheet",
                path: "src/components/shop/cart-sheet.tsx",
                type: "component",
                status: "pending",
                description: "Slide-out cart drawer with item list, quantity controls, and checkout CTA",
                dependencies: ["cart-store", "shadcn-sheet"],
            },
            {
                name: "Stats Cards",
                path: "src/components/dashboard/stats-cards.tsx",
                type: "component",
                status: "pending",
                description:
                    "KPI cards: Revenue, Users, Conversion Rate, Avg. Order Value",
                dependencies: ["lucide-react"],
            },
            {
                name: "Revenue Chart",
                path: "src/components/dashboard/revenue-chart.tsx",
                type: "component",
                status: "pending",
                description: "Recharts area/bar chart for revenue over time",
                dependencies: ["recharts", "shadcn-chart"],
            },
            {
                name: "Orders Table",
                path: "src/components/dashboard/orders-table.tsx",
                type: "component",
                status: "pending",
                description: "Shadcn Data Table with sorting, filtering, and pagination",
                dependencies: ["shadcn-table"],
            },
            {
                name: "Supabase Browser Client",
                path: "src/lib/supabase/client.ts",
                type: "lib",
                status: "pending",
                description: "createBrowserClient for client components",
                dependencies: ["@supabase/ssr"],
            },
            {
                name: "Supabase Server Client",
                path: "src/lib/supabase/server.ts",
                type: "lib",
                status: "pending",
                description: "createServerClient for Server Components and API routes",
                dependencies: ["@supabase/ssr"],
            },
            {
                name: "Stripe SDK",
                path: "src/lib/stripe.ts",
                type: "lib",
                status: "pending",
                description: "Server-side Stripe SDK initialization",
                dependencies: ["stripe"],
            },
            {
                name: "Cart Store",
                path: "src/store/cart-store.ts",
                type: "store",
                status: "pending",
                description:
                    "Zustand store with persist middleware for cart state",
                dependencies: ["zustand"],
            },
            {
                name: "Biome Config",
                path: "biome.json",
                type: "config",
                status: "pending",
                description: "Biome linter/formatter with recommended rules",
                dependencies: [],
            },
            {
                name: "Middleware",
                path: "src/middleware.ts",
                type: "config",
                status: "pending",
                description: "Clerk auth middleware protecting /dashboard routes",
                dependencies: ["@clerk/nextjs"],
            },
        ],
    };
}
