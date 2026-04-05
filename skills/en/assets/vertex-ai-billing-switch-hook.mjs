import { execSync } from 'child_process';
import { readFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';
import os from 'os';

/**
 * GCP Billing Auto-Switch Hook (SessionStart)
 *
 * Runs automatically on every Gemini CLI startup:
 * 1. Verify gcloud is installed and logged in
 * 2. Detect current GCP project
 * 3. Test billing quota availability
 * 4. Auto-scan and switch accounts if quota is exhausted
 */

const GEMINI_DIR = join(os.homedir(), '.gemini');
const USED_FILE = join(GEMINI_DIR, 'used_accounts.txt');
const log = (msg, colorCode = '0') => console.error(`\x1b[${colorCode}m${msg}\x1b[0m`);

// Gemini CLI hook protocol: stdout must only output a single JSON object, logs go to stderr
let _hookOutputDone = false;
const hookOutput = (msg) => {
  if (!_hookOutputDone) {
    _hookOutputDone = true;
    process.stdout.write(JSON.stringify({ systemMessage: msg }) + '\n');
  }
};
// Ensure valid JSON is always written to stdout regardless of exit path
process.on('exit', () => {
  if (!_hookOutputDone) hookOutput('');
});

/**
 * Execute command and capture detailed errors (including stderr)
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
 * Attempt to locate gcloud CLI in common installation paths and add to PATH
 *
 * Many installation methods (curl script, Homebrew, winget) place gcloud in
 * non-standard paths. Gemini CLI runs Hooks in a non-interactive shell that
 * does not load .zshrc/.bashrc PATH settings.
 * This function searches common paths and patches PATH accordingly.
 */
function resolveGcloudPath() {
  try {
    execSync('gcloud --version', { stdio: 'ignore' });
    return true;
  } catch (e) { /* not in PATH, continue searching */ }

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
        log(`🔧 Detected gcloud CLI at: ${dir}`, '33');
        return true;
      }
    } catch (e) { /* continue */ }
  }
  return false;
}

/**
 * Check if a billing account is in open state
 *
 * Queries the account's 'open' field via gcloud billing accounts describe:
 * - open: true  → Account is active and can use paid services
 * - open: false → Account is closed or suspended (e.g., free credits exhausted)
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
 * Read hook event data passed by Gemini CLI via stdin (cross-platform)
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
 * Environment check: verify gcloud is installed and logged in
 */
function ensureGcloudAccount() {
  try {
    if (!resolveGcloudPath()) {
      log('❌ gcloud CLI is not installed. Please download it from: https://cloud.google.com/sdk', '31');
      hookOutput('❌ gcloud CLI is not installed');
      process.exit(0);
    }

    let activeAccount = '';
    try {
      activeAccount = execSync('gcloud config get-value account', { encoding: 'utf8' }).trim();
    } catch (e) {
      /* ignore */
    }

    if (!activeAccount || activeAccount === '(unset)') {
      log('⚠️ Not logged into gcloud, skipping billing check.', '33');
      hookOutput('⚠️ Not logged into gcloud. Please run gcloud auth login first');
      process.exit(0);
    }

    log(`👤 Active account: ${activeAccount}`, '35');
    return activeAccount;
  } catch (error) {
    log(`Authentication check failed: ${error.message}`, '31');
    hookOutput(`❌ Authentication check failed: ${error.message}`);
    process.exit(0);
  }
}

