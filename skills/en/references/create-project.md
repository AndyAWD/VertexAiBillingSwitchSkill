# Auto-Create GCP Project — Execution Commands

> Reference for Step 4 of SKILL.md (sub-steps 4-B through 4-E).
> Read this after the user has provided a project ID base name via `ask_user`.

---

## Project ID Generation Logic

1. Use user input as the base name (default to `gemini-vertex` if empty)
2. Validate: only lowercase letters, digits, hyphens allowed; must start with a letter
3. Generate a 6-character random suffix:
   ```bash
   node -e "process.stdout.write(Math.random().toString(36).substring(2, 8))"
   ```
4. Combine as `{base}-{suffix}`, e.g., `gemini-vertex-a3k9m2`
5. Ensure total length ≤ 30 characters (truncate base name if needed)

---

## 4-C: Create Project

Inform the user:

> Creating GCP project `{project_id}`...

Use `run_shell_command`:

If `{gcloud_cmd}` = `gcloud`:
```bash
gcloud projects create {project_id} --name="{project_id}"
```
If `{gcloud_cmd}` is a full path:
```bash
powershell -Command "& '{gcloud_cmd}' projects create {project_id} --name='{project_id}'"
```

**Error handling:**
- **Name conflict** (`ALREADY_EXISTS`): Regenerate random suffix and retry, up to 3 times
- **Quota exceeded** (`QUOTA_EXCEEDED`): Inform user they've hit the GCP project limit, suggest deleting old projects in Google Cloud Console or using the manual flow
- **Permission denied**: Inform user their account may lack project creation permissions, suggest the manual flow
- **Other errors**: Show the error message and provide the manual creation guide as fallback

---

## 4-D: Link Billing Account

Use `run_shell_command`:

If `{gcloud_cmd}` = `gcloud`:
```bash
gcloud billing projects link {project_id} --billing-account={account_id} --quiet
```
If `{gcloud_cmd}` is a full path:
```bash
powershell -Command "& '{gcloud_cmd}' billing projects link {project_id} --billing-account={account_id} --quiet"
```

Verify the link:

If `{gcloud_cmd}` = `gcloud`:
```bash
gcloud billing projects describe {project_id} --format="value(billingEnabled)"
```
If `{gcloud_cmd}` is a full path:
```bash
powershell -Command "& '{gcloud_cmd}' billing projects describe {project_id} --format=value(billingEnabled)"
```

Confirm it returns `True`.

---

## 4-E: Confirmation

Display:

> Project `{project_id}` created successfully and linked to billing account [{displayName}].

Store `{project_id}` for subsequent steps. Proceed to **Step 5**.
