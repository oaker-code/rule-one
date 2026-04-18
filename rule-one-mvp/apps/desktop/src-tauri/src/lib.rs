mod llm_gateway;
mod model_settings;

use tauri_plugin_sql::{Migration, MigrationKind};

use llm_gateway::{llm_chat, llm_test_current_provider};
use model_settings::{
    delete_api_key, has_api_key, load_model_config, save_api_key, save_model_config,
    test_provider_connection,
};

const DATABASE_URL: &str = "sqlite:ruleone.db";

fn sqlite_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_rule_one_core_tables",
        sql: r#"
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_sessions (
  session_id TEXT PRIMARY KEY,
  review_date TEXT NOT NULL,
  emotion_label TEXT,
  raw_input TEXT,
  structured_review TEXT,
  main_bias TEXT,
  did_well TEXT,
  rule_one TEXT,
  risk_flag INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reflection_cards (
  card_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  emotion TEXT,
  main_bias TEXT,
  did_well TEXT,
  rule_one TEXT,
  summary TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES review_sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rule_archive (
  rule_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  rule_text TEXT NOT NULL,
  bias_type TEXT,
  status TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES review_sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id TEXT PRIMARY KEY,
  session_id TEXT,
  stage TEXT NOT NULL,
  input_payload TEXT,
  output_payload TEXT,
  safety_hit INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES review_sessions(session_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_review_sessions_review_date
  ON review_sessions (review_date DESC);

CREATE INDEX IF NOT EXISTS idx_reflection_cards_session_id
  ON reflection_cards (session_id);

CREATE INDEX IF NOT EXISTS idx_rule_archive_session_id
  ON rule_archive (session_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id
  ON audit_logs (session_id);
"#,
        kind: MigrationKind::Up,
    }]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(DATABASE_URL, sqlite_migrations())
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_model_config,
            load_model_config,
            save_api_key,
            has_api_key,
            delete_api_key,
            test_provider_connection,
            llm_chat,
            llm_test_current_provider
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
