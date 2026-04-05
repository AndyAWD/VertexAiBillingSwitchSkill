# Configuration and Verification Instructions (Step 5 & Step 6)

> This is the reference file for SKILL.md Step 5 and Step 6.
> Please execute the following commands sequentially to complete the configuration and verification.

---

## Step 5: GCP Config + Gemini CLI Deployment

### Prerequisites

- Step 3: Authentication successful
- Step 4: `{project_id}` obtained

### Actions — Common (both first-time and quick switch)

First, inform the user:

> Setting up GCP project configuration:
> 1. Set the default GCP project
> 2. Enable the Vertex AI API
> 3. Set up Application Default Credentials (ADC) — **the browser will open**, please complete the login

Then use `run_shell_command` sequentially:

**Set default GCP project:**

If `{gcloud_cmd}` = `gcloud`:
```bash
gcloud config set project {project_id}
```
If `{gcloud_cmd}` is a full path:
```bash
powershell -Command "& '{gcloud_cmd}' config set project {project_id}"
```

**Enable Vertex AI API:**

If `{gcloud_cmd}` = `gcloud`:
```bash
gcloud services enable aiplatform.googleapis.com --project={project_id}
```
If `{gcloud_cmd}` is a full path:
```bash
powershell -Command "& '{gcloud_cmd}' services enable aiplatform.googleapis.com --project={project_id}"
```

**Set up ADC:**

If `{gcloud_cmd}` = `gcloud`:
```bash
gcloud auth application-default login --project={project_id}
```
If `{gcloud_cmd}` is a full path:
```bash
powershell -Command "& '{gcloud_cmd}' auth application-default login --project={project_id}"
```

**Update environment variables:**

1. Get the absolute home directory path:

   ```bash
   node -e "process.stdout.write(require('os').homedir())"
   ```

   Store the output as `{home_dir}`. If not already set (e.g., quick switch skipped Step 2), also derive: `{skill_dir}` = `{home_dir}/.gemini/skills/en`

2. Use `read_file` to read `{home_dir}/.gemini/.env` (start with empty content if file doesn't exist)
3. Remove existing `GOOGLE_CLOUD_PROJECT=` and `GOOGLE_CLOUD_LOCATION=` lines
4. Append:

   ```
   GOOGLE_CLOUD_PROJECT={project_id}
   GOOGLE_CLOUD_LOCATION=global
   ```

5. Use `write_file` to write back to `{home_dir}/.gemini/.env`

### Failure handling

- **API enablement fails**: Likely wrong Project ID or insufficient permissions. Ask user to verify the Project ID
- **ADC login fails — browser did not open**: If no browser window appeared, retry with `--no-launch-browser`:

  If `{gcloud_cmd}` = `gcloud`:
  ```bash
  gcloud auth application-default login --no-launch-browser --project={project_id}
  ```
  If `{gcloud_cmd}` is a full path:
  ```bash
  powershell -Command "& '{gcloud_cmd}' auth application-default login --no-launch-browser --project={project_id}"
  ```
  gcloud will print a URL in the terminal. Ask the user to open it in any browser, complete sign-in, then paste the verification code back into the terminal.

- **ADC login fails — other reason**: User may have cancelled the browser login. Suggest re-running this step.

### Actions — First-time only (skip if `quick_switch = true`)

> When `quick_switch = true`, the following actions are **skipped** because they were already deployed in a previous run.

**Read `references/deploy-hook.md` for directory creation, Hook script deployment, and settings.json non-destructive merge instructions.**

---

## Step 6: Verify + Complete

### Verification items

Use `run_shell_command` to check sequentially:

1. **Environment variables**:
   ```bash
   cat {home_dir}/.gemini/.env
   ```
   Confirm it contains `GOOGLE_CLOUD_PROJECT={project_id}`

   > When `hook_only = true`: Confirm `GOOGLE_CLOUD_PROJECT=` is present (any value is acceptable — skip strict value match if user chose "Use current project" and `.env` was not modified).

2. **settings.json**:
   ```bash
   cat {home_dir}/.gemini/settings.json
   ```
   Confirm `hooks.SessionStart` contains the `vertex-ai-billing-switch-hook` hook

3. **Hook file**:
   ```bash
   test -f {home_dir}/.gemini/hooks/vertex-ai-billing-switch-hook.mjs && echo "OK" || echo "MISSING"
   ```
   Confirm file exists

4. **ADC credentials**:
   ```bash
   gcloud auth application-default print-access-token --quiet 2>/dev/null | head -c 20
   ```
   Confirm an access token can be obtained (only show first 20 chars for security)

   > When `hook_only = true`: If token cannot be obtained, display a warning instead of failing:
   > ⚠️ ADC credentials could not be verified. Hook has been deployed, but to confirm run `gcloud auth application-default login`.

### Results

**All passed (`hook_only = true`)** → Display the following summary:

> ✅ **Billing switch Hook deployed!** Here's a summary:
>
> | Item | Status |
> |------|--------|
> | GCP Project | `{project_id}` |
> | Billing Switch Hook | Deployed |
> | Hook Settings | Registered |
>
> ---
>
> ⚠️ **Please restart Gemini CLI for the Hook to take effect:**
>
> 1. Type `/quit` to exit
> 2. After restarting, the billing switch Hook will activate automatically
>
> 🔄 The billing switch Hook will automatically check quota on every startup and switch accounts if insufficient.

**All passed (`hook_only = false` or unset)** → Display the following summary:

> ✅ **Vertex AI setup complete!** Here's a summary:
>
> | Item | Status |
> |------|--------|
> | GCP Project | `{project_id}` |
> | Vertex AI API | Enabled |
> | ADC Credentials | Configured |
> | Billing Switch Hook | Deployed |
> | Environment Variables | Written |
> | Authentication Mode | Set to Vertex AI |
>
> ---
>
> ⚠️ **Please restart Gemini CLI immediately for all settings to take effect:**
>
> 1. Type `/quit` to exit
> 2. After restarting, type `/model` to select your preferred model and start using
>
> 💡 Authentication mode has been automatically set to Vertex AI — no manual switch needed. To change it later, run `/auth`.
>
> 🔄 The billing switch Hook will automatically check quota on every startup and switch accounts if insufficient.

**Any items failed** → Show specific failure reasons and remediation suggestions.