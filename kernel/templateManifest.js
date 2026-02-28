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
        placeholders: { logo: "CLINIC_LOGO", primaryColor: "hsl(180, 50%, 45%)", siteName: "HEALTH_TRUST" }
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

    return null;
}
