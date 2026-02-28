import { exec } from 'child_process';
import util from 'util';
import fs from 'fs-extra';
const execPromise = util.promisify(exec);

const CONSTITUTION_PATH = "PROJECT_CONSTITUTION.md";

async function extractVibeRules() {
    console.log("🔍 Extracting Vibe Rules from Git History...");

    try {
        // Get the last 10 commits with diffs
        const { stdout: diffs } = await execPromise('git log -p -n 10');

        if (!diffs) {
            console.log("ℹ️ No git history found or not a git repository. Using defaults.");
            return;
        }

        // We'll use the 'ReflectionAgent' or a specific extraction logic
        // For this script, we'll simulate the extraction of patterns

        const rules = [];

        if (diffs.includes('const ') && diffs.includes('=>')) {
            rules.push("Prefer arrow functions for component definitions.");
        }
        if (diffs.includes('interface ') || diffs.includes('type ')) {
            rules.push("Enforce strict TypeScript interfaces for all data structures.");
        }
        if (diffs.includes('use client')) {
            rules.push("Always specify 'use client' for interactive React components.");
        }
        if (diffs.includes('import { supabase }')) {
            rules.push("Use the centralized supabase client from @/lib/supabase.");
        }

        if (rules.length > 0) {
            console.log("✨ Extracted New Rules:");
            rules.forEach(r => console.log(` - ${r}`));

            let content = await fs.readFile(CONSTITUTION_PATH, 'utf-8');
            content += "\n\n## 5. EXTRACTED VIBE RULES (Auto-Learned)\n";
            rules.forEach(r => {
                if (!content.includes(r)) {
                    content += `- ${r}\n`;
                }
            });

            await fs.writeFile(CONSTITUTION_PATH, content);
            console.log("✅ PROJECT_CONSTITUTION.md updated.");
        } else {
            console.log("ℹ️ No new patterns detected in recent history.");
        }

    } catch (error) {
        console.error("❌ Error extracting vibes:", error.message);
    }
}

extractVibeRules();
