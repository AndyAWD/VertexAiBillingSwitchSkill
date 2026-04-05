# 專案設定與驗證指令 (Step 5 & Step 6)

> 此為 SKILL.md Step 5 與 Step 6 的參考文件。
> 請依序執行下列指令完成設定與驗證。

---

## Step 5: GCP 專案設定 + Gemini CLI 部署

### 前置條件

- Step 3 認證成功
- Step 4 已取得 `{project_id}`

### 共同動作（首次使用者 + 快速切換都執行）

先告知使用者：

> 接下來會執行 GCP 專案設定：
> 1. 設定預設 GCP 專案
> 2. 啟用 Vertex AI API
> 3. 設定應用程式預設憑證（ADC）— **會開啟瀏覽器**，請完成登入

然後依序使用 `run_shell_command` 執行：

**設定預設 GCP 專案：**

若 `{gcloud_cmd}` = `gcloud`：
```bash
gcloud config set project {project_id}
```
若 `{gcloud_cmd}` 為完整路徑：
```bash
powershell -Command "& '{gcloud_cmd}' config set project {project_id}"
```

**啟用 Vertex AI API：**

若 `{gcloud_cmd}` = `gcloud`：
```bash
gcloud services enable aiplatform.googleapis.com --project={project_id}
```
若 `{gcloud_cmd}` 為完整路徑：
```bash
powershell -Command "& '{gcloud_cmd}' services enable aiplatform.googleapis.com --project={project_id}"
```

**設定 ADC：**

若 `{gcloud_cmd}` = `gcloud`：
```bash
gcloud auth application-default login --project={project_id}
```
若 `{gcloud_cmd}` 為完整路徑：
```bash
powershell -Command "& '{gcloud_cmd}' auth application-default login --project={project_id}"
```

**更新環境變數：**

1. 取得使用者家目錄絕對路徑：

   ```bash
   node -e "process.stdout.write(require('os').homedir())"
   ```

   將輸出結果儲存為 `{home_dir}`。若尚未設定（例如快速切換跳過了 Step 2），一併推導：`{skill_dir}` = `{home_dir}/.gemini/skills/zh-tw`

2. 使用 `read_file` 讀取 `{home_dir}/.gemini/.env`（若檔案不存在則從空內容開始）
3. 移除既有的 `GOOGLE_CLOUD_PROJECT=` 和 `GOOGLE_CLOUD_LOCATION=` 行
4. 追加以下內容：

   ```
   GOOGLE_CLOUD_PROJECT={project_id}
   GOOGLE_CLOUD_LOCATION=global
   ```

5. 使用 `write_file` 寫回 `{home_dir}/.gemini/.env`

### 失敗處理

- **API 啟用失敗**：可能是專案 ID 錯誤或權限不足，告知使用者檢查專案 ID
- **ADC 登入失敗 — 瀏覽器未開啟**：若沒有瀏覽器視窗彈出，使用 `--no-launch-browser` 重試：

  若 `{gcloud_cmd}` = `gcloud`：
  ```bash
  gcloud auth application-default login --no-launch-browser --project={project_id}
  ```
  若 `{gcloud_cmd}` 為完整路徑：
  ```bash
  powershell -Command "& '{gcloud_cmd}' auth application-default login --no-launch-browser --project={project_id}"
  ```
  gcloud 會在終端機顯示一個 URL，請使用者複製到瀏覽器完成登入，再將驗證碼貼回終端機。

- **其他 ADC 登入失敗**：可能是使用者取消了瀏覽器登入，建議重新執行此步驟。

### 僅首次執行的動作（`quick_switch = true` 時跳過）

> 當 `quick_switch = true` 時，以下動作**跳過**，因為先前執行已部署完成。

**請讀取 `references/deploy-hook.md` 取得目錄建立、Hook 腳本部署，以及 settings.json 非破壞性合併的詳細指令。**

---

## Step 6: 驗證 + 完成

### 驗證項目

使用 `run_shell_command` 依序檢查：

1. **環境變數**：
   ```bash
   cat {home_dir}/.gemini/.env
   ```
   確認包含 `GOOGLE_CLOUD_PROJECT={project_id}`

   > 當 `hook_only = true` 時：只確認 `GOOGLE_CLOUD_PROJECT=` 存在即可，不需要比對特定值（若使用者選「使用目前專案」，此流程未修改 `.env`）。

2. **settings.json**：
   ```bash
   cat {home_dir}/.gemini/settings.json
   ```
   確認 `hooks.SessionStart` 中有 `vertex-ai-billing-switch-hook` hook

3. **Hook 檔案**：
   ```bash
   test -f {home_dir}/.gemini/hooks/vertex-ai-billing-switch-hook.mjs && echo "OK" || echo "MISSING"
   ```
   確認檔案存在

4. **ADC 憑證**：
   ```bash
   gcloud auth application-default print-access-token --quiet 2>/dev/null | head -c 20
   ```
   確認能取得 access token（只顯示前 20 字元以保護安全）

   > 當 `hook_only = true` 時：若無法取得 token，顯示警告而非整體失敗：
   > ⚠️ 無法驗證 ADC 憑證。Hook 已部署，但如需確認請執行 `gcloud auth application-default login`。

### 驗證結果

**全部通過（`hook_only = true`）** → 顯示以下摘要：

> ✅ **帳單切換 Hook 部署完成！** 以下是摘要：
>
> | 項目 | 狀態 |
> |------|------|
> | GCP 專案 | `{project_id}` |
> | 帳單切換 Hook | 已部署 |
> | Hook 設定 | 已註冊 |
>
> ---
>
> ⚠️ **請立即重新啟動 Gemini CLI 讓 Hook 生效：**
>
> 1. 輸入 `/quit` 離開
> 2. 重新啟動後，帳單切換 Hook 將自動生效
>
> 🔄 帳單切換 Hook 會在每次啟動時自動檢查額度，不足時自動切換帳戶。

**全部通過（`hook_only = false` 或未設定）** → 顯示以下摘要：

> ✅ **Vertex AI 設定完成！** 以下是摘要：
>
> | 項目 | 狀態 |
> |------|------|
> | GCP 專案 | `{project_id}` |
> | Vertex AI API | 已啟用 |
> | ADC 憑證 | 已設定 |
> | 帳單切換 Hook | 已部署 |
> | 環境變數 | 已寫入 |
> | 認證模式 | 已切換為 Vertex AI |
>
> ---
>
> ⚠️ **請立即重新啟動 Gemini CLI 讓設定生效：**
>
> 1. 輸入 `/quit` 離開
> 2. 重新啟動後，輸入 `/model` 選擇模型即可開始使用
>
> 💡 認證模式已自動設為 Vertex AI，無需手動切換。如需變更，可隨時執行 `/auth`。
>
> 🔄 帳單切換 Hook 會在每次啟動時自動檢查額度，不足時自動切換帳戶。

**有失敗項目** → 針對失敗項目顯示具體原因和修復建議。