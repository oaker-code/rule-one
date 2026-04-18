import { invoke } from "../../tauri";

import type { ProviderAdapter } from "./base";
import type { ChatRequest, ChatResult, ProviderConfig } from "../types";

export class DeepseekProvider implements ProviderAdapter {
  readonly provider = "deepseek" as const;

  async chat(request: ChatRequest): Promise<ChatResult> {
    return invoke<ChatResult>("llm_chat", { request });
  }

  async testConnection(_config: ProviderConfig): Promise<ChatResult> {
    return invoke<ChatResult>("llm_test_current_provider");
  }
}
