/**
 * Boilerplate Registry
 * 
 * Pre-approved starter templates that Avon clones instead of generating from scratch.
 * Each entry defines the repo, stack, and what the AI is/isn't allowed to touch.
 */

export const BOILERPLATES = {

    "next_saas": {
        name: "Next.js SaaS Starter",
        repo: "https://github.com/kleneway/next-ai-starter",
        stack: ["Next.js 15", "TypeScript", "tRPC", "Prisma", "NextAuth", "Supabase", "Tailwind CSS"],
        description: "Full-stack SaaS boilerplate with auth, DB, and API layer pre-configured.",
        allowedDirs: [
            "src/app/",
            "src/components/",
            "src/lib/",
            "src/hooks/",
            "src/utils/",
            "prisma/migrations/",
            "public/"
        ],
        protectedFiles: [
            "next.config.js",
            "tsconfig.json",
            ".eslintrc.js",
            ".env",
            ".env.local",
            "src/lib/auth.ts",
            "src/lib/prisma.ts",
            "src/middleware.ts",
            "package.json",
            "tailwind.config.ts",
            "postcss.config.js"
        ],
        protectedPatterns: [
            "*.config.*",
            ".env*",
            "LICENSE*",
            "docker-compose*"
        ]
    },

    "fastapi_api": {
        name: "FastAPI REST API",
        repo: "https://github.com/kodu-ai/starters",
        stack: ["Python 3.12", "FastAPI", "SQLAlchemy", "Alembic", "Pydantic"],
        description: "Production-ready REST API boilerplate with migrations and validation.",
        allowedDirs: [
            "app/api/routes/",
            "app/models/",
            "app/schemas/",
            "app/services/",
            "app/utils/",
            "alembic/versions/",
            "tests/"
        ],
        protectedFiles: [
            "app/core/config.py",
            "app/core/security.py",
            "app/db/session.py",
            "alembic.ini",
            "pyproject.toml",
            ".env"
        ],
        protectedPatterns: [
            "*.ini",
            ".env*",
            "LICENSE*",
            "Dockerfile*"
        ]
    },

    "vite_react": {
        name: "Vite React Starter",
        repo: "https://github.com/kodu-ai/starters",
        stack: ["React 19", "TypeScript", "Vite", "Tailwind CSS", "React Router"],
        description: "Lightweight React SPA with modern tooling.",
        allowedDirs: [
            "src/components/",
            "src/pages/",
            "src/hooks/",
            "src/utils/",
            "src/styles/",
            "src/assets/",
            "public/"
        ],
        protectedFiles: [
            "vite.config.ts",
            "tsconfig.json",
            "index.html",
            "package.json",
            "tailwind.config.js",
            ".eslintrc.cjs"
        ],
        protectedPatterns: [
            "*.config.*",
            ".env*",
            "LICENSE*"
        ]
    },

    "node_api": {
        name: "Node.js REST API",
        repo: "https://opensourceboilerplates.com",
        stack: ["Node.js", "Express", "Prisma", "JWT Auth", "Zod"],
        description: "Secure Node.js API with validation, auth, and ORM.",
        allowedDirs: [
            "src/routes/",
            "src/controllers/",
            "src/services/",
            "src/models/",
            "src/middleware/",
            "src/utils/",
            "prisma/migrations/",
            "tests/"
        ],
        protectedFiles: [
            "src/config/index.js",
            "src/middleware/auth.js",
            "src/lib/db.js",
            "package.json",
            ".env",
            "tsconfig.json"
        ],
        protectedPatterns: [
            "*.config.*",
            ".env*",
            "LICENSE*"
        ]
    }
};

/**
 * Look up a boilerplate by key or by keyword matching.
 */
export function findBoilerplate(query) {
    const lower = query.toLowerCase();

    // Direct key match
    if (BOILERPLATES[lower]) return BOILERPLATES[lower];

    // Keyword matching
    if (lower.includes("saas") || lower.includes("next")) return BOILERPLATES["next_saas"];
    if (lower.includes("fastapi") || lower.includes("python")) return BOILERPLATES["fastapi_api"];
    if (lower.includes("vite") || lower.includes("react") || lower.includes("spa")) return BOILERPLATES["vite_react"];
    if (lower.includes("node") || lower.includes("express") || lower.includes("api")) return BOILERPLATES["node_api"];

    return null;
}

/**
 * Check if a file path is protected by the boilerplate's guardrails.
 */
export function isProtected(filePath, boilerplate) {
    // Check exact protected files
    if (boilerplate.protectedFiles.some(f => filePath.endsWith(f))) {
        return true;
    }

    // Check protected patterns (simple glob matching)
    for (const pattern of boilerplate.protectedPatterns) {
        const regex = new RegExp(
            "^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$"
        );
        const fileName = filePath.split("/").pop();
        if (regex.test(fileName)) return true;
    }

    return false;
}

/**
 * Check if a file path is within the allowed directories.
 */
export function isAllowedDir(filePath, boilerplate) {
    return boilerplate.allowedDirs.some(dir => filePath.startsWith(dir));
}
