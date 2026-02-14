/**
 * Template Manifest
 * 
 * Pre-configured site blueprints that Avon can "inject" instantly
 * instead of generating from scratch. Each template defines the
 * full stack, folder structure, logic files, and mock data.
 */

export const TEMPLATES = {

    "E-COMMERCE_CORE": {
        name: "E-Commerce Core",
        stack: ["Next.js 15", "Tailwind CSS", "Shadcn UI", "Zustand", "Stripe"],
        description: "Full e-commerce site with cart, checkout, and product grid.",
        structure: [
            "src/app/layout.tsx",
            "src/app/page.tsx",
            "src/app/products/page.tsx",
            "src/app/products/[id]/page.tsx",
            "src/app/cart/page.tsx",
            "src/app/checkout/page.tsx",
            "src/app/api/stripe-webhook/route.ts",
            "src/components/ui/button.tsx",
            "src/components/ui/card.tsx",
            "src/components/ui/badge.tsx",
            "src/components/ui/input.tsx",
            "src/components/ui/sheet.tsx",
            "src/components/product-grid.tsx",
            "src/components/product-card.tsx",
            "src/components/cart-sidebar.tsx",
            "src/components/navbar.tsx",
            "src/components/footer.tsx",
            "src/components/hero-banner.tsx",
            "src/store/cart-store.ts",
            "src/lib/utils.ts",
            "src/lib/stripe.ts",
            "src/data/mock-products.json",
            "tailwind.config.ts",
            "next.config.js",
            "package.json"
        ],
        placeholders: {
            logo: "BRAND_LOGO",
            primaryColor: "hsl(262, 83%, 58%)",
            secondaryColor: "hsl(220, 14%, 96%)",
            siteName: "BRAND_NAME"
        }
    },

    "REAL_ESTATE_CORE": {
        name: "Real Estate Core",
        stack: ["Next.js 15", "Tailwind CSS", "Leaflet/Mapbox", "Framer Motion", "Supabase"],
        description: "Real estate listing site with map, filters, and agent contact.",
        structure: [
            "src/app/layout.tsx",
            "src/app/page.tsx",
            "src/app/listings/page.tsx",
            "src/app/listings/[id]/page.tsx",
            "src/app/agents/page.tsx",
            "src/app/contact/page.tsx",
            "src/components/ui/button.tsx",
            "src/components/ui/card.tsx",
            "src/components/ui/input.tsx",
            "src/components/ui/select.tsx",
            "src/components/ui/slider.tsx",
            "src/components/listing-card.tsx",
            "src/components/listing-grid.tsx",
            "src/components/map-view.tsx",
            "src/components/filter-bar.tsx",
            "src/components/agent-contact-form.tsx",
            "src/components/navbar.tsx",
            "src/components/footer.tsx",
            "src/components/hero-search.tsx",
            "src/components/image-gallery.tsx",
            "src/lib/filter-engine.js",
            "src/lib/utils.ts",
            "src/lib/supabase.ts",
            "src/data/mock-listings.json",
            "supabase/listings-db.sql",
            "tailwind.config.ts",
            "next.config.js",
            "package.json"
        ],
        placeholders: {
            logo: "BRAND_LOGO",
            primaryColor: "hsl(210, 100%, 45%)",
            secondaryColor: "hsl(45, 93%, 58%)",
            siteName: "BRAND_NAME"
        }
    }
};

/**
 * Detect which template to inject based on user input keywords.
 */
export function detectTemplate(userPrompt) {
    const lower = userPrompt.toLowerCase();

    if (lower.includes("e-commerce") || lower.includes("ecommerce") || lower.includes("store") || lower.includes("shop")) {
        return TEMPLATES["E-COMMERCE_CORE"];
    }

    if (lower.includes("real estate") || lower.includes("realestate") || lower.includes("property") || lower.includes("listing")) {
        return TEMPLATES["REAL_ESTATE_CORE"];
    }

    return null; // No template detected — fall back to generative mode
}
