# VELOCITY PROJECT CONSTITUTION (2026)

> **STATUS**: Absolute. This document is the weighted center of gravity for all AI decisions.

## 1. Core Mandates

- **Performance First**: All generated code must pass P99 latency checks. Use PPR (Partial Prerendering) in Next.js.
- **Strict Types**: No `any`. Every interface, prop, and function must have explicit TypeScript types.
- **Component Integrity**: Single-file components preferred unless logical complexity requires decomposition.
- **Aesthetic standard**: Strictly follow the "Velocity Industrial" theme—dark backgrounds (#050505), neon blue highlights (#2563EB), and glassmorphism.

## 2. Technical Stack

- **Framework**: Next.js 15+ (App Router).
- **Styling**: Tailwind CSS v4.
- **Database**: Supabase (PostgreSQL) with RLS.
- **State**: Zustand for client-side, Server Components for data fetching.

## 3. Workflow Patterns

- **Build Protocol**: Architecture -> Parallel Implementation -> Review -> self-Healing.
- **DevOps**: Invisible deployments to Vercel/Edge Nodes.
- **Context Enforcement**: AI must read the `memory/heuristics.md` for historical "gotchas" before starting any task.

## 4. Self-Healing Rules

- If a build fails, the AI MUST analyze the terminal output, identify the specific line of failure, and apply a patch before reporting to the user.


## 5. EXTRACTED VIBE RULES (Auto-Learned)
- Prefer arrow functions for component definitions.
- Enforce strict TypeScript interfaces for all data structures.

- ### DISTILLATION PROTOCOL:

**EXTRACT PATTERNS:**

1. **Styling pattern:** Using a dark-to-light gradient background (bg-gradient-to-br) with a blurred effect (backdrop-blur-md) to create a futuristic and cyberpunk-inspired aesthetic.
2. **Container structure:** Organizing content within a container element (container mx-auto p-4 pt-6) with a centered main section (row justify-center items-center h-screen) containing a single column (col xs-12 sm-8 md-6 lg-4 xl-3).

### ACTIONABLE INSIGHTS:

**ACTION:**

* Apply the bg-gradient-to-br and backdrop-blur-md styling pattern to create a futuristic background for future Velocity projects.
* Use a container structure with a centered main section and single column layout for organizing content in future Velocity projects.

**HEURISTIC:**

* When designing a futuristic or cyberpunk-inspired aesthetic, consider using dark-to-light gradients and blurred effects to create depth and visual interest.

### CONSTRAINTS:

None.

- **ACTION:**
- Use a consistent class naming convention throughout the HTML structure.
- Apply the theme background and text colors to all sections of the dashboard using the same classes.

**HEURISTIC:**
- When designing a dashboard, use a consistent class naming convention for easier maintenance and scalability.

**CONTEXT:**
- This code provides a solid foundation for building a fitness tracker dashboard. By applying a consistent class naming convention and theme management, you can create a visually appealing and user-friendly interface that effectively tracks progress and sets goals.

- **DISTILLATION PROTOCOL OUTPUT**

* **ACTION**: Update the `:root` styles to include a new variable for font color, e.g., `--font-color: #333`.
* **HEURISTIC**: When defining brand colors, use a consistent naming convention (e.g., `dark`, `blue`) and establish a clear hierarchy of colors.
* **CONTEXT**: This matters for the Velocity brand because it ensures consistency in visual identity across all touchpoints, reinforcing the brand's unique tone and style.

- **ACTION:**

* Update all Velocity components to use arrow functions for definition.
* Enforce consistent styling by applying the same background color (`bg-industrial-dark`) and border-radius (`2xl`) to all Velocity containers.

**HEURISTIC:**

* Use arrow functions as the default syntax for defining Velocity components.

**CONTEXT:**
This styling rule is essential for maintaining a consistent visual identity across all Velocity components, ensuring a cohesive brand experience. By applying this heuristic, we can streamline our development process and reduce errors.
