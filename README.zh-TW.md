# Vertex AI Billing Switch for Gemini CLI

[![版本](https://img.shields.io/badge/版本-1.2.3-blue.svg)](./skills/zh-tw/SKILL.md)
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

### 在一般的終端機（或命令提示字元）中輸入：

1. **安裝 Skill：**

   ```bash
   gemini extensions install https://github.com/AndyAWD/VertexAiBillingSwitchSkill
   ```

2. **更新 Skill：**

   ```bash
   gemini extensions update vertex-ai-billing-switch-skill
   ```

### 在 Gemini CLI 中輸入：

1. **執行 Skill：**

   ```
   /vertex-ai-billing-switch-skill:zh-tw 執行這個 Skill 的流程
   ```

2. 設定完成後：
   - 輸入 `/quit` 離開 Gemini CLI
   - **重新啟動 Gemini CLI** 後，輸入 `/auth` 切換至 **Vertex AI** 認證模式
   - 輸入 `/model` 選擇你想使用的模型

---

## 運作原理

### 設定精靈

```
/zh-tw 執行這個 Skill 的流程
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
├── package.json                           # NPM package manifest
├── gemini-extension.json                  # Gemini CLI extension manifest
│
└── skills/                                # Gemini CLI Skills 目錄
    ├── en/       # 英文版 Skill
    │   ├── SKILL.md                       # Skill 定義（由 Gemini CLI 載入）
    │   ├── references/                    # 按需讀取的參考文件
    │   │   ├── install-gcloud.md          # 各平台 gcloud 安裝指令
    │   │   ├── create-project.md          # 自動建立 GCP 專案子流程
    │   │   └── deploy-hook.md             # 首次 Hook 部署
    │   ├── assets/
    │   │   └── vertex-ai-billing-switch-hook.mjs
    │   └── scripts/
    │       ├── install-gcloud.mjs
    │       └── consume-credits.mjs
    │
    └── zh-tw/    # 繁體中文版 Skill
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

## 貢獻新語言版本

想為這個 Skill 新增你的語言版本嗎？只需要翻譯幾個 Markdown 檔案，程式碼部分直接複製即可，不需要任何工程技能。

### 需要處理的檔案

| 檔案 | 動作 |
|------|------|
| `skills/en/SKILL.md` | 翻譯 + 修改路徑 |
| `skills/en/references/deploy-hook.md` | 翻譯 + 修改路徑 |
| `skills/en/references/create-project.md` | 翻譯 |
| `skills/en/references/install-gcloud.md` | 翻譯 |
| `skills/en/assets/vertex-ai-billing-switch-hook.mjs` | 直接複製，不需修改 |
| `skills/en/scripts/install-gcloud.mjs` | 直接複製，不需修改 |
| `skills/en/scripts/consume-credits.mjs` | 直接複製，不需修改 |

### 使用 AI 一鍵完成

將以下提示詞複製給 AI，把 `[LANG_CODE]` 換成你的語系代碼（例如 `ja`），把 `【目標語言】` 換成語言名稱（例如「日文」）：

````
我想為這個 Gemini CLI Skill 新增【目標語言】翻譯版本（語系代碼：[LANG_CODE]）。

## 需要翻譯的檔案
請將以下檔案的 Markdown 內文（`---` frontmatter 區塊以下的部分）從英文翻譯為【目標語言】：
- `skills/en/SKILL.md`
- `skills/en/references/deploy-hook.md`
- `skills/en/references/create-project.md`
- `skills/en/references/install-gcloud.md`

## 翻譯規則（必須遵守）
- 所有程式碼區塊（``` 包住的內容）**不翻譯**，保持原樣
- 所有 JSON 物件**不翻譯**，key 和 value 都不動
- 所有變數佔位符如 `{home_dir}`、`{project_id}`、`{skill_dir}` **不翻譯**，保持原樣
- 所有 Markdown 標題（##）、表格、格式符號**不修改**
- 只翻譯人類可讀的說明文字、UI 字串（問題文字、選項標籤、描述、提示訊息）

## 翻譯完成後，套用以下精確字串替換

**在 `SKILL.md` frontmatter 中替換：**
- `name: en` → `name: [LANG_CODE]`

**在 `SKILL.md` 內文中替換以下 3 個字串：**
1. `{home_dir}/.gemini/skills/en` → `{home_dir}/.gemini/skills/[LANG_CODE]`
2. `/en run the skill workflow` → `/[LANG_CODE] 【翻譯後的執行指令】`
3. `` run `/en run the skill workflow` `` → `` run `/[LANG_CODE] 【翻譯後的執行指令】` ``

**在 `references/deploy-hook.md` 中替換以下 2 個字串：**
1. `extensions/VertexAiBillingSwitchSkill/skills/en` → `extensions/VertexAiBillingSwitchSkill/skills/[LANG_CODE]`
2. `/.gemini/skills/en` → `/.gemini/skills/[LANG_CODE]`

## 不需要翻譯的檔案（直接複製）
以下程式碼檔案**直接複製，不做任何修改**：
- `skills/en/assets/vertex-ai-billing-switch-hook.mjs`
- `skills/en/scripts/install-gcloud.mjs`
- `skills/en/scripts/consume-credits.mjs`

## 輸出目錄結構
所有檔案儲存在 `skills/[LANG_CODE]/` 下，結構如下：
```
skills/[LANG_CODE]/
├── SKILL.md
├── references/
│   ├── deploy-hook.md
│   ├── create-project.md
│   └── install-gcloud.md
├── assets/
│   └── vertex-ai-billing-switch-hook.mjs
└── scripts/
    ├── install-gcloud.mjs
    └── consume-credits.mjs
```

## 完成前自我檢查
- [ ] `SKILL.md` frontmatter 的 `name` 已改為 `[LANG_CODE]`
- [ ] 所有翻譯後的檔案中，`skills/en` 已全部替換為 `skills/[LANG_CODE]`，沒有殘留
- [ ] `SKILL.md` 中沒有殘留 `/en `（作為 Skill 指令的用法）
- [ ] 所有 `.mjs` 檔案內容與 `skills/en/` 的原始檔完全相同
````

翻譯完成後，開個 Pull Request 提交 `skills/[LANG_CODE]/` 目錄即可！

---

## 測試 Hook 切換機制

專案內附有 `consume-credits.mjs` 腳本，可主動消耗額度以驗證自動切換機制是否正常運作：

```bash
node skills/zh-tw/scripts/consume-credits.mjs
```

腳本會循環發送大型 Vertex AI API 請求，直到收到 `402`、`BILLING_DISABLED` 或配額超出錯誤為止。下次啟動 Gemini CLI 時，Hook 即會自動觸發帳戶切換。

---

## 授權條款

MIT © 2024

詳見 [LICENSE](./LICENSE) 檔案。
