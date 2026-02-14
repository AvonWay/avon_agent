# Avon Velocity Modern Starter (2026 Edition)

This is a modern, high-performance starter template for **Apache Velocity (VTL)** environments, incorporating **Vite**, **Tailwind CSS**, and **Biome**.

## Features

- **⚡ Vite Integration**: Manage your CSS and assets with a modern bundler.
- **🎨 Tailwind CSS**: Utility-first CSS framework configured with a **Shadcn/UI**-inspired design system.
- **🛠️ Biome**: Blazing fast linting and formatting (replaces ESLint + Prettier).
- **🧩 Modular Macros**: Pre-built Velocity macros (`#macro`) for common UI patterns (Cards, Buttons, Badges).
- **🚀 Performance**: Optimized for fast load times with critical CSS extraction and lazy loading utilities.

## Directory Structure

```
avon-velocity-frontend/
├── src/
│   ├── macros/          # Reusable VTL Macros
│   │   ├── core.vm      # Utility functions (lazyImg, csrfToken)
│   │   └── ui.vm        # UI Components (Button, Card, Badge)
│   ├── templates/       # Page templates
│   │   ├── layout.vm    # Master layout with Vite integration logic
│   │   └── index.vm     # Example page using macros
│   └── styles/          # CSS source files
│       └── main.css     # Tailwind entry point
├── package.json         # NPM dependencies
├── biome.json           # Linter configuration
├── tailwind.config.js   # Tailwind configuration
└── vite.config.js       # Build configuration
```

## Getting Started

1. **Install Dependencies**:

    ```bash
    npm install
    ```

2. **Start Development Server**:

    ```bash
    npm run dev
    ```

    This will start Vite. Your Velocity environment (e.g., Java backend) should point to `http://localhost:5173` for assets when `environment == "development"`.

3. **Build for Production**:

    ```bash
    npm run build
    ```

    This generates optimized assets in `dist/` for deployment.

4. **Lint & Format**:

    ```bash
    npm run lint
    npm run format
    ```

## Integration Guide

To use these templates in your backend (Java/Spring/dotCMS):

1. **Macro Import**: Ensure your `velocity.properties` loads the macro libraries:

    ```properties
    velocimacro.library = src/macros/core.vm, src/macros/ui.vm
    ```

2. **Asset Injection**: Update your base layout to conditionally include Vite's client or the built CSS file (see `src/templates/layout.vm` for an example).

## AI-First Development

Use this structure to organize AI-generated code. When asking an AI (like GitHub Copilot or v0.dev) for components, request "Tailwind HTML" and wrap it in a `#macro` inside `src/macros/` for reuse.
