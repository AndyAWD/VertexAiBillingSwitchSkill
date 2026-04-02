# Changelog

All notable changes to this project will be documented in this file.

## [1.1.1] - 2026-04-03

### Added
- **Extension Support:** Added official support and instructions for installing via the `gemini extensions install` command in both English and Traditional Chinese documentation.

### Fixed
- **Installation Paths:** Updated manual installation instructions and execution commands in README files to point to the correct subdirectories (`skills/vertex-ai-billing-switch-en` and `skills/vertex-ai-billing-switch-zh-tw`).
- **Hook Deployment Resolution:** Refactored `{skill_dir}` path resolution logic in `deploy-hook.md` to dynamically instruct the LLM on locating the hook script based on whether the user used the extension installer or manual copy.
- **Documentation Cleanup:** Removed redundant language tags in the Traditional Chinese README.