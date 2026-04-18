# Demo Checklist

## Before Demo

- Open `apps/desktop`
- Run:

```bash
npm run tauri dev
```

- Make sure model config is already valid for at least one provider

## Demo Model Settings

- Open `模型设置`
- Show provider switch between `dashscope / qwen` and `deepseek`
- Show that normal config is saved locally
- Show `API Key` save / delete flow
- Run `Test Connection`
- Optionally run `Demo Chat`

## Demo Daily Review

- Go back to `首页`
- Click `开始复盘`
- Pick an emotion
- Fill the fixed questions
- Add free text input
- Click `提交`
- Point out the loading state and the final jump to the result page

## Demo Result

- Show:
  - `emotion`
  - `main_bias`
  - `did_well`
  - `rule_one`
- Click `保存本次复盘`
- Explain that save writes into local SQLite tables:
  - `review_sessions`
  - `reflection_cards`
  - `rule_archive`
  - `audit_logs`

## Demo History

- Click `查看历史`
- Show the list view
- Click one record
- Show detailed content loaded from local SQLite
- If the database is empty, show the empty state first

## Explain Local Boundaries

- SQLite:
  - Stores normal app data and review history
  - Lives in the app data/config directory
  - Does not store API Keys

- Secure key storage:
  - Stores provider API Keys only
  - Uses system secure storage / keyring
  - Is separate from SQLite

- Model calls:
  - Use the configured provider
  - Read normal config from SQLite
  - Read API Key from secure storage

## Recommended Demo Flow

1. Model Settings
2. Daily Review
3. Result
4. Save
5. History
