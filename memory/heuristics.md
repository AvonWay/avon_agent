## Learned Rule (2026-02-14)

- Before optimizing frontend performance, request server timing metrics.
- Avoid guessing bottlenecks without profiling data.

## Safe Lane Protocol (2026-02-14)

- ALWAYS start from a pre-approved boilerplate, never generate from scratch.
- Use mega-prompts with explicit guardrails (allowed dirs, protected files).
- Validate AI output against guardrails BEFORE writing any files.
- Protected files include: auth, config, linters, env, license, and security-sensitive code.
- Require patch-style output (full file contents, not diffs) for safe review.
- Boilerplate conventions take priority over AI suggestions.
