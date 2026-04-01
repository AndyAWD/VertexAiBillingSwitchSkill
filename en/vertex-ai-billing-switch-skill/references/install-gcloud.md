# Install gcloud CLI — Platform-Specific Commands

> Reference for Step 2 of SKILL.md.
> Read this after the user has chosen an installation method via `ask_user`.
> All script paths (`scripts/install-gcloud.mjs`) are relative to this Skill's root directory. Use the absolute path when executing.

---

## Windows

### winget install

First inform the user:

> During installation, Windows may show a "User Account Control" dialog. Please click "Yes" to allow the installation.

1. Check if winget is available:
   ```bash
   winget --version
   ```

2. If winget is not available (older Windows or Windows Server), inform the user:
   > Your system does not have winget. Falling back to Google official installation. Alternatively, install "App Installer" from the Microsoft Store.

   Then automatically fall back to the "Google official" flow.

3. Install gcloud CLI:
   ```bash
   winget install -e --id Google.CloudSDK --accept-source-agreements --accept-package-agreements
   ```

4. Verify installation:
   ```bash
   gcloud --version
   ```

   > If verification fails (the current terminal session's PATH may not yet include the new installation), use Node.js to locate the actual installation path:
   > ```bash
   > node -e "const path=require('path'),fs=require('fs');const c=[path.join(process.env.LOCALAPPDATA||'','Google','Cloud SDK','google-cloud-sdk','bin','gcloud.cmd'),'C:\\\\Program Files\\\\Google\\\\Cloud SDK\\\\google-cloud-sdk\\\\bin\\\\gcloud.cmd','C:\\\\Program Files (x86)\\\\Google\\\\Cloud SDK\\\\google-cloud-sdk\\\\bin\\\\gcloud.cmd'];for(const p of c){if(fs.existsSync(p)){process.stdout.write(p);break;}}"
   > ```
   >
   > Then verify with the found path using the PowerShell call operator (`&`) to handle spaces:
   > ```bash
   > powershell -Command "& '{found_gcloud_path}' --version"
   > ```
   >
   > **Note:** This PATH issue only affects the current terminal session. After restarting the terminal, `gcloud` will be available directly without a full path.

### Google official

Use `run_shell_command`:

```bash
node {skill_dir}/scripts/install-gcloud.mjs
```

> The script outputs results as JSON to stdout and logs to stderr.

After installation, run `gcloud --version` again to confirm success. If it fails, inform the user to install manually.

---

## macOS

### Homebrew install

1. Check if Homebrew is installed:
   ```bash
   brew --version
   ```

2. If not installed, first inform the user:
   > Installing Homebrew may ask for your Mac login password.
   > Note: **No characters will appear on screen** while typing your password — this is normal. Just type your password and press Enter.

   Then use `run_shell_command` to install Homebrew:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

   After installation, set up PATH (Apple Silicon):
   ```bash
   eval "$(/opt/homebrew/bin/brew shellenv)" && brew --version
   ```

3. Install gcloud CLI:
   ```bash
   brew install --cask gcloud-cli
   ```

4. Verify installation:
   ```bash
   export PATH="$(brew --prefix)/share/google-cloud-sdk/bin:$PATH" && gcloud --version
   ```

### Google official

Use `run_shell_command`:

```bash
node {skill_dir}/scripts/install-gcloud.mjs
```

> The script outputs results as JSON to stdout and logs to stderr.

After installation, verify:
```bash
export PATH="$HOME/google-cloud-sdk/bin:$PATH" && gcloud --version
```

If it fails, inform the user to install manually.

---

## Linux

Use `run_shell_command` directly (no install method choice):

```bash
node {skill_dir}/scripts/install-gcloud.mjs
```

> The script outputs results as JSON to stdout and logs to stderr.

After installation, verify:
```bash
export PATH="$HOME/google-cloud-sdk/bin:$PATH" && gcloud --version
```

If it fails, inform the user to install manually.
