import { findBoilerplate, isProtected, isAllowedDir } from "./boilerplateRegistry.js";
import { buildMegaPrompt, buildModulePrompt } from "./megaPrompt.js";
import { runModel } from "./modelRouter.js";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";

/**
 * Safe Lane Pipeline
 * 
 * Workflow:
 * 1. Pick base template from pre-approved list
 * 2. Read context (README + repo tree)
 * 3. Apply one-shot mega-prompt with guardrails
 * 4. Validate output against guardrails
 * 5. Emit patch-style output for review
 */

export async function safeLaneBuild({ templateKey, feature, targetDir }) {
    console.log("🛡️  Safe Lane: Initializing...");

    // 1. Resolve boilerplate
    const boilerplate = findBoilerplate(templateKey);
    if (!boilerplate) {
        throw new Error(`No boilerplate found for: ${templateKey}`);
    }
    console.log(`📦 Boilerplate: ${boilerplate.name}`);
    console.log(`   Stack: ${boilerplate.stack.join(", ")}`);

    // 2. Read context
    let repoTree = "";
    let readme = "";

    const targetPath = path.resolve(targetDir);

    if (await fs.pathExists(targetPath)) {
        // Read existing project tree
        try {
            repoTree = execSync(`tree /F /A ${targetPath}`, { encoding: "utf-8", timeout: 5000 });
            // Truncate if too long
            if (repoTree.length > 3000) {
                repoTree = repoTree.substring(0, 3000) + "\n... (truncated)";
            }
        } catch {
            repoTree = "(Could not read tree)";
        }

        // Read README
        const readmePath = path.join(targetPath, "README.md");
        if (await fs.pathExists(readmePath)) {
            readme = await fs.readFile(readmePath, "utf-8");
            if (readme.length > 2000) {
                readme = readme.substring(0, 2000) + "\n... (truncated)";
            }
        }
    } else {
        console.log(`   Target dir doesn't exist yet. Will scaffold from boilerplate.`);
        repoTree = boilerplate.allowedDirs.map(d => `📁 ${d}`).join("\n");
    }

    // 3. Build mega-prompt
    console.log("📝 Building mega-prompt...");
    const megaPrompt = buildMegaPrompt({
        boilerplate,
        feature,
        repoTree,
        readme
    });

    // 4. Run through Avon
    console.log("🧠 Sending to Avon:latest...");
    const response = await runModel({
        provider: "ollama",
        model: "Avon:latest",
        system: "You are Avon, a code generation agent operating in Safe Lane mode. Follow the prompt instructions exactly.",
        messages: [{ role: "user", content: megaPrompt }],
        timeoutMs: 120_000
    });

    const output = response.message.content;

    // 5. Validate output against guardrails
    console.log("🛡️  Validating against guardrails...");
    const violations = validateOutput(output, boilerplate);

    if (violations.length > 0) {
        console.error("❌ GUARDRAIL VIOLATIONS DETECTED:");
        violations.forEach(v => console.error(`   ⚠️  ${v}`));
        return {
            status: "blocked",
            violations,
            rawOutput: output
        };
    }

    console.log("✅ All guardrails passed.");

    return {
        status: "safe",
        output,
        boilerplate: boilerplate.name,
        feature
    };
}

/**
 * Validate that the AI output doesn't touch protected files.
 */
function validateOutput(output, boilerplate) {
    const violations = [];

    // Extract file paths mentioned in the output
    const filePathRegex = /###\s+(.+?)(?:\n|$)/g;
    let match;

    while ((match = filePathRegex.exec(output)) !== null) {
        const filePath = match[1].trim();

        if (isProtected(filePath, boilerplate)) {
            violations.push(`Attempted to modify protected file: ${filePath}`);
        }

        if (!isAllowedDir(filePath, boilerplate) && !filePath.includes("checklist") && !filePath.includes("Files")) {
            // Only flag if it looks like a real file path
            if (filePath.includes("/") || filePath.includes(".")) {
                violations.push(`File outside allowed directories: ${filePath}`);
            }
        }
    }

    return violations;
}
