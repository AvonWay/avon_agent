/**
 * Mega-Prompt Templates
 * 
 * One-shot structured prompts that tell Avon exactly how to read
 * a boilerplate and what to output. Designed to minimize "thinking"
 * and maximize deterministic, high-quality code generation.
 */

/**
 * Generate a full-feature mega-prompt for working inside a boilerplate.
 */
export function buildMegaPrompt({ boilerplate, feature, repoTree, readme }) {
    return `
# ROLE
You are a senior full-stack engineer working INSIDE an existing boilerplate.
You do NOT generate new projects. You EXTEND an existing one.

# TECH STACK
${boilerplate.stack.join(", ")}

# REPO STRUCTURE
\`\`\`
${repoTree}
\`\`\`

# BOILERPLATE README (Key Conventions)
${readme || "Not provided. Infer conventions from the repo structure."}

# YOUR TASK
Implement the following new feature WITHOUT changing core framework/auth/config files:

${feature}

# STRICT RULES
1. REUSE existing patterns for routing, components, and DB access.
2. DO NOT modify these protected files:
   ${boilerplate.protectedFiles.map(f => `- ${f}`).join("\n   ")}
3. ONLY touch files in these directories:
   ${boilerplate.allowedDirs.map(d => `- ${d}`).join("\n   ")}
4. Include ALL new/changed files with FULL code blocks.
5. Add comments explaining logic in simple English.
6. Use the SAME coding style as the existing codebase.
7. Handle errors gracefully. Never silently fail.
8. Include TypeScript types where applicable.

# OUTPUT FORMAT
Respond with EXACTLY this structure:

## Files Created
- [list of new file paths]

## Files Modified
- [list of modified file paths]

## Code

### [filename]
\`\`\`[language]
[full file contents]
\`\`\`

(Repeat for each file)

## Migration / Setup Checklist
- [ ] [Any DB migrations needed]
- [ ] [Any env vars to add]
- [ ] [Any packages to install]
- [ ] [How to test the new feature]
`;
}

/**
 * Generate a focused module-level prompt for smaller tasks.
 */
export function buildModulePrompt({ language, framework, functionality, requirements }) {
    return `
I need to implement ${functionality} in ${language}/${framework}.

Key requirements:
${requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Please consider:
- Error handling and edge cases
- Performance implications
- Best practices for ${framework}
- Security considerations

Generate code with clear comments explaining the logic.

Output the complete file(s) with full contents, ready to save.
`;
}

/**
 * Generate a patch-style output prompt (for diffable output).
 */
export function buildPatchPrompt({ boilerplate, feature, existingFiles }) {
    return `
# CONTEXT
You are modifying an existing ${boilerplate.name} project.
Stack: ${boilerplate.stack.join(", ")}

# EXISTING FILES (for reference)
${existingFiles.map(f => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n")}

# TASK
${feature}

# RULES
- Only modify files in: ${boilerplate.allowedDirs.join(", ")}
- Never touch: ${boilerplate.protectedFiles.join(", ")}

# OUTPUT FORMAT
For each file, output:
1. File path
2. Action: CREATE or MODIFY
3. Full file contents (not a diff — complete file)

This allows safe review before merging.
`;
}
