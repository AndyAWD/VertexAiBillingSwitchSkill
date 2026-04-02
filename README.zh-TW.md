# Vertex AI Billing Switch for Gemini CLI

[![版本](https://img.shields.io/badge/版本-2.2.0-blue.svg)](./zh-TW/vertex-ai-billing-switch-skill/SKILL.md)
[![授權條款: MIT](https://img.shields.io/badge/授權條款-MIT-yellow.svg)](./LICENSE)
[![平台](https://img.shields.io/badge/平台-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()

[English Version](./README.md)

一個 **Gemini CLI Skill**，自動完成 GCP Vertex AI 認證設定並部署全域帳單自動切換 Hook——讓新手無需手動設定，即可啟用 Vertex AI。

---

> [!WARNING]
> **重要免責聲明**
>
> 本工具僅適用於**未綁定任何信用卡或付款方式**的 Google Cloud 帳號。
>
> 若帳號已綁定付款方式，可能產生非預期費用。**本工具作者對任何費用概不負責。** 使用前請確認帳號未綁定任何付款方式。

---

## 功能特色

- **互動式設定精靈** — 7 步驟引導流程，無需手動設定
- **自動建立 GCP 專案** — 透過 `gcloud` CLI 自動建立新 GCP 專案，不需離開終端機
- **快速切換模式** — 返回使用者可直接切換 GCP 專案，無需重新認證；切換 Google 帳號時才需開啟瀏覽器
- **自動安裝 gcloud** — 偵測並自動安裝 Google Cloud CLI（Windows / macOS / Linux）
- **ADC 認證設定** — 自動設定 Vertex AI 所需的應用程式預設憑證（Application Default Credentials）
- **帳單自動切換 Hook** — 以 Gemini CLI `SessionStart` Hook 形式部署，每次啟動自動執行
- **智能帳戶切換** — 額度不足時自動掃描可用帳單帳戶並切換
- **跨平台支援** — 支援 Windows、macOS 及 Linux
- **非破壞性更新** — 不覆蓋現有 `settings.json` 的其他設定，僅新增必要內容
- **雙語版本** — 提供繁體中文與英文版本

---

## 使用需求

- 已安裝 [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Node.js](https://nodejs.org/)（執行 Hook 腳本所需）
- 一個 Google Cloud 帳號（**帳單帳戶未綁定信用卡**）
  - 若已有 GCP 專案：Skill 會直接使用
  - 若沒有：Skill 可自動建立（需要至少一個有抵免額的帳單帳戶）
  - 每個帳單帳戶需在 Google AI Studio 設定有效的帳單方案

---

## 快速開始

1. 將 Skill 目錄複製到 Gemini CLI 的 skills 資料夾：

   **Windows (PowerShell)**:
   ```powershell
   # 繁體中文版
   Copy-Item -Path "zh-TW\vertex-ai-billing-switch-skill" -Destination "$env:USERPROFILE\.gemini\skills\" -Recurse -Force
   ```

   **macOS / Linux**:
   ```bash
   # 繁體中文版
   cp -r zh-TW/vertex-ai-billing-switch-skill ~/.gemini/skills/
   ```

2. 在 Gemini CLI 中執行：

   ```
   /vertex-ai-billing-switch-skill 執行這個 Skill 的流程
   ```

3. 依照互動式提示操作——Skill 會自動處理所有設定。

4. 設定完成後：
   - 輸入 `/quit` 離開 Gemini CLI
   - **重新啟動 Gemini CLI** 後，輸入 `/auth` 切換至 **Vertex AI** 認證模式
   - 輸入 `/model` 選擇你想使用的模型

---

## 運作原理

### 設定精靈

```
/vertex-ai-billing-switch-skill 執行這個 Skill 的流程
        │
        ▼
  Step 0 ── 免責宣告確認
        │
        ▼
  Step 1 ── 環境偵測
             ├─ 全部就緒（返回使用者）→ 切換專案 或 完整重設
             │   └─ 切換專案 → 同帳號：直接到 Step 4
             │               → 切換帳號：Step 3 → Step 4
             └─ 未就緒（首次使用者）→ 繼續完整流程 ↓
        │
        ▼
  Step 2 ── 檢查 / 自動安裝 gcloud CLI
        │
        ▼
  Step 3 ── GCP 認證登入
        │
        ▼
  Step 4 ── 取得 / 建立 GCP 專案
             ├─ 輸入現有專案 ID
             └─ 透過 gcloud 自動建立（偵測帳單 → 命名 → 建立 → 連結）
        │
        ▼
  Step 5 ── GCP 專案設定 + Gemini CLI 部署
             ├─ gcloud config set project
             ├─ 啟用 Vertex AI API
             ├─ gcloud auth application-default login（ADC）
             ├─ ~/.gemini/.env（GOOGLE_CLOUD_PROJECT、GOOGLE_CLOUD_LOCATION）
             ├─ ~/.gemini/settings.json（註冊 Hook）[僅首次]
             └─ ~/.gemini/hooks/vertex-ai-billing-switch-hook.mjs [僅首次]
        │
        ▼
  Step 6 ── 驗證所有項目 → 完成
```

### 帳單自動切換 Hook（每次 Gemini CLI 啟動時執行）

```
Gemini CLI 啟動 → SessionStart Hook 觸發
        │
        ▼
  檢查當前帳單帳戶狀態
        │
        ├─ 正常 ─────────────────────────────► 繼續使用
        │
        └─ 額度不足 / 帳戶關閉
                │
                ▼
          掃描所有可用帳單帳戶
                │
                ▼
          切換至可用帳戶
                │
                ▼
          驗證連結成功 → 繼續使用
```

---

## 部署的檔案說明

| 檔案 | 位置 | 用途 |
|------|------|------|
| `.env` | `~/.gemini/.env` | 設定 `GOOGLE_CLOUD_PROJECT` 及 `GOOGLE_CLOUD_LOCATION` |
| `settings.json` | `~/.gemini/settings.json` | 註冊 `SessionStart` Hook |
| Hook 腳本 | `~/.gemini/hooks/vertex-ai-billing-switch-hook.mjs` | 帳單自動切換邏輯 |

---

## 專案結構

```
VertexAiBillingSwitchSkill/
├── README.md                              # 英文版說明
├── README.zh-TW.md                        # 本檔案（繁體中文）
│
├── en/                                    # 英文版 Skill
│   └── vertex-ai-billing-switch-skill/    # 複製此資料夾到 ~/.gemini/skills/
│       ├── SKILL.md                       # Skill 定義（由 Gemini CLI 載入）
│       ├── references/                    # 按需讀取的參考文件
│       │   ├── install-gcloud.md          # 各平台 gcloud 安裝指令
│       │   ├── create-project.md          # 自動建立 GCP 專案子流程
│       │   └── deploy-hook.md             # 首次 Hook 部署
│       ├── assets/
│       │   └── vertex-ai-billing-switch-hook.mjs
│       └── scripts/
│           ├── install-gcloud.mjs
│           └── consume-credits.mjs
│
└── zh-TW/                                 # 繁體中文版 Skill
    └── vertex-ai-billing-switch-skill/    # 複製此資料夾到 ~/.gemini/skills/
        ├── SKILL.md                       # Skill 定義（由 Gemini CLI 載入）
        ├── references/                    # 按需讀取的參考文件
        │   ├── install-gcloud.md
        │   ├── create-project.md
        │   └── deploy-hook.md
        ├── assets/
        │   └── vertex-ai-billing-switch-hook.mjs
        └── scripts/
            ├── install-gcloud.mjs
            └── consume-credits.mjs
```

---

## 測試 Hook 切換機制

專案內附有 `consume-credits.mjs` 腳本，可主動消耗額度以驗證自動切換機制是否正常運作：

```bash
node zh-TW/vertex-ai-billing-switch-skill/scripts/consume-credits.mjs
```

腳本會循環發送大型 Vertex AI API 請求，直到收到 `402`、`BILLING_DISABLED` 或配額超出錯誤為止。下次啟動 Gemini CLI 時，Hook 即會自動觸發帳戶切換。

---

## 授權條款

MIT © 2024

詳見 [LICENSE](./LICENSE) 檔案。
