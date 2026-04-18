import type { ChatRequest, ChatResult, ProviderConfig } from "../types";

export interface ProviderAdapter {
  readonly provider: ProviderConfig["provider"];
  chat(request: ChatRequest): Promise<ChatResult>;
  testConnection(config: ProviderConfig): Promise<ChatResult>;
}
