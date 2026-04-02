# 安裝 gcloud CLI — 各平台安裝指令

> 此為 SKILL.md Step 2 的參考文件。
> 在使用者透過 `ask_user` 選擇安裝方式後讀取此檔案。
> 所有腳本路徑（`scripts/install-gcloud.mjs`）皆相對於本 Skill 根目錄，執行時需使用絕對路徑。

---

## Windows

### winget 安裝

先告知使用者：

> 安裝過程中，Windows 可能會彈出「使用者帳戶控制」對話框，請按「是」允許安裝。

1. 檢查 winget 是否可用：
   ```bash
   winget --version
   ```

2. 若 winget 不可用（舊版 Windows 或 Windows Server），告知使用者：
   > 你的系統未提供 winget。請改用 Google 官方安裝方式，或前往 Microsoft Store 安裝「應用程式安裝程式」。

   然後自動退回「Google 官方安裝」流程。

3. 安裝 gcloud CLI：
   ```bash
   winget install -e --id Google.CloudSDK --accept-source-agreements --accept-package-agreements
   ```

4. 驗證安裝並設定 `{gcloud_cmd}`：
   ```bash
   gcloud --version
   ```

   - **若成功**：設定 `{gcloud_cmd}` = `gcloud`，繼續執行 Step 3。

   - **若失敗**（當前終端機 session 的 PATH 尚未包含新安裝路徑）：

     使用 Node.js 搜尋實際安裝路徑：
     ```bash
     node -e "const path=require('path'),fs=require('fs');const c=[path.join(process.env.LOCALAPPDATA||'','Google','Cloud SDK','google-cloud-sdk','bin','gcloud.cmd'),'C:\\\\Program Files\\\\Google\\\\Cloud SDK\\\\google-cloud-sdk\\\\bin\\\\gcloud.cmd','C:\\\\Program Files (x86)\\\\Google\\\\Cloud SDK\\\\google-cloud-sdk\\\\bin\\\\gcloud.cmd'];for(const p of c){if(fs.existsSync(p)){process.stdout.write(p);break;}}"
     ```

     將輸出儲存為 `{found_gcloud_path}`，用 PowerShell 呼叫運算符（`&`）驗證，避免路徑含空格的解析錯誤：
     ```bash
     powershell -Command "& '{found_gcloud_path}' --version"
     ```

     - **驗證成功**：設定 `{gcloud_cmd}` = `{found_gcloud_path}`
     - **驗證失敗**：告知使用者手動安裝 gcloud 後重新執行此 Skill

     > **重要**：`{gcloud_cmd}` 是此次 session 的工作變數，後續 Step 3/4/5 所有 gcloud 指令請改用：
     > `powershell -Command "& '{gcloud_cmd}' <arguments>"`
     >
     > **注意：** 此 PATH 問題只影響當前終端機 session。重啟終端機後，`gcloud` 就能直接使用，無需完整路徑。

### Google 官方安裝

使用 `run_shell_command` 執行：

```bash
node {skill_dir}/scripts/install-gcloud.mjs
```

> 腳本會將結果以 JSON 格式輸出到 stdout，日誌輸出到 stderr。

解析腳本輸出的 JSON：

- **若 `success === false`**：告知使用者手動安裝 gcloud 後重新執行此 Skill。
- **若 `success === true`**：
  1. 嘗試執行 `gcloud --version`
     - **成功**：設定 `{gcloud_cmd}` = `gcloud`，繼續執行 Step 3。
     - **失敗**（PATH 未更新）：
       設定 `{gcloud_cmd}` = `{gcloudBinPath}\gcloud.cmd`（從 JSON 的 `gcloudBinPath` 欄位取得目錄路徑）
       用 PowerShell 呼叫運算符驗證：
       ```bash
       powershell -Command "& '{gcloud_cmd}' --version"
       ```
       > **重要**：後續 Step 3/4/5 所有 gcloud 指令請改用：
       > `powershell -Command "& '{gcloud_cmd}' <arguments>"`

---

## macOS

### Homebrew 安裝

1. 檢查 Homebrew 是否已安裝：
   ```bash
   brew --version
   ```

2. 若未安裝，先告知使用者：
   > 接下來安裝 Homebrew 時，系統可能會要求你輸入 Mac 的登入密碼。
   > 注意：輸入密碼時螢幕**不會顯示任何字元**，這是正常的安全機制，請直接打完密碼後按 Enter。

   然後使用 `run_shell_command` 安裝 Homebrew：
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

   安裝完成後，設定 PATH（Apple Silicon）：
   ```bash
   eval "$(/opt/homebrew/bin/brew shellenv)" && brew --version
   ```

3. 安裝 gcloud CLI：
   ```bash
   brew install --cask gcloud-cli
   ```

4. 驗證安裝：
   ```bash
   export PATH="$(brew --prefix)/share/google-cloud-sdk/bin:$PATH" && gcloud --version
   ```

### Google 官方安裝

使用 `run_shell_command` 執行：

```bash
node {skill_dir}/scripts/install-gcloud.mjs
```

> 腳本會將結果以 JSON 格式輸出到 stdout，日誌輸出到 stderr。

安裝完成後驗證：
```bash
export PATH="$HOME/google-cloud-sdk/bin:$PATH" && gcloud --version
```

若失敗，告知使用者手動安裝。

---

## Linux

直接使用 `run_shell_command` 執行（不提供安裝方式選項）：

```bash
node {skill_dir}/scripts/install-gcloud.mjs
```

> 腳本會將結果以 JSON 格式輸出到 stdout，日誌輸出到 stderr。

安裝完成後驗證：
```bash
export PATH="$HOME/google-cloud-sdk/bin:$PATH" && gcloud --version
```

若失敗，告知使用者手動安裝。
