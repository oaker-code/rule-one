export type TaskName =
  | "emotion_detect"
  | "review_structuring"
  | "bias_detect"
  | "rule_generate"
  | "safety_filter";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  selectedModel?: string;
}

export interface ChatRequest {
  taskName: TaskName;
  messages: ChatMessage[];
  options?: ChatOptions;
}

export interface ProviderConfig {
  provider: "dashscope" | "deepseek";
  base_url: string;
  chat_model: string;
  reasoning_model: string;
  safety_model: string;
  timeout: number;
  enabled: boolean;
}

export interface GatewayError {
  code:
    | "AUTH_ERROR"
    | "NETWORK_ERROR"
    | "TIMEOUT_ERROR"
    | "INVALID_RESPONSE"
    | "UNKNOWN_ERROR";
  message: string;
  provider?: string;
  model?: string;
  status?: number;
  raw?: unknown;
}

export interface ChatResult {
  ok: boolean;
  provider: string;
  model: string;
  taskName: TaskName;
  content: string;
  raw?: unknown;
  error?: GatewayError;
}
