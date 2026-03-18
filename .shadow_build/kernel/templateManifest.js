/**
 * Template Manifest
 * 
 * Pre-configured site blueprints that Avon can "inject" instantly
 * instead of generating from scratch. Each template defines the
 * full stack, folder structure, logic files, and mock data.
 */

export const TEMPLATES = {

    "FITNESS_CORE": {
        name: "Fitness Core",
        stack: ["Next.js 15", "Tailwind CSS", "Framer Motion", "Stripe"],
        description: "High-energy fitness & personal training site.",
        structure: ["src/app/page.tsx", "src/components/training-plans.tsx", "src/components/booking-calendar.tsx"],
        placeholders: { logo: "GYM_LOGO", primaryColor: "hsl(0, 100%, 50%)", siteName: "TRAIN_VIBE" }
    },

    "LAW_FIRM_CORE": {
        name: "Law Firm Core",
        stack: ["Next.js 15", "Vanilla CSS", "Google Fonts"],
        description: "Professional, trust-focused legal services hub.",
        structure: ["src/app/page.tsx", "src/components/practice-areas.tsx", "src/components/attorney-profiles.tsx"],
        placeholders: { logo: "LAW_LOGO", primaryColor: "hsl(210, 20%, 20%)", siteName: "LEGAL_PRECISION" }
    },

    "PHOTOGRAPHY_CORE": {
        name: "Photography Hub",
        stack: ["Next.js 15", "Tailwind CSS", "Framer Motion"],
        description: "Visual-first portfolio for creators.",
        structure: ["src/app/page.tsx", "src/components/gallery-grid.tsx", "src/components/lightbox.tsx"],
        placeholders: { logo: "STUDIO_LOGO", primaryColor: "hsl(0, 0%, 100%)", siteName: "VISUAL_STORY" }
    },

    "FINTECH_CORE": {
        name: "Fintech Hub",
        stack: ["Next.js 15", "Tailwind CSS", "Lucide React", "Chart.js"],
        description: "Data-driven financial technology landing page.",
        structure: ["src/app/page.tsx", "src/components/stats-dashboard.tsx", "src/components/security-badge.tsx"],
        placeholders: { logo: "FIN_LOGO", primaryColor: "hsl(150, 60%, 40%)", siteName: "SECURE_FIN" }
    },

    "SAAS_LANDING_CORE": {
        name: "SaaS Premium",
        stack: ["Next.js 15", "Tailwind CSS v4", "Zustand"],
        description: "Conversion-optimized SaaS landing page.",
        structure: ["src/app/page.tsx", "src/components/pricing-table.tsx", "src/components/testimonials.tsx"],
        placeholders: { logo: "SAAS_LOGO", primaryColor: "hsl(230, 80%, 60%)", siteName: "SAAS_VIBE" }
    },

    "RESTAURANT_CORE": {
        name: "Gourmet Hub",
        stack: ["HTML5", "Vanilla JS", "Tailwind"],
        description: "Elegant restaurant menu and reservation site.",
        structure: ["index.html", "menu.html", "reservations.js"],
        placeholders: { logo: "CHEF_LOGO", primaryColor: "hsl(30, 60%, 40%)", siteName: "GOURMET_EXCELLENCE" }
    },

    "BLOG_CORE": {
        name: "Content Engine",
        stack: ["Next.js 15", "MDX", "Tailwind"],
        description: "High-performance personal or company blog.",
        structure: ["src/app/page.tsx", "src/app/posts/[slug]/page.tsx", "src/components/newsletter.tsx"],
        placeholders: { logo: "BLOG_LOGO", primaryColor: "hsl(200, 10%, 20%)", siteName: "THOUGHT_LEADERSHIP" }
    },

    "CLINIC_CORE": {
        name: "Medical Pro",
        stack: ["Next.js 15", "Tailwind", "Supabase"],
        description: "Trust-focused clinic or dental landing page.",
        structure: ["src/app/page.tsx", "src/components/appointment-form.tsx", "src/components/service-list.tsx"],
        placeholders: { logo: "HEALTH_TRUST", primaryColor: "hsl(180, 50%, 45%)", siteName: "HEALTH_TRUST" }
    },

    "BETTING_CORE": {
        name: "Elite Betting Hub",
        stack: ["Next.js 15", "Tailwind CSS", "Framer Motion", "Zustand", "Lucide React"],
        description: "High-performance, real-time sports betting and odds dashboard.",
        structure: [
            "src/app/page.tsx",
            "src/components/odds-feed.tsx",
            "src/components/bet-slip.tsx",
            "src/components/user-balance.tsx",
            "src/components/live-event-card.tsx",
            "src/hooks/use-odds-simulation.ts"
        ],
        placeholders: { 
            logo: "VELOCITY_BET", 
            primaryColor: "hsl(142, 70%, 50%)", 
            siteName: "ELITE_WAGER" 
        }
    },
    
    "REAL_ESTATE_CORE": {
        name: "Industrial Real Estate",
        stack: ["Next.js 15", "Tailwind CSS", "Leaflet", "Framer Motion"],
        description: "Comprehensive property listing platform with interactive maps.",
        structure: [
            "src/app/page.tsx",
            "src/components/listing-grid.tsx",
            "src/components/property-map.tsx",
            "src/components/filter-sidebar.tsx",
            "src/components/agent-contact.tsx"
        ],
        placeholders: { logo: "ESTATE_LOGO", primaryColor: "hsl(220, 15%, 25%)", siteName: "PRIME_LISTINGS" }
    },

    "E_COMMERCE_CORE": {
        name: "Velocity Storefront",
        stack: ["Next.js 15", "Tailwind CSS", "Zustand", "Stripe"],
        description: "High-conversion e-commerce platform with real-time cart.",
        structure: [
            "src/app/page.tsx",
            "src/components/product-grid.tsx",
            "src/components/cart-drawer.tsx",
            "src/components/checkout-form.tsx",
            "src/store/cart-store.ts"
        ],
        placeholders: { logo: "STORE_LOGO", primaryColor: "hsl(340, 80%, 55%)", siteName: "VELOCITY_SHOP" }
    }
};

