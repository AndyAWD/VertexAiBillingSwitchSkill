# Changelog

All notable changes to this project will be documented in this file.

## [1.1.2] - 2026-04-04

### 🇺🇸 English

#### Changed
- **Skill Directory Rename:** Renamed skill subdirectories from `skills/vertex-ai-billing-switch-en` and `skills/vertex-ai-billing-switch-zh-tw` to `skills/en` and `skills/zh-tw` to reduce redundancy in the Gemini CLI skill list display (`vertex-ai-billing-switch-skill:en` instead of `vertex-ai-billing-switch-skill:vertex-ai-billing-switch-en`).
- **Invocation Command Update:** Updated all internal skill invocation references from `/vertex-ai-billing-switch-skill` to `/en` or `/zh-tw` to match the renamed skill folder names.
- **Path Fix:** Corrected `{skill_dir}` default path derivation in SKILL.md to use the correct skill subfolder name instead of the extension name.

---

### 🇹🇼 繁體中文

#### 變更 (Changed)
- **Skill 子目錄重新命名：** 將 `skills/vertex-ai-billing-switch-en` 與 `skills/vertex-ai-billing-switch-zh-tw` 重新命名為 `skills/en` 與 `skills/zh-tw`，減少 Gemini CLI skill 列表中顯示的冗餘前綴（由 `vertex-ai-billing-switch-skill:vertex-ai-billing-switch-en` 縮短為 `vertex-ai-billing-switch-skill:en`）。
- **呼叫指令更新：** 將 SKILL.md 內所有 `/vertex-ai-billing-switch-skill` 重新執行提示更新為 `/en` 或 `/zh-tw`，與重命名後的 skill 資料夾名稱一致。
- **路徑修正：** 修正 SKILL.md 中 `{skill_dir}` 預設值路徑，改用正確的 skill 子資料夾名稱（而非 extension 名稱）。

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
- **文件清理：** 移除了繁體中文版 README 裡手動複製區塊中多餘的語言標註。