# 自動建立 GCP 專案 — 執行指令

> 此為 SKILL.md Step 4 的參考文件（子步驟 4-B 至 4-E）。
> 在使用者透過 `ask_user` 輸入專案 ID 基礎名稱後讀取此檔案。

---

## 專案 ID 產生邏輯

1. 取得使用者輸入（若為空則使用 `gemini-vertex`）
2. 驗證：只允許小寫字母、數字、連字號；開頭必須是字母
3. 產生 6 位隨機後綴：
   ```bash
   node -e "process.stdout.write(Math.random().toString(36).substring(2, 8))"
   ```
4. 組合為 `{base}-{suffix}`，例如 `gemini-vertex-a3k9m2`
5. 確保總長度不超過 30 字元（若超過，截斷基礎名稱）

---

## 4-C: 建立專案

先告知使用者：

> 正在建立 GCP 專案 `{project_id}`...

使用 `run_shell_command`：

```bash
gcloud projects create {project_id} --name="{project_id}"
```

**錯誤處理：**
- **名稱衝突**（`ALREADY_EXISTS`）：重新產生隨機後綴並重試，最多 3 次
- **配額不足**（`QUOTA_EXCEEDED`）：告知使用者已達 GCP 專案數量上限，建議前往 Google Cloud Console 刪除舊專案或使用手動流程
- **權限不足**：告知使用者帳號可能沒有建立專案的權限，建議改用手動流程
- **其他錯誤**：顯示錯誤訊息，提供「手動建立」的備援指引

---

## 4-D: 連結帳單帳戶

使用 `run_shell_command`：

```bash
gcloud billing projects link {project_id} --billing-account={account_id} --quiet
```

驗證連結成功：

```bash
gcloud billing projects describe {project_id} --format="value(billingEnabled)"
```

確認回傳 `True`。

---

## 4-E: 確認訊息

顯示：

> 專案 `{project_id}` 建立成功，已連結帳單帳戶 [{displayName}]。

記錄 `{project_id}` 供後續步驟使用。進入 **Step 5**。
