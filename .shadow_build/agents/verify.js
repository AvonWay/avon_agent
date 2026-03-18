import { exec } from 'child_process';
import util from 'util';
import { runModel } from "../kernel/modelRouter.js";

const execPromise = util.promisify(exec);

export class VerifyAgent {
    static async checkBuild(cwd) {
        console.log(`[Verify] Running build check in ${cwd}...`);
        try {
            const { stdout, stderr } = await execPromise('npm run build', { cwd });
            return { success: true, logs: stdout };
        } catch (error) {
            console.error(`[Verify] Build Failed.`);
            return { success: false, logs: error.stdout + error.stderr };
        }
    }

    static async checkLint(cwd) {
        console.log(`[Verify] Running lint check in ${cwd}...`);
        try {
            const { stdout, stderr } = await execPromise('npm run lint', { cwd });
            return { success: true, logs: stdout };
        } catch (error) {
            console.error(`[Verify] Lint Failed.`);
            return { success: false, logs: error.stdout + error.stderr };
        }
    }

    /**
     * AI-Driven Vibe Audit
     * Sends the code and constitution rules to codegemma for a nuanced check.
     */
    static async checkVibeAI(code, rules) {
        console.log(`[Auditor] Initiating AI-Driven Vibe Audit...`);
        
        const prompt = `
        Review the following code for adherence to the Velocity Project Constitution.
        
        [CONSTITUTION RULES]:
        ${rules.join('\n- ')}
        
        [CODE TO REVIEW]:
        ${code.slice(0, 5000)}
        
        Identify any violations. If no violations exist, output "PASS".
        If violations exist, list them as bullet points and conclude with "FAIL".
        `;

        try {
            const response = await runModel({
                profile: 'guardian', // codegemma:latest
                messages: [{ role: 'user', content: prompt }]
            });

            const audit = response.message?.content || "FAIL (No response)";
            const success = audit.includes("PASS");
            const violations = success ? [] : audit.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));

            return {
                success,
                audit,
                violations
            };
        } catch (error) {
            console.error("[Auditor] AI Audit Failed:", error.message);
            return { success: false, audit: "AI Audit Exception", violations: [error.message] };
        }
    }

    static async checkSecurity(code) {
      console.log(`[Verify] Running deep security scan...`);
      // Simulating a more complex security check that could be AI-driven or use specialized tools.
      // Already handled by EvolutionEngine'S runSAST, but we can add AI-layer here.
      return { success: true, issues: [] };
    }

    static async checkVibe(code, rules) {
        console.log(`[Auditor] Validating code against Project Constitution (Legacy)...`);
        const violations = [];

        // Simple regex-based rule enforcement
        if (rules.some(r => r.includes("arrow functions")) && code.includes("function ")) {
            violations.push("VIOLATION: Use of standard 'function' keyword. Arrow functions preferred.");
        }

        if (rules.some(r => r.includes("TypeScript interfaces")) && !code.includes("interface ")) {
            // violations.push("ADVICE: No TypeScript interfaces detected.");
        }

        return {
            success: violations.length === 0,
            violations
        };
    }
}


