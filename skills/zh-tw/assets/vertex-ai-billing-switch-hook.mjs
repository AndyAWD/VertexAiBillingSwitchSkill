import { execSync } from 'child_process';
import { readFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';
import os from 'os';

/**
 * GCP 帳單自動切換 Hook（SessionStart）
 *
 * 每次啟動 Gemini CLI 時自動執行：
 * 1. 確認 gcloud 已安裝並登入
 * 2. 偵測目前 GCP 專案
 * 3. 測試帳單額度是否充足
 * 4. 額度不足時自動掃描並切換帳戶
 */

const GEMINI_DIR = join(os.homedir(), '.gemini');
const USED_FILE = join(GEMINI_DIR, 'used_accounts.txt');
const log = (msg, colorCode = '0') => console.error(`\x1b[${colorCode}m${msg}\x1b[0m`);

// Gemini CLI hook 協定：stdout 只能輸出一個 JSON 物件，日誌寫 stderr
let _hookOutputDone = false;
const hookOutput = (msg) => {
  if (!_hookOutputDone) {
    _hookOutputDone = true;
    process.stdout.write(JSON.stringify({ systemMessage: msg }) + '\n');
  }
};
// 確保無論如何退出，stdout 都有合法 JSON
process.on('exit', () => {
  if (!_hookOutputDone) hookOutput('');
});

/**
 * 執行指令並抓取詳細錯誤（包含 stderr）
 */
function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error) {
    throw {
      message: error.message,
      stdout: error.stdout?.toString(),
      stderr: error.stderr?.toString(),
    };
  }
}

/**
 * 嘗試在常見安裝路徑中找到 gcloud CLI 並加入 PATH
 *
 * 許多安裝方式（curl 腳本、Homebrew、winget）會將 gcloud 放在
 * 非標準路徑，而 Gemini CLI 以非互動式 shell 執行 Hook，
 * 不會載入 .zshrc/.bashrc 中的 PATH 設定。
 * 此函式會自動搜尋常見路徑並補上 PATH。
 */
function resolveGcloudPath() {
  try {
    execSync('gcloud --version', { stdio: 'ignore' });
    return true;
  } catch (e) { /* 不在 PATH 中，繼續搜尋 */ }

  const isWin = os.platform() === 'win32';
  const sep = isWin ? ';' : ':';
  const bin = isWin ? 'gcloud.cmd' : 'gcloud';
  const homebrewPrefix = process.env.HOMEBREW_PREFIX || (
    process.arch === 'arm64' ? '/opt/homebrew' : '/usr/local'
  );

  const candidates = [
    join(os.homedir(), 'google-cloud-sdk', 'bin'),
    join(homebrewPrefix, 'share', 'google-cloud-sdk', 'bin'),
    join(homebrewPrefix, 'bin'),
    '/usr/local/google-cloud-sdk/bin',
    '/snap/google-cloud-cli/current/bin',
    'C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin',
    join(os.homedir(), 'AppData', 'Local', 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin'),
  ];

  for (const dir of candidates) {
    try {
      if (existsSync(join(dir, bin))) {
        process.env.PATH = `${dir}${sep}${process.env.PATH}`;
        execSync('gcloud --version', { stdio: 'ignore' });
        log(`🔧 已偵測到 gcloud CLI 於: ${dir}`, '33');
        return true;
      }
    } catch (e) { /* 繼續 */ }
  }
  return false;
}

/**
 * 檢查帳單帳戶是否為開啟狀態
 *
 * 透過 gcloud billing accounts describe 查詢帳戶的 open 欄位：
 * - open: true  → 帳戶活躍，可使用付費服務
 * - open: false → 帳戶已關閉或被停用（例如免費額度耗盡）
 */
function isAccountOpen(accountId) {
  try {
    const openStatus = execSync(
      `gcloud billing accounts describe ${accountId} --format="value(open)"`,
      { encoding: 'utf8' }
    ).trim();
    return openStatus.toLowerCase() === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * 讀取 Gemini CLI 透過 stdin 傳入的 hook 事件資料（跨平台）
 */
async function readEventData() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve({});
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      try {
        resolve(data.trim() ? JSON.parse(data.trim()) : {});
      } catch (e) {
        resolve({});
      }
    });
    process.stdin.on('error', () => resolve({}));
  });
}