async function run() {
  // Source filter: skip billing check only on /clear
  const eventData = await readEventData();
  const source = eventData.source || 'startup';
  if (source === 'clear') {
    log(`ℹ️ SessionStart source="clear", skipping billing check.`, '90');
    hookOutput('');
    return;
  }

  // Auth mode check: only run billing management under Vertex AI authentication
  try {
    const settingsPath = join(GEMINI_DIR, 'settings.json');
    if (existsSync(settingsPath)) {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
      const authType = settings?.security?.auth?.selectedType ?? '';
      if (authType && !authType.toLowerCase().includes('vertex')) {
        log(`ℹ️ Not using Vertex AI authentication (${authType}), skipping billing check.`, '90');
        hookOutput('');
        return;
      }
    }
  } catch (e) {
    // Cannot read settings, continue execution (conservative default)
  }

  ensureGcloudAccount();

  // ADC credentials existence check
  const adcFile = join(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json');
  if (!existsSync(adcFile)) {
    let projectId = 'YOUR_PROJECT_ID';
    try {
      const p = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
      if (p && p !== '(unset)') projectId = p;
    } catch (e) { /* ignore */ }

    log('⚠️ ADC credentials not configured! Gemini CLI API calls will fail.', '33');
    log('💡 Run the following in your terminal (not in Gemini CLI):', '36');
    log(`   gcloud auth application-default login --project=${projectId}`, '36');
    log('   If the browser cannot open automatically, use:', '36');
    log(`   gcloud auth application-default login --no-launch-browser --project=${projectId}`, '36');
    hookOutput(
      `⚠️ ADC credentials not configured. Run in your terminal:\ngcloud auth application-default login --project=${projectId}\nIf browser can't open, add --no-launch-browser`
    );
    process.exit(0);
  }

  try {
    // --- Dynamic Project Detection ---
    let targetProject = '';
    try {
      targetProject = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
      if (!targetProject || targetProject === '(unset)') {
        log('❌ Cannot detect an active GCP Project ID!', '31');
        hookOutput('❌ Cannot detect GCP Project ID');
        process.exit(0);
      }
    } catch (e) {
      log('Failed to detect the current GCP project.', '31');
      hookOutput('❌ Cannot detect GCP project');
      process.exit(0);
    }
    log(`📂 Active project: ${targetProject}`, '36');

    if (!existsSync(USED_FILE)) appendFileSync(USED_FILE, '');
    const usedAccounts = readFileSync(USED_FILE, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    log('[Gemini CLI] Starting Account Management System (Detect/Debug mode)...', '36');

    // --- Check Current Billing Status ---
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
      ? `Account: ${currentDisplayName} / ID: ${currentAccountId}`
      : `Account ID: ${currentAccountId}`;

    // --- Pre-check: Is billing enabled? ---
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
      log(`🪫 Billing disabled. ${currentLabel}, needs switching.`, '33');
      if (currentAccountId && !usedAccounts.includes(currentAccountId)) {
        appendFileSync(USED_FILE, `${currentAccountId}\n`);
      }
    } else {
      // --- Account Status Check (replaces gemini -p "hi" test) ---
      if (isAccountOpen(currentAccountId)) {
        log(`✅ ${currentLabel} billing enabled and account open. No switch needed.`, '32');
        hookOutput(`✅ ${currentLabel} billing OK`);
        return;
      }
      log(`🪫 ${currentLabel} is closed. Switching required.`, '33');
      if (!usedAccounts.includes(currentAccountId)) {
        appendFileSync(USED_FILE, `${currentAccountId}\n`);
      }
    }

    // --- Switch Logic ---
    log('Scanning available accounts...', '90');
    const billingJson = JSON.parse(
      execSync('gcloud billing accounts list --format="json"', { encoding: 'utf8' })
    );

    let linkErrorType = null;

    for (const accObj of billingJson) {
      const accId = accObj.name.split('/').pop();
      const displayName = accObj.displayName || 'Unnamed Account';

      if (usedAccounts.includes(accId) || accId === currentAccountId) continue;

      // Check if account is open before attempting to link
      if (!isAccountOpen(accId)) {
        log(`⏭️ Account [${displayName}] is closed, skipping.`, '90');
        appendFileSync(USED_FILE, `${accId}\n`);
        continue;
      }

      log(`🔋 Trying to enable account: [${displayName}] (${accId})`, '34');

      try {
        safeExec(
          `gcloud billing projects link ${targetProject} --billing-account=${accId} --quiet`
        );
        log('⏳ Waiting 5 seconds for synchronization...', '90');
        await new Promise((r) => setTimeout(r, 5000));

        // Verify linking was successful
        const billingStatus = execSync(
          `gcloud billing projects describe ${targetProject} --format="value(billingEnabled)"`,
          { encoding: 'utf8' }
        ).trim();

        if (billingStatus.toLowerCase() === 'true') {
          log(`✅ Successfully switched to account: [${displayName}]. Service restored.`, '32');
          hookOutput(`🔄 Switched to account [${displayName}], service restored`);
          return;
        } else {
          log(`🪫 Account [${displayName}] billing not enabled after linking, skipping.`, '33');
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
          `❌ Failed to link account [${displayName}]: ${errMsg.slice(0, 100)}`,
          '31'
        );
      }
    }

    if (linkErrorType === 'PRECONDITION') {
      log('\n❌ ALERT: Billing Link Failed!', '31');
      log('   Reason 1: [Project Quota Limit Reached].', '33');
      log('   Reason 2: [No Payment Method Linked to Billing Account].', '33');
      log('💡 Solution: Go to GCP Console (https://console.cloud.google.com/billing) to delete unused projects to free up quota, or ensure a valid credit card is linked.', '36');
      hookOutput('❌ Billing link failed (Quota full or missing payment), check GCP Console');
    } else if (linkErrorType === 'PERMISSION') {
      log('\n❌ ALERT: Permission Denied!', '31');
      log('💡 Solution: Ensure your current Google account has "Billing Account Administrator" permissions for the target account.', '36');
      hookOutput('❌ Permission denied, cannot link billing');
    } else {
      log('❌ ALERT: All accounts under your name are exhausted or cannot be linked!', '31');
      hookOutput('❌ All accounts exhausted or cannot be linked');
    }
    process.exit(0);
  } catch (err) {
    log(`Fatal error: ${err.message}`, '31');
    hookOutput(`❌ Billing check error: ${err.message}`);
    process.exit(0);
  }
}

run();
