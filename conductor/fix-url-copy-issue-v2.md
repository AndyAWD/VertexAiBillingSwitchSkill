# Fix URL Copy Issue with `--no-launch-browser`

## Objective
Replace the direct execution of `gcloud auth login --no-launch-browser` (which causes UI glitches with the `|` prefix) with an interactive `ask_user` prompt. This prompt will instruct the user to run the command in a new terminal window manually.

Crucially, as per the user's advice, because sub-agents might only read summaries of `references/` files, any mandatory `ask_user` interactions must be explicitly defined in the main `SKILL.md` file to ensure they are strictly executed.

## Key Files to Update
- `skills/zh-tw/SKILL.md`
- `skills/zh-tw/references/config-and-verify.md`
- `skills/en/SKILL.md`
- `skills/en/references/config-and-verify.md`

## Implementation Steps

### 1. Update `skills/zh-tw/SKILL.md`
**Target 1: Step 3 (GCP 認證登入)**
Replace the entire `失敗處理` section with:

```markdown
### 失敗處理

- **登入失敗 — 瀏覽器未開啟**：若沒有瀏覽器視窗彈出，**絕對不要**使用 `run_shell_command` 執行，以免 `|` 分隔線導致長網址斷行與複製錯誤。

  **STOP — 必須呼叫 ask_user，禁止假設答案，等待回應後才能繼續。**
  使用 `ask_user` 提供指令，請使用者在**另一個全新的終端機視窗**手動執行：

  ```json
  {"questions":[{"question":"瀏覽器似乎無法自動開啟。為避免網址複製時混入 `|` 分隔線，請開啟一個「全新的終端機視窗/分頁」（請保持 Gemini CLI 執行不要關閉），手動複製並執行以下指令：\n\n{cmd_string}\n\n完成登入後，請點選下方確認繼續。","header":"手動登入","type":"choice","options":[{"label":"我已完成登入","description":"繼續下一步"}]}]}
  ```
  *提示：若 `{gcloud_cmd}` = `gcloud`，則 `{cmd_string}` 為 `gcloud auth login --no-launch-browser`。若包含完整路徑，請改用 PowerShell 格式（如 `& "{gcloud_cmd}" auth login --no-launch-browser`）。*

- **其他登入失敗**：使用者可能取消了瀏覽器登入，建議重新執行此 Skill。
```

**Target 2: Step 5 & Step 6 (專案設定與驗證 - ADC 登入失敗預警)**
Append a new section right before `## Step 5 & Step 6: 專案設定與驗證`:

```markdown
---

## Step 5: 失敗處理預警（關於 ADC 登入）

在接下來的 Step 5 中，會讀取 `references/config-and-verify.md` 執行 ADC 登入。
若發生 **ADC 登入失敗 — 瀏覽器未開啟** 的情況，**絕對不要**使用 `run_shell_command` 執行。

**STOP — 必須呼叫 ask_user，禁止假設答案，等待回應後才能繼續。**
使用 `ask_user`：

```json
{"questions":[{"question":"瀏覽器似乎無法自動開啟。為避免網址複製時混入 `|` 分隔線，請開啟一個「全新的終端機視窗/分頁」（請保持 Gemini CLI 執行不要關閉），手動複製並執行以下指令：\n\n{cmd_string}\n\n完成登入後，請點選下方確認繼續。","header":"手動 ADC 登入","type":"choice","options":[{"label":"我已完成登入","description":"繼續下一步"}]}]}
```
*提示： `{cmd_string}` 為 `gcloud auth application-default login --no-launch-browser --project={project_id}`（若有路徑則加上 `& "..."`）。*
```

### 2. Update `skills/zh-tw/references/config-and-verify.md`
Replace the `ADC 登入失敗 — 瀏覽器未開啟` bullet point in the `失敗處理` section:

```markdown
- **ADC 登入失敗 — 瀏覽器未開啟**：請參閱 `SKILL.md` 中的「Step 5: 失敗處理預警」，**絕對不要**使用 `run_shell_command`，必須呼叫 `ask_user` 讓使用者在全新終端機視窗手動執行。
```

