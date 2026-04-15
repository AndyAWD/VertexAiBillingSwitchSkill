# Rename Billing Accounts — Execution Commands

> Reference for Step R of SKILL.md.
> Read this after the user selects "Rename billing accounts" from Step 1.

---

## R-1: List All Billing Accounts

Use `run_shell_command`:

```bash
gcloud billing accounts list --format="json(name,displayName,open)"
```

Parse the JSON output and display a table to the user:

> **Your billing accounts:**
>
> | # | Display Name | Account ID | Status |
> |---|-------------|------------|--------|
> | 1 | {displayName1} | {accountId1} | Open |
> | 2 | {displayName2} | {accountId2} | Closed |
> | ... | ... | ... | ... |

Extract `{accountId}` from the `name` field by removing the `billingAccounts/` prefix (e.g., `billingAccounts/012345-ABCDEF-678901` → `012345-ABCDEF-678901`).

If no accounts are found, display:

> No billing accounts found. Make sure you are logged into the correct Google account.

Then abort.

---

## R-2: Choose Naming Strategy

**STOP — You MUST call ask_user. DO NOT assume the answer. Wait for the response before continuing.**

Use `ask_user`:

```json
{"questions":[{"question":"How would you like to rename your billing accounts?","header":"Naming Strategy","type":"choice","options":[{"label":"Name by expiration date","description":"Check each account's credit expiration in GCP Console, then auto-name as Trial_Exp_YYYYMMDD"},{"label":"Custom name each","description":"Enter a custom display name for each account"},{"label":"Cancel","description":"Go back without renaming"}]}]}
```

### "Cancel"

Display:

> Rename cancelled. To retry, run the skill again.

Then abort.

### "Custom name each"

For each **open** account, use `ask_user`:

```json
{"questions":[{"question":"Enter new display name for [{displayName}] (Account ID: {accountId}). Leave empty to skip:","header":"Rename Account","type":"text","placeholder":"{displayName}"}]}
```

- If empty → skip (keep current name)
- If provided → store as the new display name

Proceed to **R-4 (Confirm)**.

### "Name by expiration date"

Proceed to **R-3**.

---

## R-3: Collect Expiration Dates (Only for "Name by expiration date")

For each **open** account, display the Console Credits direct link and ask for the expiration date:

> **Account: [{displayName}]** (ID: {accountId})
> Check credits here: https://console.cloud.google.com/billing/{accountId}/credits

**STOP — You MUST call ask_user. DO NOT assume the answer. Wait for the response before continuing.**

Use `ask_user`:

```json
{"questions":[{"question":"Enter the credit expiration date for [{displayName}] (format: YYYY-MM-DD). Type 'skip' to keep the current name:","header":"Expiration Date","type":"text","placeholder":"2026-05-01"}]}
```

### Validation

- If `skip` → keep current name, move to next account
- If valid date (YYYY-MM-DD format) → generate new name: `Trial_Exp_YYYYMMDD` (remove hyphens, e.g., `2026-05-01` → `Trial_Exp_20260501`)
- If invalid format → inform user and ask again:
  > Invalid date format. Please enter as YYYY-MM-DD (e.g., 2026-05-01) or type 'skip'.

Repeat for all open accounts. Proceed to **R-4 (Confirm)**.

---

## R-4: Confirm Rename

Display a preview table:

> **Rename preview:**
>
> | Account ID | Current Name | New Name |
> |-----------|-------------|----------|
> | {accountId1} | {oldName1} | {newName1} |
> | {accountId2} | {oldName2} | (skipped) |
> | ... | ... | ... |

**STOP — You MUST call ask_user. DO NOT assume the answer. Wait for the response before continuing.**

Use `ask_user`:

```json
{"questions":[{"question":"Apply the renames shown above?","header":"Confirm Rename","type":"yesno"}]}
```

- **Yes** → Proceed to R-5
- **No** → Display "Rename cancelled." and abort

---

## R-5: Execute Renames

For each account with a new name, use `run_shell_command`:

```bash
gcloud billing accounts update {accountId} --display-name="{newName}"
```

### Error handling

- **Success** → Log: `✅ Renamed {accountId} → {newName}`

- **`PERMISSION_DENIED`** → Display:
  > ❌ Permission denied for account {accountId}. You need the **Billing Account Administrator** role to rename accounts.

- **Command not found / unsupported** (older gcloud versions) → Display:
  > ❌ `gcloud billing accounts update` is not available in your gcloud version. Please rename manually in GCP Console:
  > https://console.cloud.google.com/billing
  >
  > Tip: See [GCP Billing Account Management](https://memo.jimmyliao.net/p/gcp-gcp-project-billing-account) for a step-by-step guide.

  Then abort remaining renames.

- **Other errors** → Display the error message and continue with the next account.

### Completion

After processing all accounts, display:

> **Rename complete!**
>
> | Account ID | Result |
> |-----------|--------|
> | {accountId1} | ✅ → {newName1} |
> | {accountId2} | ⏭️ Skipped |
> | {accountId3} | ❌ {errorReason} |
>
> To verify: `gcloud billing accounts list`
