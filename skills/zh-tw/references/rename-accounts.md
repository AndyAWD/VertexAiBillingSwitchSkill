# 重命名帳單帳戶 — 執行指令

> SKILL.md 步驟 R 的參考資料。
> 在使用者於步驟 1 選擇「重命名帳單帳戶」後讀取此檔案。

---

## R-1: 列出所有帳單帳戶

使用 `run_shell_command`:

```bash
gcloud billing accounts list --format="json(name,displayName,open)"
```

解析 JSON 輸出並向使用者顯示表格：

> **您的帳單帳戶：**
>
> | # | 顯示名稱 | 帳戶 ID | 狀態 |
> |---|---------|---------|------|
> | 1 | {displayName1} | {accountId1} | 開啟 |
> | 2 | {displayName2} | {accountId2} | 已關閉 |
> | ... | ... | ... | ... |

從 `name` 欄位中移除 `billingAccounts/` 前綴以取得 `{accountId}`（例如 `billingAccounts/012345-ABCDEF-678901` → `012345-ABCDEF-678901`）。

如果找不到任何帳戶，顯示：

> 找不到帳單帳戶。請確認您已登入正確的 Google 帳號。

然後中止。

---

## R-2: 選擇命名策略

**停止 — 你必須呼叫 ask_user。不要假設答案。等待回應後再繼續。**

使用 `ask_user`:

```json
{"questions":[{"question":"您想如何重命名帳單帳戶？","header":"命名策略","type":"choice","options":[{"label":"依到期日命名","description":"在 GCP Console 中查看每個帳戶的額度到期日，然後自動命名為 Trial_Exp_YYYYMMDD"},{"label":"自訂每個名稱","description":"為每個帳戶輸入自訂的顯示名稱"},{"label":"取消","description":"不重命名，返回上一步"}]}]}
```

### 「取消」

顯示：

> 已取消重命名。如需重試，請重新執行此技能。

然後中止。

### 「自訂每個名稱」

對每個**開啟中**的帳戶，使用 `ask_user`:

```json
{"questions":[{"question":"請輸入 [{displayName}]（帳戶 ID: {accountId}）的新顯示名稱。留空則跳過：","header":"重命名帳戶","type":"text","placeholder":"{displayName}"}]}
```

- 如果留空 → 跳過（保留目前名稱）
- 如果有輸入 → 儲存為新的顯示名稱

前往 **R-4（確認）**。

### 「依到期日命名」

前往 **R-3**。

---

## R-3: 收集到期日（僅適用於「依到期日命名」）

對每個**開啟中**的帳戶，顯示 Console 額度直接連結並詢問到期日：

> **帳戶：[{displayName}]**（ID: {accountId}）
> 在此查看額度：https://console.cloud.google.com/billing/{accountId}/credits

**停止 — 你必須呼叫 ask_user。不要假設答案。等待回應後再繼續。**

使用 `ask_user`:

```json
{"questions":[{"question":"請輸入 [{displayName}] 的額度到期日（格式：YYYY-MM-DD）。輸入 'skip' 保留目前名稱：","header":"到期日","type":"text","placeholder":"2026-05-01"}]}
```

### 驗證

- 如果輸入 `skip` → 保留目前名稱，處理下一個帳戶
- 如果為有效日期（YYYY-MM-DD 格式）→ 產生新名稱：`Trial_Exp_YYYYMMDD`（移除連字號，例如 `2026-05-01` → `Trial_Exp_20260501`）
- 如果格式無效 → 通知使用者並重新詢問：
  > 日期格式無效。請以 YYYY-MM-DD 格式輸入（例如 2026-05-01），或輸入 'skip'。

對所有開啟中的帳戶重複此步驟。前往 **R-4（確認）**。

---

## R-4: 確認重命名

顯示預覽表格：

> **重命名預覽：**
>
> | 帳戶 ID | 目前名稱 | 新名稱 |
> |---------|---------|--------|
> | {accountId1} | {oldName1} | {newName1} |
> | {accountId2} | {oldName2} | （已跳過） |
> | ... | ... | ... |

**停止 — 你必須呼叫 ask_user。不要假設答案。等待回應後再繼續。**

使用 `ask_user`:

```json
{"questions":[{"question":"是否套用上方顯示的重命名？","header":"確認重命名","type":"yesno"}]}
```

- **是** → 前往 R-5
- **否** → 顯示「已取消重命名。」然後中止

---

## R-5: 執行重命名

對每個有新名稱的帳戶，使用 `run_shell_command`:

```bash
gcloud billing accounts update {accountId} --display-name="{newName}"
```

### 錯誤處理

- **成功** → 記錄：`✅ 已重命名 {accountId} → {newName}`

- **`PERMISSION_DENIED`** → 顯示：
  > ❌ 帳戶 {accountId} 權限不足。您需要**帳單帳戶管理員**角色才能重命名帳戶。

- **指令不存在 / 不支援**（較舊的 gcloud 版本）→ 顯示：
  > ❌ 您的 gcloud 版本不支援 `gcloud billing accounts update`。請在 GCP Console 中手動重命名：
  > https://console.cloud.google.com/billing
  >
  > 提示：請參閱 [GCP 帳單帳戶管理](https://memo.jimmyliao.net/p/gcp-gcp-project-billing-account) 取得逐步操作指南。

  然後中止剩餘的重命名作業。

- **其他錯誤** → 顯示錯誤訊息並繼續處理下一個帳戶。

### 完成

處理完所有帳戶後，顯示：

> **重命名完成！**
>
> | 帳戶 ID | 結果 |
> |---------|------|
> | {accountId1} | ✅ → {newName1} |
> | {accountId2} | ⏭️ 已跳過 |
> | {accountId3} | ❌ {errorReason} |
>
> 驗證指令：`gcloud billing accounts list`
