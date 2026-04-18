use std::time::Duration;

use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Runtime};

use crate::model_settings::{load_api_key_for_provider, load_model_config_for_app, ModelConfig};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GatewayChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct GatewayChatOptions {
    pub temperature: Option<f64>,
    pub max_tokens: Option<u32>,
    pub timeout: Option<u64>,
    pub selected_model: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GatewayChatRequest {
    pub task_name: String,
    pub messages: Vec<GatewayChatMessage>,
    pub options: Option<GatewayChatOptions>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum GatewayErrorCode {
    AuthError,
    NetworkError,
    TimeoutError,
    InvalidResponse,
    UnknownError,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GatewayError {
    pub code: GatewayErrorCode,
    pub message: String,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub status: Option<u16>,
    pub raw: Option<Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GatewayChatResult {
    pub ok: bool,
    pub provider: String,
    pub model: String,
    pub task_name: String,
    pub content: String,
    pub raw: Option<Value>,
    pub error: Option<GatewayError>,
}

#[tauri::command]
pub async fn llm_chat<R: Runtime>(
    app: AppHandle<R>,
    request: GatewayChatRequest,
) -> Result<GatewayChatResult, String> {
    let config = load_model_config_for_app(&app)?;
    Ok(execute_chat_request(config, request).await)
}

#[tauri::command]
pub async fn llm_test_current_provider<R: Runtime>(
    app: AppHandle<R>,
) -> Result<GatewayChatResult, String> {
    let config = load_model_config_for_app(&app)?;
    let request = GatewayChatRequest {
        task_name: "emotion_detect".into(),
        messages: vec![GatewayChatMessage {
            role: "user".into(),
            content: "Reply with OK.".into(),
        }],
        options: Some(GatewayChatOptions {
            temperature: Some(0.0),
            max_tokens: Some(8),
            timeout: Some(config.timeout),
            selected_model: None,
        }),
    };

    Ok(execute_chat_request(config, request).await)
}

async fn execute_chat_request(
    config: ModelConfig,
    request: GatewayChatRequest,
) -> GatewayChatResult {
    let task_name = request.task_name.clone();
    let routed_model = request
        .options
        .as_ref()
        .and_then(|options| options.selected_model.clone())
        .unwrap_or_else(|| route_task_to_model(&config, &task_name));

    if !config.enabled {
        return error_result(
            &config.provider,
            &routed_model,
            &task_name,
            GatewayError {
                code: GatewayErrorCode::UnknownError,
                message: "Current provider config is disabled.".into(),
                provider: Some(config.provider.clone()),
                model: Some(routed_model.clone()),
                status: None,
                raw: None,
            },
        );
    }

    let api_key = match load_api_key_for_provider(&config.provider) {
        Ok(value) if !value.trim().is_empty() => value,
        Ok(_) => {
            return error_result(
                &config.provider,
                &routed_model,
                &task_name,
                GatewayError {
                    code: GatewayErrorCode::AuthError,
                    message: "No API Key found in secure storage.".into(),
                    provider: Some(config.provider.clone()),
                    model: Some(routed_model.clone()),
                    status: None,
                    raw: None,
                },
            );
        }
        Err(message) => {
            return error_result(
                &config.provider,
                &routed_model,
                &task_name,
                GatewayError {
                    code: GatewayErrorCode::AuthError,
                    message,
                    provider: Some(config.provider.clone()),
                    model: Some(routed_model.clone()),
                    status: None,
                    raw: None,
                },
            );
        }
    };

    let timeout = request
        .options
        .as_ref()
        .and_then(|options| options.timeout)
        .unwrap_or(config.timeout)
        .max(1);

    let endpoint = build_chat_completions_url(&config.base_url);
    let client = match Client::builder()
        .timeout(Duration::from_secs(timeout))
        .build()
    {
        Ok(client) => client,
        Err(error) => {
            return error_result(
                &config.provider,
                &routed_model,
                &task_name,
                GatewayError {
                    code: GatewayErrorCode::UnknownError,
                    message: error.to_string(),
                    provider: Some(config.provider.clone()),
                    model: Some(routed_model.clone()),
                    status: None,
                    raw: None,
                },
            );
        }
    };

    let body = json!({
        "model": routed_model,
        "messages": request.messages,
        "temperature": request.options.as_ref().and_then(|options| options.temperature).unwrap_or(0.0),
        "max_tokens": request.options.as_ref().and_then(|options| options.max_tokens).unwrap_or(256),
    });

    let response = client
        .post(endpoint)
        .bearer_auth(api_key)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await;

    let response = match response {
        Ok(response) => response,
        Err(error) => {
            return error_result(
                &config.provider,
                &routed_model,
                &task_name,
                classify_reqwest_error(error, &config.provider, &routed_model),
            );
        }
    };

    let status = response.status();
    let raw = response.json::<Value>().await.unwrap_or_else(|_| json!({}));

    if status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::FORBIDDEN {
        return error_result(
            &config.provider,
            &routed_model,
            &task_name,
            GatewayError {
                code: GatewayErrorCode::AuthError,
                message: extract_error_message(&raw, "Authentication failed."),
                provider: Some(config.provider.clone()),
                model: Some(routed_model.clone()),
                status: Some(status.as_u16()),
                raw: Some(raw),
            },
        );
    }

    if !status.is_success() {
        return error_result(
            &config.provider,
            &routed_model,
            &task_name,
            GatewayError {
                code: GatewayErrorCode::UnknownError,
                message: format!(
                    "HTTP {}: {}",
                    status.as_u16(),
                    extract_error_message(&raw, "Provider returned an error.")
                ),
                provider: Some(config.provider.clone()),
                model: Some(routed_model.clone()),
                status: Some(status.as_u16()),
                raw: Some(raw),
            },
        );
    }

    let content = extract_response_content(&raw);

    match content {
        Some(content) => GatewayChatResult {
            ok: true,
            provider: config.provider,
            model: routed_model,
            task_name,
            content: content.to_string(),
            raw: Some(raw),
            error: None,
        },
        None => error_result(
            &config.provider,
            &routed_model,
            &task_name,
            GatewayError {
                code: GatewayErrorCode::InvalidResponse,
                message: "Provider response did not contain readable assistant content.".into(),
                provider: Some(config.provider.clone()),
                model: Some(routed_model.clone()),
                status: Some(status.as_u16()),
                raw: Some(raw),
            },
        ),
    }
}

fn route_task_to_model(config: &ModelConfig, task_name: &str) -> String {
    match task_name {
        "bias_detect" | "rule_generate" => config.reasoning_model.clone(),
        "safety_filter" => config.safety_model.clone(),
        _ => config.chat_model.clone(),
    }
}

fn build_chat_completions_url(base_url: &str) -> String {
    let trimmed = base_url.trim().trim_end_matches('/');
    if trimmed.ends_with("/chat/completions") {
        trimmed.to_string()
    } else {
        format!("{trimmed}/chat/completions")
    }
}

fn classify_reqwest_error(error: reqwest::Error, provider: &str, model: &str) -> GatewayError {
    let code = if error.is_timeout() {
        GatewayErrorCode::TimeoutError
    } else if error.is_connect() || error.is_request() {
        GatewayErrorCode::NetworkError
    } else {
        GatewayErrorCode::UnknownError
    };

    GatewayError {
        code,
        message: error.to_string(),
        provider: Some(provider.to_string()),
        model: Some(model.to_string()),
        status: None,
        raw: None,
    }
}

fn extract_error_message(raw: &Value, fallback: &str) -> String {
    raw.get("error")
        .and_then(|value| {
            value
                .get("message")
                .and_then(Value::as_str)
                .or_else(|| value.as_str())
        })
        .unwrap_or(fallback)
        .to_string()
}

fn extract_response_content(raw: &Value) -> Option<String> {
    let choice = raw.get("choices").and_then(|choices| choices.get(0));
    let output_choice = raw
        .get("output")
        .and_then(|output| output.get("choices"))
        .and_then(|choices| choices.get(0));
    let output_item = raw
        .get("output")
        .and_then(Value::as_array)
        .and_then(|items| items.first());

    let direct_paths = [
        choice.and_then(|value| value.get("message")).and_then(|value| value.get("content")),
        choice.and_then(|value| value.get("message")).and_then(|value| value.get("text")),
        choice
            .and_then(|value| value.get("message"))
            .and_then(|value| value.get("reasoning_content")),
        choice
            .and_then(|value| value.get("message"))
            .and_then(|value| value.get("reasoning")),
        choice.and_then(|value| value.get("delta")).and_then(|value| value.get("content")),
        choice.and_then(|value| value.get("text")),
        output_choice
            .and_then(|value| value.get("message"))
            .and_then(|value| value.get("content")),
        output_choice
            .and_then(|value| value.get("message"))
            .and_then(|value| value.get("reasoning_content")),
        output_item.and_then(|value| value.get("content")),
        output_item.and_then(|value| value.get("text")),
        raw.get("output_text"),
        raw.get("content"),
    ];

    for candidate in direct_paths.into_iter().flatten() {
        if let Some(text) = flatten_text_content(candidate) {
            return Some(text);
        }
    }

    None
}

fn flatten_text_content(value: &Value) -> Option<String> {
    match value {
        Value::String(text) => {
            let trimmed = text.trim();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed.to_string())
            }
        }
        Value::Array(items) => {
            let combined = items
                .iter()
                .filter_map(extract_text_fragment)
                .collect::<Vec<_>>()
                .join("");
            let trimmed = combined.trim();

            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed.to_string())
            }
        }
        Value::Object(object) => object
            .get("text")
            .and_then(flatten_text_content)
            .or_else(|| object.get("content").and_then(flatten_text_content)),
        _ => None,
    }
}

fn extract_text_fragment(value: &Value) -> Option<String> {
    match value {
        Value::String(text) => Some(text.to_string()),
        Value::Object(object) => {
            if let Some(text) = object.get("text").and_then(Value::as_str) {
                return Some(text.to_string());
            }

            if let Some(text) = object
                .get("content")
                .and_then(flatten_text_content)
            {
                return Some(text);
            }

            if object.get("type").and_then(Value::as_str) == Some("text") {
                return object
                    .get("text")
                    .and_then(Value::as_str)
                    .map(|text| text.to_string());
            }

            None
        }
        _ => None,
    }
}

fn error_result(
    provider: &str,
    model: &str,
    task_name: &str,
    error: GatewayError,
) -> GatewayChatResult {
    GatewayChatResult {
        ok: false,
        provider: provider.to_string(),
        model: model.to_string(),
        task_name: task_name.to_string(),
        content: String::new(),
        raw: error.raw.clone(),
        error: Some(error),
    }
}
