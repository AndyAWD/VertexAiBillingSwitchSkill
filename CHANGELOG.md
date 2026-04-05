# Changelog

All notable changes to this project will be documented in this file.

## [1.3.1] - 2026-04-05

### 🇺🇸 English

#### Documentation
- **README:** Updated translation guide to include `config-and-verify.md`.

---

### 🇹🇼 繁體中文

#### 文件 (Documentation)
- **README：** 更新翻譯指南以包含 `config-and-verify.md`。

---

## [1.3.0] - 2026-04-05

### 🇺🇸 English

#### Added
- **Skill Execution:** Added "Deploy Hook Only" scenario for users with pre-configured Vertex AI credentials.

#### Fixed
- **Authentication:** Detect missing Application Default Credentials (ADC) and provide a recovery guide using `--no-launch-browser`.

#### Changed
- **Internal:** Optimized `SKILL.md` by extracting non-interactive steps and compressing JSON configurations.

---

### 🇹🇼 繁體中文

#### 新增 (Added)
- **技能執行：** 新增「僅部署 Hook」情境，提供已完成 Vertex AI 認證設定的使用者快速部署。

#### 修復 (Fixed)
- **驗證設定：** 偵測缺少 ADC 憑證的問題，並提供搭配 `--no-launch-browser` 的復原指引。

#### 變更 (Changed)
- **內部：** 最佳化 `SKILL.md` 結構，抽離無互動步驟並壓縮 JSON 設定以提高效率。

---

## [1.2.3] - 2026-04-05

### 🇺🇸 English

#### Documentation
- **Quick Start:** Reorganized instructions to clearly distinguish between standard terminal commands and Gemini CLI commands.

### 🇹🇼 Traditional Chinese

#### 說明文件
- **快速開始：** 重新組織說明內容，清楚區分一般終端機指令與 Gemini CLI 指令。

## [1.2.2] - 2026-04-05

### 🇺🇸 English

#### Fixed
- **Hook Deployment:** Updated instruction to auto-upgrade legacy string-based hook configurations to the current object-based format to prevent schema validation crashes on macOS.

---

### 🇹🇼 繁體中文

#### 修復 (Fixed)
- **Hook 部署：** 更新說明，自動將舊版字串格式的 Hook 設定升級為目前的物件格式，防止在 macOS 上發生 Schema 驗證崩潰。

---

## [1.2.1] - 2026-04-05

### 🇺🇸 English

#### Added
- **Update Command:** Added instructions for updating the extension via `gemini extensions update` in the Quick Start section.

#### Changed
- **Documentation Alignment:** Realigned the Quick Start section format in README.md to match the simplified Traditional Chinese version for better consistency.

---

### 🇹🇼 繁體中文

#### 新增 (Added)
- **更新指令：** 在「快速開始」區段中新增了透過 `gemini extensions update` 更新擴充功能的指令與說明。

#### 變更 (Changed)
- **格式優化：** 重新調整 README.zh-TW.md 的「快速開始」區段格式為直覺的四步驟編號清單，並同步更新至英文版文件以保持一致性。

---

## [1.1.2] - 2026-04-04

### 🇺🇸 English

#### Changed
- **Skill Directory Rename:** Renamed skill subdirectories from `skills/vertex-ai-billing-switch-en` and `skills/vertex-ai-billing-switch-zh-tw` to `skills/en` and `skills/zh-tw` to reduce redundancy in the Gemini CLI skill list display (`vertex-ai-billing-switch-skill:en` instead of `vertex-ai-billing-switch-skill:vertex-ai-billing-switch-en`).
- **Invocation Command Update:** Updated all internal skill invocation references from `/vertex-ai-billing-switch-skill` to `/en` or `/zh-tw` to match the renamed skill folder names.
- **Path Fix:** Corrected `{skill_dir}` default path derivation in SKILL.md to use the correct skill subfolder name instead of the extension name.

---

### 🇹🇼 繁體中文

#### 新增 (Added)
- **多語系貢獻指南：** 在 README 中新增貢獻指南與 AI 翻譯提示詞，方便使用者擴展其他語系版本。

#### 變更 (Changed)
- **Skill 子目錄重新命名：** 將 `skills/vertex-ai-billing-switch-en` 與 `skills/vertex-ai-billing-switch-zh-tw` 重新命名為 `skills/en` 與 `skills/zh-tw`，減少 Gemini CLI skill 列表中顯示的冗餘前綴。
- **呼叫指令更新：** 將 SKILL.md 內所有呼叫提示更新為 `/en` 或 `/zh-tw`，與重命名後的資料夾名稱一致。
- **路徑修正：** 修正 SKILL.md 中 `{skill_dir}` 預設值路徑，改用正確的 skill 子資料夾名稱。

#### 修復 (Fixed)
- **Hook 錯誤處理：** 增強 Hook 腳本在帳單連結失敗時的錯誤提示訊息，提供更清楚的排錯指引。
- **文件清理：** 移除中英文版 README 中 License 章節的重複內容。

---

## [1.1.1] - 2026-04-03

### 🇺🇸 English

#### Added
- **Extension Support:** Added official support and instructions for installing via the `gemini extensions install` command in both English and Traditional Chinese documentation.

#### Fixed
- **Installation Paths:** Updated manual installation instructions and execution commands in README files to point to the correct subdirectories (`skills/en` and `skills/zh-tw`).
- **Hook Deployment Resolution:** Refactored `{skill_dir}` path resolution logic in `deploy-hook.md` to dynamically instruct the LLM on locating the hook script based on whether the user used the extension installer or manual copy.
- **Documentation Cleanup:** Removed redundant language tags in the Traditional Chinese README.

---

### 🇹🇼 繁體中文

#### 新增 (Added)
- **擴充功能安裝支援：** 在中英文說明文件中，正式加入並支援透過 `gemini extensions install` 指令安裝的步驟。

#### 修復 (Fixed)
- **安裝路徑修正：** 更新了 README 中的手動安裝說明與執行指令，確保指向正確的子目錄（`skills/en` 與 `skills/zh-tw`）。
- **Hook 部署路徑解析：** 重構了 `deploy-hook.md` 中的 `{skill_dir}` 路徑解析邏輯，讓 LLM 能夠根據使用者是透過擴充功能安裝或手動複製，動態找到正確的 Hook 腳本位置。
- **文件清理：** 移除了繁體中文版 README 裡手動複製區塊中多餘的語言標註。README 裡手動複製區塊中多餘的語言標註。