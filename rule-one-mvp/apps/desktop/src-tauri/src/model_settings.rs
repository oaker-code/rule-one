use std::time::Duration;

use keyring::Entry;
use reqwest::Client;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager, Runtime};

const MODEL_CONFIG_KEY: &str = "model_config";
const KEYRING_SERVICE: &str = "ruleone.llm";
const LEGACY_KEYRING_SERVICE: &str = "RuleOneDesktop";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelConfig {
    pub provider: String,
    pub base_url: String,
    pub chat_model: String,
    pub reasoning_model: String,
    pub safety_model: String,
    pub timeout: u64,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProviderConnectionResult {
    pub ok: bool,
    pub provider: String,
    pub model: String,
    pub message: String,
    pub raw: Option<Value>,
}

#[tauri::command]
pub fn save_model_config<R: Runtime>(
    app: AppHandle<R>,
    config: ModelConfig,
) -> Result<ModelConfig, String> {
    let normalized = normalize_model_config(config)?;
    let connection = open_app_database(&app).map_err(|error| error.to_string())?;
    let payload = serde_json::to_string(&normalized).map_err(|error| error.to_string())?;
    let updated_at = now_iso_string();

    connection
        .execute(
            r#"
            INSERT INTO app_settings (setting_key, setting_value, updated_at)
            VALUES (?1, ?2, ?3)
            ON CONFLICT(setting_key)
            DO UPDATE SET
              setting_value = excluded.setting_value,
              updated_at = excluded.updated_at
            "#,
            params![MODEL_CONFIG_KEY, payload, updated_at],
        )
        .map_err(|error| error.to_string())?;

    Ok(normalized)
}

#[tauri::command]
pub fn load_model_config<R: Runtime>(app: AppHandle<R>) -> Result<ModelConfig, String> {
    load_model_config_for_app(&app)
}

pub(crate) fn load_model_config_for_app<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<ModelConfig, String> {
    let connection = open_app_database(&app).map_err(|error| error.to_string())?;
    let payload = connection
        .query_row(
            "SELECT setting_value FROM app_settings WHERE setting_key = ?1",
            [MODEL_CONFIG_KEY],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| error.to_string())?;

    let config = match payload {
        Some(value) => {
            let parsed =
                serde_json::from_str::<ModelConfig>(&value).map_err(|error| error.to_string())?;
            normalize_model_config(parsed)?
        }
        None => default_model_config_for_provider("dashscope"),
    };

    Ok(config)
}

#[tauri::command]
pub fn save_api_key(provider: String, api_key: String) -> Result<bool, String> {
    let normalized_provider = normalize_provider(&provider)?;
    let trimmed_key = api_key.trim();

    if trimmed_key.is_empty() {
        return Err("API Key cannot be empty.".into());
    }

    keyring_entry(&normalized_provider)
        .set_password(trimmed_key)
        .map_err(|error| error.to_string())?;

    let persisted_key = load_api_key_for_provider(&normalized_provider)?;
    if persisted_key.trim() != trimmed_key {
        return Err("API Key verification failed after save.".into());
    }

    Ok(true)
}

#[tauri::command]
pub fn has_api_key(provider: String) -> Result<bool, String> {
    let normalized_provider = normalize_provider(&provider)?;

    match load_api_key_for_provider(&normalized_provider) {
        Ok(value) => Ok(!value.trim().is_empty()),
        Err(error) if is_missing_key_error(&error) => Ok(false),
        Err(error) => Err(error),
    }
}

#[tauri::command]
pub fn delete_api_key(provider: String) -> Result<bool, String> {
    let normalized_provider = normalize_provider(&provider)?;

    delete_keyring_entry(&keyring_entry(&normalized_provider))?;
    delete_keyring_entry(&legacy_keyring_entry(&normalized_provider))?;

    Ok(true)
}

#[tauri::command]
pub async fn test_provider_connection<R: Runtime>(
    app: AppHandle<R>,
) -> Result<ProviderConnectionResult, String> {
    let config = load_model_config_for_app(&app)?;
    let key = load_api_key_for_provider(&config.provider)?;

    if !config.enabled {
        return Ok(ProviderConnectionResult {
            ok: false,
            provider: config.provider,
            model: config.chat_model,
            message: "Current provider config is disabled. Enable it before testing.".into(),
            raw: None,
        });
    }

    if key.trim().is_empty() {
        return Ok(ProviderConnectionResult {
            ok: false,
            provider: config.provider,
            model: config.chat_model,
            message: "No API Key found in secure storage.".into(),
            raw: None,
        });
    }

    let endpoint = build_chat_completions_url(&config.base_url);
    let client = Client::builder()
        .timeout(Duration::from_secs(config.timeout.max(1)))
        .build()
        .map_err(|error| error.to_string())?;

    let request_body = json!({
        "model": config.chat_model,
        "messages": [
            {
                "role": "user",
                "content": "Reply with OK."
            }
        ],
        "max_tokens": 8,
        "temperature": 0
    });

    let response = client
        .post(endpoint)
        .bearer_auth(key)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|error| format!("Connection request failed: {error}"))?;

    let status = response.status();
    let raw = response.json::<Value>().await.unwrap_or_else(|_| json!({}));
    let provider = config.provider.clone();
    let model = config.chat_model.clone();

    if status.is_success() {
        let message = raw
            .get("choices")
            .and_then(|choices| choices.get(0))
            .and_then(|choice| choice.get("message"))
            .and_then(|message| message.get("content"))
            .and_then(Value::as_str)
            .map(|content| format!("Connection OK: {}", content.trim()))
            .unwrap_or_else(|| "Connection OK.".to_string());

        Ok(ProviderConnectionResult {
            ok: true,
            provider,
            model,
            message,
            raw: Some(raw),
        })
    } else {
        let error_message = raw
            .get("error")
            .and_then(|value| {
                value
                    .get("message")
                    .and_then(Value::as_str)
                    .or_else(|| value.as_str())
            })
            .unwrap_or("Provider returned an error.");

        Ok(ProviderConnectionResult {
            ok: false,
            provider,
            model,
            message: format!("HTTP {}: {}", status.as_u16(), error_message),
            raw: Some(raw),
        })
    }
}

