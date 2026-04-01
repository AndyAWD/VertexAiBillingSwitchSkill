import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import os from 'os';

const log = (msg) => process.stderr.write(msg + '\n');
const output = (obj) => process.stdout.write(JSON.stringify(obj));

function main() {
  const platform = os.platform();
  const isWindows = platform === 'win32';

  log('⏳ 正在安裝 Google Cloud CLI...');

  let gcloudPath;

  try {
    if (isWindows) {
      log('📦 正在 Windows 上靜默下載與安裝 gcloud（這可能需要幾分鐘）...');
      const installCmd = [
        'powershell -Command',
        '"$installer = \'$env:Temp\\GoogleCloudSDKInstaller.exe\';',
        "(New-Object Net.WebClient).DownloadFile('https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe', $installer);",
        'Start-Process -FilePath $installer -ArgumentList \'/S\' -Wait"',
      ].join(' ');
      execSync(installCmd, { stdio: 'inherit' });
      // 搜尋實際安裝路徑（靜默安裝程式預設安裝到使用者目錄）
      const candidates = [
        join(process.env.LOCALAPPDATA || '', 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin'),
        join('C:\\Program Files', 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin'),
        join('C:\\Program Files (x86)', 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin'),
      ];
      gcloudPath = candidates.find(p => existsSync(join(p, 'gcloud.cmd'))) || candidates[0];
      process.env.PATH = `${gcloudPath};${process.env.PATH}`;
    } else {
      log('📦 正在 macOS/Linux 上靜默安裝 gcloud...');
      execSync('curl https://sdk.cloud.google.com | bash -s -- --disable-prompts', {
        stdio: 'inherit',
      });

      gcloudPath = join(os.homedir(), 'google-cloud-sdk', 'bin');
      process.env.PATH = `${gcloudPath}:${process.env.PATH}`;
    }

    execSync('gcloud --version', { stdio: 'ignore' });

    log('✅ Google Cloud CLI 安裝完成！');
    output({ success: true, platform, gcloudBinPath: gcloudPath });
  } catch (error) {
    log('❌ 自動安裝 gcloud 失敗。');
    log(`   請參考官方文件手動安裝：https://cloud.google.com/sdk/docs/install`);
    output({ success: false, platform, error: error.message });
    process.exit(1);
  }
}

main();
