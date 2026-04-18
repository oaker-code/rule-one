import { useEffect, useState } from "react";

import SettingsForm from "../components/SettingsForm";
import { demoChat } from "../lib/llm/modelGateway";
import { resolveModelForTask } from "../lib/llm/routing";
import {
  deleteApiKey,
  getDefaultModelConfig,
  hasApiKey,
  loadModelConfig,
  PROVIDER_OPTIONS,
  saveApiKey,
  saveModelConfig,
  testProviderConnection,
  type ModelConfig,
  type ModelProvider,
  type ProviderConnectionResult,
} from "../lib/modelSettings";

interface ModelSettingsPageProps {
  onBackHome?: () => void;
}

function ModelSettingsPage({ onBackHome }: ModelSettingsPageProps) {
  const [config, setConfig] = useState<ModelConfig>(getDefaultModelConfig("dashscope"));
  const [apiKey, setApiKey] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [status, setStatus] = useState("Loading model settings...");
  const [errorMessage, setErrorMessage] = useState("");
  const [testResult, setTestResult] = useState<ProviderConnectionResult | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isDeletingKey, setIsDeletingKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const loadedConfig = await loadModelConfig();
        const keyExists = await hasApiKey(loadedConfig.provider);

        if (!isMounted) {
          return;
        }

        setConfig(loadedConfig);
        setHasStoredKey(keyExists);
        setStatus("Model settings ready.");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(toErrorMessage(error));
        setStatus("Failed to load model settings.");
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshKeyState(provider: ModelProvider) {
    const keyExists = await hasApiKey(provider);
    setHasStoredKey(keyExists);
    return keyExists;
  }

  function updateField<Key extends keyof ModelConfig>(key: Key, value: ModelConfig[Key]) {
    setConfig((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleProviderChange(nextProvider: ModelProvider) {
    setConfig(getDefaultModelConfig(nextProvider));
    setApiKey("");
    setErrorMessage("");
    setTestResult(null);
    void refreshKeyState(nextProvider);
  }

  async function handleSaveConfig() {
    setIsSavingConfig(true);
    setErrorMessage("");

    try {
      const saved = await saveModelConfig(config);
      setConfig(saved);
      setStatus("Configuration saved to local SQLite.");
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      setStatus("Failed to save configuration.");
    } finally {
      setIsSavingConfig(false);
    }
  }

  async function handleSaveKey() {
    setIsSavingKey(true);
    setErrorMessage("");

    try {
      await saveApiKey(config.provider, apiKey);
      setApiKey("");
      const keyExists = await refreshKeyState(config.provider);
      setStatus(keyExists ? "API Key saved successfully and is available in secure storage." : "API Key save completed, but no stored key was detected.");
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      setStatus("Failed to save API Key.");
    } finally {
      setIsSavingKey(false);
    }
  }

  async function handleDeleteKey() {
    setIsDeletingKey(true);
    setErrorMessage("");

    try {
      await deleteApiKey(config.provider);
      setApiKey("");
      const keyExists = await refreshKeyState(config.provider);
      setStatus(keyExists ? "Delete completed, but a key still appears to exist." : "API Key deleted from secure storage.");
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      setStatus("Failed to delete API Key.");
    } finally {
      setIsDeletingKey(false);
    }
  }

  async function handleTestConnection() {
    setIsTesting(true);
    setErrorMessage("");
    setTestResult(null);

    try {
      const saved = await saveModelConfig(config);
      setConfig(saved);

      const result = await testProviderConnection();
      setTestResult(result);
      setStatus(result.ok ? "Provider connection succeeded." : "Provider connection failed.");
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      setStatus("Failed to run provider connection test.");
    } finally {
      setIsTesting(false);
    }
  }

  async function handleDemoChat() {
    setIsDemoRunning(true);
    setErrorMessage("");
    setTestResult(null);

    try {
      const saved = await saveModelConfig(config);
      setConfig(saved);
      const result = await demoChat();
      setTestResult({
        ok: result.ok,
        provider: result.provider,
        model: result.model,
        message: result.content || "Demo chat completed.",
        raw: result.raw,
      });
      setStatus("Demo chat completed. Check the dev console for the unified result.");
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
      setStatus("Demo chat failed.");
    } finally {
      setIsDemoRunning(false);
    }
  }

  return (
    <main className="page-shell">
      <SettingsForm>
        <div className="page-header">
          <h1>Model Settings</h1>
          {onBackHome ? (
            <button type="button" className="secondary-button" onClick={onBackHome}>
              返回首页
            </button>
          ) : null}
        </div>
        <p className="settings-copy">
          Configure the local provider profile and store the API Key in system secure storage.
        </p>

        <label className="field">
          <span>Provider</span>
          <select
            value={config.provider}
            onChange={(event) => handleProviderChange(event.currentTarget.value as ModelProvider)}
          >
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Base URL</span>
          <input
            value={config.base_url}
            onChange={(event) => updateField("base_url", event.currentTarget.value)}
            placeholder="https://..."
          />
        </label>

        <label className="field">
          <span>Chat Model</span>
          <input
            value={config.chat_model}
            onChange={(event) => updateField("chat_model", event.currentTarget.value)}
          />
        </label>

        <label className="field">
          <span>Reasoning Model</span>
          <input
            value={config.reasoning_model}
            onChange={(event) => updateField("reasoning_model", event.currentTarget.value)}
          />
        </label>

        <label className="field">
          <span>Safety Model</span>
          <input
            value={config.safety_model}
            onChange={(event) => updateField("safety_model", event.currentTarget.value)}
          />
        </label>

        <label className="field">
          <span>Timeout (seconds)</span>
          <input
            type="number"
            min="1"
            value={config.timeout}
            onChange={(event) => updateField("timeout", Number(event.currentTarget.value) || 0)}
          />
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(event) => updateField("enabled", event.currentTarget.checked)}
          />
          <span>Enabled</span>
        </label>

        <label className="field">
          <span>API Key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.currentTarget.value)}
            placeholder={hasStoredKey ? "API Key already stored. Enter a new one to replace it." : "Enter API Key"}
          />
        </label>

        <p className="hint">
          Secure storage: {hasStoredKey ? "API Key is already stored for this provider." : "No API Key stored yet."}
        </p>
        <p className="hint">API Key status: {hasStoredKey ? "Saved" : "Not saved"}</p>
        <p className="hint">
          Task routing: emotion_detect / review_structuring {"->"} {resolveModelForTask(config, "emotion_detect")},
          bias_detect / rule_generate {"->"} {resolveModelForTask(config, "bias_detect")},
          safety_filter {"->"} {resolveModelForTask(config, "safety_filter")}
        </p>

        <div className="button-row">
          <button type="button" onClick={() => void handleSaveConfig()} disabled={isSavingConfig}>
            {isSavingConfig ? "Saving..." : "Save Config"}
          </button>
          <button type="button" onClick={() => void handleSaveKey()} disabled={isSavingKey}>
            {isSavingKey ? "Saving..." : "Save Key"}
          </button>
          <button type="button" onClick={() => void handleDeleteKey()} disabled={isDeletingKey}>
            {isDeletingKey ? "Deleting..." : "Delete Key"}
          </button>
          <button type="button" onClick={() => void handleTestConnection()} disabled={isTesting}>
            {isTesting ? "Testing..." : "Test Connection"}
          </button>
          <button type="button" onClick={() => void handleDemoChat()} disabled={isDemoRunning}>
            {isDemoRunning ? "Running..." : "Demo Chat"}
          </button>
        </div>

        <div className="result-panel">
          <p className="result-line">Status: {status}</p>
          {errorMessage ? <p className="result-error">Error: {errorMessage}</p> : null}
          {testResult ? (
            <>
              <p className="result-line">Provider: {testResult.provider}</p>
              <p className="result-line">Model: {testResult.model}</p>
              <p className={testResult.ok ? "result-success" : "result-error"}>
                Result: {testResult.message}
              </p>
              <pre className="raw-panel">{JSON.stringify(testResult.raw ?? {}, null, 2)}</pre>
            </>
          ) : (
            <p className="result-line">No provider test has been run yet.</p>
          )}
        </div>
      </SettingsForm>
    </main>
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}

export default ModelSettingsPage;