### 3. Update `skills/en/SKILL.md`
**Target 1: Step 3 (GCP auth login)**
Replace the entire `Failure handling` section with:

```markdown
### Failure handling

- **Login fails — browser did not open**: If no browser window appeared, **DO NOT** use `run_shell_command` to execute it, as the `|` prefix causes long URLs to break and copy incorrectly.

  **STOP — You MUST call ask_user. Wait for the response before continuing.**
  Use `ask_user` to provide the command and ask the user to run it manually in a **NEW terminal window**:

  ```json
  {"questions":[{"question":"The browser failed to open. To avoid URL formatting issues with the `|` prefix, please open a **NEW terminal window/tab** (leave Gemini CLI running) and manually run this command:\n\n{cmd_string}\n\nAfter successfully logging in, click confirm below to continue.","header":"Manual Login","type":"choice","options":[{"label":"I have completed the login","description":"Proceed to the next step"}]}]}
  ```
  *Hint: If `{gcloud_cmd}` = `gcloud`, `{cmd_string}` is `gcloud auth login --no-launch-browser`. If it's a full path, use PowerShell format (e.g., `& "{gcloud_cmd}" auth login --no-launch-browser`).*

- **Other login failures**: The user might have cancelled the browser login. Recommend re-running the Skill.
```

**Target 2: Step 5 & Step 6 (ADC login failure warning)**
Append a new section right before `## Step 5 & Step 6: GCP config + Gemini CLI deployment`:

```markdown
---

## Step 5: Failure Handling Warning (ADC Login)

In the upcoming Step 5, you will read `references/config-and-verify.md` to perform ADC login.
If you encounter **ADC login fails — browser did not open**, **DO NOT** use `run_shell_command`.

**STOP — You MUST call ask_user. Wait for the response before continuing.**
Use `ask_user`:

```json
{"questions":[{"question":"The browser failed to open. To avoid URL formatting issues with the `|` prefix, please open a **NEW terminal window/tab** (leave Gemini CLI running) and manually run this command:\n\n{cmd_string}\n\nAfter successfully logging in, click confirm below to continue.","header":"Manual ADC Login","type":"choice","options":[{"label":"I have completed the login","description":"Proceed to the next step"}]}]}
```
*Hint: `{cmd_string}` is `gcloud auth application-default login --no-launch-browser --project={project_id}` (add `& "..."` if using a full path).*
```

### 4. Update `skills/en/references/config-and-verify.md`
Replace the `ADC login fails — browser did not open` bullet point in the `Failure handling` section:

```markdown
- **ADC login fails — browser did not open**: Refer to the "Step 5: Failure Handling Warning" in `SKILL.md`. **DO NOT** use `run_shell_command`. You MUST call `ask_user` to have the user run it manually in a new terminal window.
```

### 5. Update Hook Files (`assets/vertex-ai-billing-switch-hook.mjs`)
The hook files also contain messages instructing the user to run `--no-launch-browser` if ADC fails. We need to update these messages to suggest running it in a new terminal window to avoid the same copy issues if the hook output is prefixed.

**Target: `skills/zh-tw/assets/vertex-ai-billing-switch-hook.mjs`**
Locate the error message around line 210:
```javascript
      `⚠️ ADC 憑證未設定，請在終端機執行：\ngcloud auth application-default login --project=${projectId}\n若瀏覽器無法開啟，加上 --no-launch-browser`
```
Replace it with:
```javascript
      `⚠️ ADC 憑證未設定，請在終端機執行：\ngcloud auth application-default login --project=${projectId}\n若瀏覽器無法開啟，請加上 --no-launch-browser（建議在全新的終端機視窗執行以免網址換行錯誤）`
```

**Target: `skills/en/assets/vertex-ai-billing-switch-hook.mjs`**
Locate the error message around line 210:
```javascript
      `⚠️ ADC credentials not configured. Run in your terminal:\ngcloud auth application-default login --project=${projectId}\nIf browser can't open, add --no-launch-browser`
```
Replace it with:
```javascript
      `⚠️ ADC credentials not configured. Run in your terminal:\ngcloud auth application-default login --project=${projectId}\nIf browser can't open, add --no-launch-browser (run in a new terminal window to avoid URL formatting issues)`
```