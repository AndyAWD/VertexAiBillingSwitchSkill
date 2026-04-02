# 首次部署 — Hook 與設定

> 此為 SKILL.md Step 5 的參考文件。
> 僅在 `quick_switch = false`（首次設定）時執行這些動作。
> 當 `quick_switch = true` 時，跳過此檔案的所有內容。

---

## 建立目錄

使用 `run_shell_command`：

```bash
mkdir -p {home_dir}/.gemini/hooks
```

## 部署帳單切換 Hook

將 `{skill_dir}` 解析為實際路徑（根據使用者的安裝方式）：
- 若透過 Gemini CLI 安裝：`{home_dir}/.gemini/extensions/VertexAiBillingSwitchSkill/skills/vertex-ai-billing-switch-zh-tw`
- 若為手動安裝：`{home_dir}/.gemini/skills/vertex-ai-billing-switch-zh-tw`

使用 `run_shell_command` 將本 Skill 目錄下的 Hook 腳本複製到全域位置：

```bash
cp {skill_dir}/assets/vertex-ai-billing-switch-hook.mjs {home_dir}/.gemini/hooks/vertex-ai-billing-switch-hook.mjs
```

## 更新 settings.json

1. 使用 `read_file` 讀取 `{home_dir}/.gemini/settings.json`（若檔案不存在則從 `{}` 開始）
2. 解析 JSON
3. **非破壞性合併**以下內容（只新增/更新，不覆蓋其他設定）：

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
            "description": "自動檢查並切換 GCP 帳單帳戶，確保 API 額度充足"
          }
        ]
      }
    ]
  }
}
```

**合併規則：**
- 將 `security.auth.selectedType` 設為 `"vertex-ai"`（僅修改此值，不動其他任何參數）
- 若 `hooks.SessionStart` 已存在，檢查是否已有 `name === "vertex-ai-billing-switch-hook"` 的 hook
- 若已有 → 不重複新增
- 若沒有 → 將新的 matcher 物件 push 到 `SessionStart` 陣列
- **不修改** `model.name`（使用者自行用 `/model` 選擇）

4. 使用 `write_file` 寫回 `{home_dir}/.gemini/settings.json`（格式化為 2 空格縮排）
