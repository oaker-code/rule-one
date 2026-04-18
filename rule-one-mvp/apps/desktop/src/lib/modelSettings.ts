import { invoke } from "./tauri";

export type ModelProvider = "dashscope" | "deepseek";

export interface ModelConfig {
  provider: ModelProvider;
  base_url: string;
  chat_model: string;
  reasoning_model: string;
  safety_model: string;
  timeout: number;
  enabled: boolean;
}

export interface ProviderConnectionResult {
  ok: boolean;
  provider: string;
  model: string;
  message: string;
  raw?: unknown;
}

export const PROVIDER_OPTIONS: Array<{ value: ModelProvider; label: string }> = [
  { value: "dashscope", label: "dashscope / qwen" },
  { value: "deepseek", label: "deepseek" },
];

export function getDefaultModelConfig(provider: ModelProvider): ModelConfig {
  if (provider === "deepseek") {
    return {
      provider,
      base_url: "https://api.deepseek.com",
      chat_model: "deepseek-chat",
      reasoning_model: "deepseek-reasoner",
      safety_model: "deepseek-chat",
      timeout: 30,
      enabled: true,
    };
  }

  return {
    provider,
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    chat_model: "qwen-plus",
    reasoning_model: "qwen-max",
    safety_model: "qwen-plus",
    timeout: 30,
    enabled: true,
  };
}

export async function saveModelConfig(config: ModelConfig): Promise<ModelConfig> {
  return invoke<ModelConfig>("save_model_config", { config });
}

export async function loadModelConfig(): Promise<ModelConfig> {
  return invoke<ModelConfig>("load_model_config");
}

export async function saveApiKey(provider: ModelProvider, apiKey: string): Promise<boolean> {
  return invoke<boolean>("save_api_key", { provider, apiKey });
}

export async function hasApiKey(provider: ModelProvider): Promise<boolean> {
  return invoke<boolean>("has_api_key", { provider });
}

export async function deleteApiKey(provider: ModelProvider): Promise<boolean> {
  return invoke<boolean>("delete_api_key", { provider });
}

export async function testProviderConnection(): Promise<ProviderConnectionResult> {
  return invoke<ProviderConnectionResult>("test_provider_connection");
}
