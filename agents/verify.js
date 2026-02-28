import { exec } from 'child_process';
import util from 'util';
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

    static async checkVibe(code, rules) {
        console.log(`[Auditor] Validating code against Project Constitution...`);
        const violations = [];

        // Simple regex-based rule enforcement
        if (rules.some(r => r.includes("arrow functions")) && code.includes("function ")) {
            violations.push("VIOLATION: Use of standard 'function' keyword. Arrow functions preferred.");
        }

        if (rules.some(r => r.includes("TypeScript interfaces")) && !code.includes("interface ")) {
            // Note: This is an example, real logic would be better
            // violations.push("ADVICE: No TypeScript interfaces detected.");
        }

        return {
            success: violations.length === 0,
            violations
        };
    }
}

