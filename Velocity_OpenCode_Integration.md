# Velocity Trade: Local Agent Integration (OpenCode + Ollama)

## Overview
This document outlines the integration of **OpenCode** into the **Velocity Trade** ecosystem. By leveraging Ollama's local inference capabilities, OpenCode serves as an autonomous terminal agent capable of performing file operations, executing shell commands, and refactoring code without external API dependencies.

## System Configuration
- **Host Hardware:** High-performance local workstation (e.g., ASUS ROG Strix SCAR 18).
- **Inference Engine:** Ollama (Local).
- **Agent Interface:** OpenCode CLI.
- **Primary Models:** Qwen 2.5 Coder (32B) or Gemma 4 (26b).

## Implementation Strategy
The agent acts as a controller between the natural language intent and the file system/shell.

### Logic Flow
1. **Initialize:** Connect to the local Ollama socket (11434).
2. **Context Loading:** Read the local directory structure and project-specific documentation (Mission Manifest).
3. **Execution Loop:** - Receive user prompt.
    - Model determines tool usage (Read, Write, Execute).
    - Agent performs action and returns output for verification.

## Pseudo-Code Architecture

```python
# Pseudo-code for Velocity-OpenCode Functionality

class VelocityAgent:
    def __init__(self, model_name="qwen2.5-coder:32b"):
        self.endpoint = "http://localhost:11434/api/generate"
        self.model = model_name
        self.context_window = []

    def load_project_context(self, root_dir):
        # Scan local directory for file mapping
        # Priority files: package.json, next.config.js, stripe_logic.ts
        pass

    def execute_request(self, user_prompt):
        # 1. Analyze prompt for "Action Type" (Refactor, Debug, Build)
        action_plan = self.query_model(f"Plan steps for: {user_prompt}")
        
        for step in action_plan.steps:
            if step.type == "FS_READ":
                data = self.read_local_file(step.path)
            elif step.type == "FS_WRITE":
                self.write_local_file(step.path, step.content)
            elif step.type == "SHELL_EXEC":
                result = self.run_bash_command(step.command)
                
        return "Task Completed Locally"

    def query_model(self, prompt):
        # Standard Ollama API call logic
        pass

# Usage Example:
# velocity = VelocityAgent()
# velocity.execute_request("Update the affiliate dashboard to include the new Stripe pricing tier")

```

## Security & Privacy Benefits

* **Zero Data Leakage:** All source code stays on the local disk.
* **Cost Efficiency:** No token costs for massive multi-file refactors.
* **Velocity Integration:** Direct access to local Supabase and Next.js environments for rapid prototyping.
