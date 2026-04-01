import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import os from 'os';

const log = (msg) => process.stderr.write(msg + '\n');
const output = (obj) => process.stdout.write(JSON.stringify(obj));

function main() {
  const platform = os.platform();
  const isWindows = platform === 'win32';

  log('⏳ Installing Google Cloud CLI...');

  let gcloudPath;

  try {
    if (isWindows) {
      log('📦 Silently downloading and installing gcloud on Windows (this may take a few minutes)...');
      const installCmd = [
        'powershell -Command',
        '"$installer = \'$env:Temp\\GoogleCloudSDKInstaller.exe\';',
        "(New-Object Net.WebClient).DownloadFile('https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe', $installer);",
        'Start-Process -FilePath $installer -ArgumentList \'/S\' -Wait"',
      ].join(' ');
      execSync(installCmd, { stdio: 'inherit' });
      // Search for actual installation path (silent installer defaults to user profile)
      const candidates = [
        join(process.env.LOCALAPPDATA || '', 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin'),
        join('C:\\Program Files', 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin'),
        join('C:\\Program Files (x86)', 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin'),
      ];
      gcloudPath = candidates.find(p => existsSync(join(p, 'gcloud.cmd'))) || candidates[0];
      process.env.PATH = `${gcloudPath};${process.env.PATH}`;
    } else {
      log('📦 Silently installing gcloud on macOS/Linux...');
      execSync('curl https://sdk.cloud.google.com | bash -s -- --disable-prompts', {
        stdio: 'inherit',
      });

      gcloudPath = join(os.homedir(), 'google-cloud-sdk', 'bin');
      process.env.PATH = `${gcloudPath}:${process.env.PATH}`;
    }

    execSync('gcloud --version', { stdio: 'ignore' });

    log('✅ Google Cloud CLI installation completed!');
    output({ success: true, platform, gcloudBinPath: gcloudPath });
  } catch (error) {
    log('❌ Automatic gcloud installation failed.');
    log('   Please refer to official docs for manual installation: https://cloud.google.com/sdk/docs/install');
    output({ success: false, platform, error: error.message });
    process.exit(1);
  }
}

main();