pub(crate) fn default_model_config_for_provider(provider: &str) -> ModelConfig {
    match provider {
        "deepseek" => ModelConfig {
            provider: "deepseek".into(),
            base_url: "https://api.deepseek.com".into(),
            chat_model: "deepseek-chat".into(),
            reasoning_model: "deepseek-reasoner".into(),
            safety_model: "deepseek-chat".into(),
            timeout: 30,
            enabled: true,
        },
        _ => ModelConfig {
            provider: "dashscope".into(),
            base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1".into(),
            chat_model: "qwen-plus".into(),
            reasoning_model: "qwen-max".into(),
            safety_model: "qwen-plus".into(),
            timeout: 30,
            enabled: true,
        },
    }
}

pub(crate) fn normalize_model_config(config: ModelConfig) -> Result<ModelConfig, String> {
    let provider = normalize_provider(&config.provider)?;
    let defaults = default_model_config_for_provider(&provider);

    Ok(ModelConfig {
        provider,
        base_url: if config.base_url.trim().is_empty() {
            defaults.base_url
        } else {
            config.base_url.trim().trim_end_matches('/').to_string()
        },
        chat_model: if config.chat_model.trim().is_empty() {
            defaults.chat_model
        } else {
            config.chat_model.trim().to_string()
        },
        reasoning_model: if config.reasoning_model.trim().is_empty() {
            defaults.reasoning_model
        } else {
            config.reasoning_model.trim().to_string()
        },
        safety_model: if config.safety_model.trim().is_empty() {
            defaults.safety_model
        } else {
            config.safety_model.trim().to_string()
        },
        timeout: if config.timeout == 0 {
            defaults.timeout
        } else {
            config.timeout
        },
        enabled: config.enabled,
    })
}

pub(crate) fn normalize_provider(provider: &str) -> Result<String, String> {
    match provider.trim().to_lowercase().as_str() {
        "dashscope" => Ok("dashscope".into()),
        "deepseek" => Ok("deepseek".into()),
        _ => Err("Unsupported provider. Use dashscope or deepseek.".into()),
    }
}

pub(crate) fn load_api_key_for_provider(provider: &str) -> Result<String, String> {
    let normalized_provider = normalize_provider(provider)?;

    match keyring_entry(&normalized_provider).get_password() {
        Ok(password) => Ok(password),
        Err(keyring::Error::NoEntry) => {
            match legacy_keyring_entry(&normalized_provider).get_password() {
                Ok(password) => {
                    keyring_entry(&normalized_provider)
                        .set_password(&password)
                        .map_err(|error| format!("Failed to migrate API Key into secure storage: {error}"))?;
                    Ok(password)
                }
                Err(keyring::Error::NoEntry) => {
                    Err("Failed to read API Key: No matching entry found in secure storage".into())
                }
                Err(error) => Err(format!("Failed to read API Key: {error}")),
            }
        }
        Err(error) => Err(format!("Failed to read API Key: {error}")),
    }
}

fn keyring_entry(provider: &str) -> Entry {
    Entry::new(KEYRING_SERVICE, provider).expect("keyring entry should be created")
}

fn legacy_keyring_entry(provider: &str) -> Entry {
    Entry::new(LEGACY_KEYRING_SERVICE, &format!("provider:{provider}:api_key"))
        .expect("legacy keyring entry should be created")
}

fn delete_keyring_entry(entry: &Entry) -> Result<(), String> {
    match entry.delete_credential() {
        Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

fn is_missing_key_error(error: &str) -> bool {
    error.contains("No matching entry found in secure storage")
}

fn build_chat_completions_url(base_url: &str) -> String {
    let trimmed = base_url.trim().trim_end_matches('/');
    if trimmed.ends_with("/chat/completions") {
        trimmed.to_string()
    } else {
        format!("{trimmed}/chat/completions")
    }
}

pub(crate) fn open_app_database<R: Runtime>(app: &AppHandle<R>) -> Result<Connection, String> {
    let app_dir = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?;

    std::fs::create_dir_all(&app_dir).map_err(|error| error.to_string())?;

    let database_path = app_dir.join("ruleone.db");
    let connection = Connection::open(database_path).map_err(|error| error.to_string())?;

    connection
        .execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS app_settings (
              setting_key TEXT PRIMARY KEY,
              setting_value TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
            "#,
        )
        .map_err(|error| error.to_string())?;

    Ok(connection)
}

fn now_iso_string() -> String {
    chrono::Utc::now().to_rfc3339()
}
