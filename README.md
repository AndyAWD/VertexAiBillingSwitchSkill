# Vertex AI Billing Switch for Gemini CLI

[![Version](https://img.shields.io/badge/version-1.1.1-blue.svg)](./skills/vertex-ai-billing-switch-en/SKILL.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()

[繁體中文版](./README.zh-TW.md)

A **Gemini CLI Skill** that automates GCP Vertex AI authentication setup and deploys a global billing auto-switch Hook — helping newcomers get Vertex AI running with zero manual configuration.

---

> [!WARNING]
> **IMPORTANT DISCLAIMER**
>
> This tool is designed **only** for Google Cloud accounts **without any credit card or payment method attached**.
>
> If a payment method is attached to your account, unexpected charges may occur. **The authors are not responsible for any charges incurred.** Please verify your account has no payment method before proceeding.

---

## Features

- **Interactive setup wizard** — 7-step guided process, no manual configuration needed
- **Auto-create GCP project** — create a new GCP project via `gcloud` CLI without leaving the terminal
- **Quick switch mode** — returning users can switch GCP projects without re-authentication; switching Google accounts still opens a browser
- **Automatic gcloud installation** — detects and installs Google Cloud CLI if missing (Windows / macOS / Linux)
- **ADC authentication** — configures Application Default Credentials for Vertex AI
- **Billing auto-switch Hook** — deployed as a Gemini CLI `SessionStart` hook, runs automatically on every startup
- **Smart account switching** — scans available billing accounts and switches when quota is exhausted
- **Cross-platform** — supports Windows, macOS, and Linux
- **Non-destructive** — never overwrites existing `settings.json` keys; only adds what's needed
- **Bilingual** — available in English and Traditional Chinese

---

## Prerequisites

- [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed
- [Node.js](https://nodejs.org/) (for the Hook script at runtime)
- A Google Cloud account (**no credit cards attached to billing accounts**)
  - If you already have a GCP project: the skill will use it directly
  - If not: the skill can auto-create one for you (requires at least one billing account with credits)
  - Each billing account needs an active billing plan set up in Google AI Studio

---

## Quick Start

1. **Install the Skill:**

   **Method A: Install via Gemini CLI (Recommended)**
   ```bash
   gemini extensions install https://github.com/AndyAWD/VertexAiBillingSwitchSkill
   ```

   **Method B: Manual Installation**
   Copy the Skill directory to your Gemini CLI skills folder:

   *Windows (PowerShell)*:
   ```powershell
   Copy-Item -Path "skills\vertex-ai-billing-switch-en" -Destination "$env:USERPROFILE\.gemini\skills\" -Recurse -Force
   ```

   *macOS / Linux*:
   ```bash
   cp -r skills/vertex-ai-billing-switch-en ~/.gemini/skills/
   ```

2. In Gemini CLI, run:

   ```
   /vertex-ai-billing-switch-en run the skill workflow
   ```

3. Follow the interactive prompts — the skill will handle everything automatically.

4. After setup completes:
   - Type `/quit` to exit Gemini CLI
   - **Restart Gemini CLI**, then type `/auth` to switch to **Vertex AI** authentication mode
   - Type `/model` to choose your preferred model

---

## How It Works

### Setup Wizard

```
/vertex-ai-billing-switch-en run the skill workflow
        │
        ▼
  Step 0 ── Disclaimer confirmation
        │
        ▼
  Step 1 ── Environment detection
             ├─ All ready (returning user) → Switch project or Full reset
             │   └─ Switch project → Same account: skip to Step 4
             │                     → Switch account: Step 3 → Step 4
             └─ Not ready (first-time) → Continue full flow ↓
        │
        ▼
  Step 2 ── Check / auto-install gcloud CLI
        │
        ▼
  Step 3 ── GCP auth login
        │
        ▼
  Step 4 ── Get / Create GCP project
             ├─ Enter existing project ID
             └─ Auto-create via gcloud (detect billing → name → create → link)
        │
        ▼
  Step 5 ── GCP config + Gemini CLI deployment
             ├─ gcloud config set project
             ├─ Enable Vertex AI API
             ├─ gcloud auth application-default login (ADC)
             ├─ ~/.gemini/.env  (GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION)
             ├─ ~/.gemini/settings.json  (register Hook)  [first-time only]
             └─ ~/.gemini/hooks/vertex-ai-billing-switch-hook.mjs  [first-time only]
        │
        ▼
  Step 6 ── Verify all items → Done
```

### Billing Auto-Switch Hook (every Gemini CLI startup)

```
Gemini CLI starts → SessionStart Hook fires
        │
        ▼
  Check current billing account status
        │
        ├─ OK ──────────────────────────────► Continue normally
        │
        └─ Quota exhausted / Account closed
                │
                ▼
          Scan all available billing accounts
                │
                ▼
          Switch to an available account
                │
                ▼
          Verify link success → Continue
```

---

## What Gets Deployed

| File | Location | Purpose |
|------|----------|---------|
| `.env` | `~/.gemini/.env` | Sets `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION` |
| `settings.json` | `~/.gemini/settings.json` | Registers the `SessionStart` hook |
| Hook script | `~/.gemini/hooks/vertex-ai-billing-switch-hook.mjs` | Billing auto-switch logic |

---

## Repository Structure

```
VertexAiBillingSwitchSkill/
├── README.md                              # This file (English)
├── README.zh-TW.md                        # Traditional Chinese version
├── package.json                           # NPM package manifest
├── gemini-extension.json                  # Gemini CLI extension manifest
│
└── skills/                                # Gemini CLI Skills directory
    ├── vertex-ai-billing-switch-en/       # English Skill
    │   ├── SKILL.md                       # Skill definition (loaded by Gemini CLI)
    │   ├── references/                    # On-demand reference docs
    │   │   ├── install-gcloud.md          # Platform-specific gcloud installation
    │   │   ├── create-project.md          # Auto-create GCP project sub-flow
    │   │   └── deploy-hook.md             # First-time Hook deployment
    │   ├── assets/
    │   │   └── vertex-ai-billing-switch-hook.mjs
    │   └── scripts/
    │       ├── install-gcloud.mjs
    │       └── consume-credits.mjs
    │
    └── vertex-ai-billing-switch-zh-tw/    # Traditional Chinese Skill
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

## Testing the Hook

A `consume-credits.mjs` script is included to intentionally exhaust quota and verify the auto-switch mechanism works:

```bash
node skills/vertex-ai-billing-switch-en/scripts/consume-credits.mjs
```

The script sends large Vertex AI API requests in a loop until a `402`, `BILLING_DISABLED`, or quota-exceeded error is returned, which triggers the Hook on next Gemini CLI startup.

---

## License

MIT © 2024

See [LICENSE](./LICENSE) for details.
exceeded error is returned, which triggers the Hook on next Gemini CLI startup.

---

## License

MIT © 2024

See [LICENSE](./LICENSE) for details.
