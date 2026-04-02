# Changelog

All notable changes to this project will be documented in this file.

## [1.1.1] - 2026-04-03

### 🇺🇸 English

#### Added
- **Extension Support:** Added official support and instructions for installing via the `gemini extensions install` command in both English and Traditional Chinese documentation.

#### Fixed
- **Installation Paths:** Updated manual installation instructions and execution commands in README files to point to the correct subdirectories (`skills/vertex-ai-billing-switch-en` and `skills/vertex-ai-billing-switch-zh-tw`).
- **Hook Deployment Resolution:** Refactored `{skill_dir}` path resolution logic in `deploy-hook.md` to dynamically instruct the LLM on locating the hook script based on whether the user used the extension installer or manual copy.
- **Documentation Cleanup:** Removed redundant language tags in the Traditional Chinese README.

---

### 🇹🇼 繁體中文

#### 新增 (Added)
- **擴充功能安裝支援：** 在中英文說明文件中，正式加入並支援透過 `gemini extensions install` 指令安裝的步驟。

#### 修復 (Fixed)
- **安裝路徑修正：** 更新了 README 中的手動安裝說明與執行指令，確保指向正確的子目錄（`skills/vertex-ai-billing-switch-en` 與 `skills/vertex-ai-billing-switch-zh-tw`）。
- **Hook 部署路徑解析：** 重構了 `deploy-hook.md` 中的 `{skill_dir}` 路徑解析邏輯，讓 LLM 能夠根據使用者是透過擴充功能安裝或手動複製，動態找到正確的 Hook 腳本位置。
- **文件清理：** 移除了繁體中文版 README 裡手動複製區塊中多餘的語言標註。