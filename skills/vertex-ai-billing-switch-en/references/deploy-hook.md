# First-Time Deployment — Hook & Settings

> Reference for Step 5 of SKILL.md.
> Execute these actions only when `quick_switch = false` (first-time setup).
> When `quick_switch = true`, skip everything in this file.

---

## Create Directories

Use `run_shell_command`:

```bash
mkdir -p {home_dir}/.gemini/hooks
```

## Deploy Billing Switch Hook

If `{skill_dir}` is not yet set, derive it now:
`{skill_dir}` = `{home_dir}/.gemini/skills/vertex-ai-billing-switch-skill`
(This is the standard installation path per the Quick Start instructions.)

Use `run_shell_command` to copy the Hook script from this Skill's directory to the global location:

```bash
cp {skill_dir}/assets/vertex-ai-billing-switch-hook.mjs {home_dir}/.gemini/hooks/vertex-ai-billing-switch-hook.mjs
```

## Update settings.json

1. Use `read_file` to read `{home_dir}/.gemini/settings.json` (start with `{}` if file doesn't exist)
2. Parse JSON
3. **Non-destructive merge** the following (only add/update, never overwrite other settings):

```json
{
  "security": {
    "auth": {
      "selectedType": "vertex-ai"
    }
  },
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "name": "vertex-ai-billing-switch-hook",
            "type": "command",
            "command": "node {home_dir}/.gemini/hooks/vertex-ai-billing-switch-hook.mjs",
            "timeout": 120000,
            "description": "Automatically check and switch GCP billing accounts to ensure sufficient API quota"
          }
        ]
      }
    ]
  }
}
```

**Merge rules:**
- Set `security.auth.selectedType` to `"vertex-ai"` (only this value — do not touch any other parameters)
- If `hooks.SessionStart` already exists, check if there's a hook with `name === "vertex-ai-billing-switch-hook"`
- If exists → Do not add duplicate
- If not → Push the new matcher object to the `SessionStart` array
- **DO NOT modify** `model.name` (user will choose via `/model`)

4. Use `write_file` to write back to `{home_dir}/.gemini/settings.json` (formatted with 2-space indentation)