/**
 * 環境檢查：確認 gcloud 已安裝並登入
 */
function ensureGcloudAccount() {
  try {
    if (!resolveGcloudPath()) {
      log('❌ 尚未安裝 gcloud CLI。請至官網下載: https://cloud.google.com/sdk', '31');
      hookOutput('❌ 尚未安裝 gcloud CLI');
      process.exit(0);
    }

    let activeAccount = '';
    try {
      activeAccount = execSync('gcloud config get-value account', { encoding: 'utf8' }).trim();
    } catch (e) {
      /* ignore */
    }

    if (!activeAccount || activeAccount === '(unset)') {
      log('⚠️ 尚未登入 gcloud，跳過帳單檢查。', '33');
      hookOutput('⚠️ 尚未登入 gcloud，請先執行 gcloud auth login');
      process.exit(0);
    }

    log(`👤 目前登入身分: ${activeAccount}`, '35');
    return activeAccount;
  } catch (error) {
    log(`身分檢查失敗: ${error.message}`, '31');
    hookOutput(`❌ 身分檢查失敗: ${error.message}`);
    process.exit(0);
  }
}

async function run() {
  // Source 過濾：僅在 /clear 時跳過帳單檢查
  const eventData = await readEventData();
  const source = eventData.source || 'startup';
  if (source === 'clear') {
    log(`ℹ️ SessionStart source="clear"，跳過帳單檢查。`, '90');
    hookOutput('');
    return;
  }

  // 認證模式檢查：只在 Vertex AI 認證時才執行帳單管理
  try {
    const settingsPath = join(GEMINI_DIR, 'settings.json');
    if (existsSync(settingsPath)) {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
      const authType = settings?.security?.auth?.selectedType ?? '';
      if (authType && !authType.toLowerCase().includes('vertex')) {
        log(`ℹ️ 目前為非 Vertex AI 認證模式（${authType}），跳過帳單檢查。`, '90');
        hookOutput('');
        return;
      }
    }
  } catch (e) {
    // 無法讀取設定，繼續執行（保守預設）
  }

  ensureGcloudAccount();

  try {
    // --- 【動態專案偵測】 ---
    let targetProject = '';
    try {
      targetProject = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
      if (!targetProject || targetProject === '(unset)') {
        log('❌ 偵測不到目前活躍的 GCP 專案 ID！', '31');
        hookOutput('❌ 偵測不到 GCP 專案 ID');
        process.exit(0);
      }
    } catch (e) {
      log('無法偵測目前的 GCP 專案。', '31');
      hookOutput('❌ 無法偵測 GCP 專案');
      process.exit(0);
    }
    log(`📂 目前活躍專案: ${targetProject}`, '36');

    if (!existsSync(USED_FILE)) appendFileSync(USED_FILE, '');
    const usedAccounts = readFileSync(USED_FILE, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    log('[Gemini CLI] 啟動帳戶管理系統 (偵測/偵錯模式)...', '36');

    // --- 【檢查目前帳單連結狀態】 ---
    let currentAccountFull = execSync(
      `gcloud billing projects describe ${targetProject} --format="value(billingAccountName)"`,
      { encoding: 'utf8' }
    ).trim();
    const currentAccountId = currentAccountFull.split('/').pop();
    let currentDisplayName = '';
    try {
      currentDisplayName = execSync(
        `gcloud billing accounts describe ${currentAccountId} --format="value(displayName)"`,
        { encoding: 'utf8' }
      ).trim();
    } catch (e) { /* ignore */ }
    const currentLabel = currentDisplayName
      ? `帳戶名稱：${currentDisplayName} / 帳戶 ID：${currentAccountId}`
      : `帳戶 ID：${currentAccountId}`;

    // --- 【前置檢查：帳單是否已啟用】 ---
    let billingEnabled = true;
    try {
      const billingStatus = execSync(
        `gcloud billing projects describe ${targetProject} --format="value(billingEnabled)"`,
        { encoding: 'utf8' }
      ).trim();
      billingEnabled = billingStatus.toLowerCase() === 'true';
    } catch (e) {
      billingEnabled = false;
    }

    if (!billingEnabled) {
      log(`🪫 帳單已停用。${currentLabel}，需要切換。`, '33');
      if (currentAccountId && !usedAccounts.includes(currentAccountId)) {
        appendFileSync(USED_FILE, `${currentAccountId}\n`);
      }
    } else {
      // --- 【帳戶狀態檢查（取代 gemini -p "hi" 測試）】 ---
      if (isAccountOpen(currentAccountId)) {
        log(`✅ ${currentLabel} 帳單已啟用且帳戶開啟，無需切換。`, '32');
        hookOutput(`✅ ${currentLabel} 帳單正常`);
        return;
      }
      log(`🪫 ${currentLabel} 帳戶已關閉，需要切換。`, '33');
      if (!usedAccounts.includes(currentAccountId)) {
        appendFileSync(USED_FILE, `${currentAccountId}\n`);
      }
    }

    // --- 【切換邏輯】 ---
    log('正在掃描可用帳戶...', '90');
    const billingJson = JSON.parse(
      execSync('gcloud billing accounts list --format="json"', { encoding: 'utf8' })
    );

    let linkErrorType = null;

    for (const accObj of billingJson) {
      const accId = accObj.name.split('/').pop();
      const displayName = accObj.displayName || '未命名帳戶';

      if (usedAccounts.includes(accId) || accId === currentAccountId) continue;

      // 先檢查帳戶是否開啟，避免浪費時間連結已關閉的帳戶
      if (!isAccountOpen(accId)) {
        log(`⏭️ 帳戶 [${displayName}] 已關閉，跳過。`, '90');
        appendFileSync(USED_FILE, `${accId}\n`);
        continue;
      }

      log(`🔋 嘗試啟用帳戶: [${displayName}] (${accId})`, '34');

      try {
        safeExec(
          `gcloud billing projects link ${targetProject} --billing-account=${accId} --quiet`
        );
        log('⏳ 等待 5 秒同步...', '90');
        await new Promise((r) => setTimeout(r, 5000));

        // 驗證連結是否成功
        const billingStatus = execSync(
          `gcloud billing projects describe ${targetProject} --format="value(billingEnabled)"`,
          { encoding: 'utf8' }
        ).trim();

        if (billingStatus.toLowerCase() === 'true') {
          log(`✅ 成功切換至帳戶: [${displayName}]。服務已恢復。`, '32');
          hookOutput(`🔄 已切換至帳戶 [${displayName}]，服務已恢復`);
          return;
        } else {
          log(`🪫 帳戶 [${displayName}] 連結後帳單未啟用，跳過。`, '33');
          appendFileSync(USED_FILE, `${accId}\n`);
        }
      } catch (err) {
        const errMsg = err.stderr || err.message || '';
        if (errMsg.includes('FAILED_PRECONDITION')) {
          linkErrorType = 'PRECONDITION';
        } else if (errMsg.includes('PERMISSION_DENIED')) {
          linkErrorType = 'PERMISSION';
        }
        log(
          `❌ 無法連結帳戶 [${displayName}]: ${errMsg.slice(0, 100)}`,
          '31'
        );
      }
    }

    if (linkErrorType === 'PRECONDITION') {
      log('\n❌ 警報：無法連結帳單！', '31');
      log('   可能原因 1：【專案數量已達配額上限】。', '33');
      log('   可能原因 2：【該帳單未綁定付款方式】。', '33');
      log('💡 解決方法：請前往 GCP 控制台 (https://console.cloud.google.com/billing) 刪除不用的專案以釋放配額，或確認帳單已綁定有效信用卡。', '36');
      hookOutput('❌ 帳單連結失敗 (配額滿或缺付款方式)，請至 GCP 檢查');
    } else if (linkErrorType === 'PERMISSION') {
      log('\n❌ 警報：權限不足，無法連結帳單！', '31');
      log('💡 解決方法：請確認您目前登入的 Google 帳號擁有該帳單的「結算帳戶管理員」權限。', '36');
      hookOutput('❌ 權限不足，無法連結帳單');
    } else {
      log('❌ 警報：名下所有帳戶皆已耗盡或無法連結！', '31');
      hookOutput('❌ 所有帳戶皆已耗盡或無法連結');
    }
    process.exit(0);
  } catch (err) {
    log(`致命錯誤: ${err.message}`, '31');
    hookOutput(`❌ 帳單檢查異常: ${err.message}`);
    process.exit(0);
  }
}

run();