/**
 * Detect which template to inject based on user input keywords.
 */
export function detectTemplate(userPrompt) {
    const lower = userPrompt.toLowerCase();

    if (lower.includes("fitness") || lower.includes("gym") || lower.includes("trainer")) {
        return TEMPLATES["FITNESS_CORE"];
    }
    if (lower.includes("bet") || lower.includes("wager") || lower.includes("odds") || lower.includes("gambling") || lower.includes("sportsbook")) {
        return TEMPLATES["BETTING_CORE"];
    }
    if (lower.includes("law") || lower.includes("legal") || lower.includes("attorney")) {
        return TEMPLATES["LAW_FIRM_CORE"];
    }
    if (lower.includes("photo") || lower.includes("portfolio") || lower.includes("creative")) {
        return TEMPLATES["PHOTOGRAPHY_CORE"];
    }
    if (lower.includes("finance") || lower.includes("bank") || lower.includes("fintech")) {
        return TEMPLATES["FINTECH_CORE"];
    }
    if (lower.includes("saas") || lower.includes("startup") || lower.includes("software")) {
        return TEMPLATES["SAAS_LANDING_CORE"];
    }
    if (lower.includes("eat") || lower.includes("restaurant") || lower.includes("food") || lower.includes("cafe")) {
        return TEMPLATES["RESTAURANT_CORE"];
    }
    if (lower.includes("blog") || lower.includes("article") || lower.includes("content")) {
        return TEMPLATES["BLOG_CORE"];
    }
    if (lower.includes("medical") || lower.includes("clinic") || lower.includes("doctor") || lower.includes("health")) {
        return TEMPLATES["CLINIC_CORE"];
    }
    if (lower.includes("real estate") || lower.includes("property") || lower.includes("listing")) {
        return TEMPLATES["REAL_ESTATE_CORE"];
    }
    if (lower.includes("shop") || lower.includes("store") || lower.includes("ecommerce") || lower.includes("buy") || lower.includes("product")) {
        return TEMPLATES["E_COMMERCE_CORE"];
    }

    return null;
}

