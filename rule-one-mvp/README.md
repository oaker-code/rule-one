# Rule One Local Desktop MVP

This repository contains the Rule One local-first desktop MVP.

The current phase only completes project initialization:

- Monorepo-style directory structure
- Desktop shell with Tauri + React + TypeScript + Vite
- Root-level environment and repository defaults

Planned next steps:

- Local SQLite integration
- Model configuration
- AI pipeline implementation

## Project Structure

```text
apps/
  desktop/
packages/
  prompts/
  schemas/
  shared/
docs/
scripts/
```

## Local Development

From `apps/desktop`:

```bash
npm install
npm run tauri dev
```
