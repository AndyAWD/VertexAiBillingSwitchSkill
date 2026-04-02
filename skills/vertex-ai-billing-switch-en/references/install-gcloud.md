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

4. Verify installation and set `{gcloud_cmd}`:
   ```bash
   gcloud --version
   ```

   - **If it succeeds**: Set `{gcloud_cmd}` = `gcloud`, then proceed to Step 3.

   - **If it fails** (the current terminal session's PATH may not yet include the new installation):

     Use Node.js to locate the actual installation path:
     ```bash
     node -e "const path=require('path'),fs=require('fs');const c=[path.join(process.env.LOCALAPPDATA||'','Google','Cloud SDK','google-cloud-sdk','bin','gcloud.cmd'),'C:\\\\Program Files\\\\Google\\\\Cloud SDK\\\\google-cloud-sdk\\\\bin\\\\gcloud.cmd','C:\\\\Program Files (x86)\\\\Google\\\\Cloud SDK\\\\google-cloud-sdk\\\\bin\\\\gcloud.cmd'];for(const p of c){if(fs.existsSync(p)){process.stdout.write(p);break;}}"
     ```

     Store the output as `{found_gcloud_path}`, then verify with the PowerShell call operator (`&`) to handle paths with spaces:
     ```bash
     powershell -Command "& '{found_gcloud_path}' --version"
     ```

     - **Verification succeeds**: Set `{gcloud_cmd}` = `{found_gcloud_path}`
     - **Verification fails**: Inform the user to install gcloud manually and re-run this Skill

     > **Important**: `{gcloud_cmd}` is a session working variable. All subsequent gcloud commands in Steps 3/4/5 must use:
     > `powershell -Command "& '{gcloud_cmd}' <arguments>"`
     >
     > **Note:** This PATH issue only affects the current terminal session. After restarting the terminal, `gcloud` will be available directly without a full path.

### Google official

Use `run_shell_command`:

```bash
node {skill_dir}/scripts/install-gcloud.mjs
```

> The script outputs results as JSON to stdout and logs to stderr.

Parse the JSON output from the script:

- **If `success === false`**: Inform the user to install gcloud manually and re-run this Skill.
- **If `success === true`**:
  1. Try running `gcloud --version`
     - **Succeeds**: Set `{gcloud_cmd}` = `gcloud`, then proceed to Step 3.
     - **Fails** (PATH not updated):
       Set `{gcloud_cmd}` = `{gcloudBinPath}\gcloud.cmd` (using the `gcloudBinPath` directory from the JSON output)
       Verify with the PowerShell call operator:
       ```bash
       powershell -Command "& '{gcloud_cmd}' --version"
       ```
       > **Important**: All subsequent gcloud commands in Steps 3/4/5 must use:
       > `powershell -Command "& '{gcloud_cmd}' <arguments>"`

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
