import { loadModelConfig } from "../modelSettings";
import { ModelGatewayError, toGatewayError } from "./errors";
import { resolveModelForTask } from "./routing";
import type { ChatRequest, ChatResult, ProviderConfig } from "./types";
import { DashscopeProvider } from "./providers/dashscope";
import { DeepseekProvider } from "./providers/deepseek";
import type { ProviderAdapter } from "./providers/base";

export async function chat(request: ChatRequest): Promise<ChatResult> {
  const config = await loadProviderConfig();
  const provider = getProviderAdapter(config.provider);
  const selectedModel = resolveModelForTask(config, request.taskName);

  const result = await provider.chat({
    ...request,
    options: {
      ...request.options,
      timeout: request.options?.timeout ?? config.timeout,
      selectedModel,
    },
  });

  if (!result.ok && result.error) {
    throw new ModelGatewayError(result.error);
  }

  return result;
}

export async function testCurrentProvider(): Promise<ChatResult> {
  const config = await loadProviderConfig();
  const provider = getProviderAdapter(config.provider);
  const result = await provider.testConnection(config);

  if (!result.ok && result.error) {
    throw new ModelGatewayError(result.error);
  }

  return result;
}

export async function demoChat(): Promise<ChatResult> {
  try {
    const result = await chat({
      taskName: "emotion_detect",
      messages: [
        {
          role: "user",
          content: "Say hello from the Rule One local gateway.",
        },
      ],
      options: {
        maxTokens: 32,
        temperature: 0,
      },
    });

    console.log("Rule One demoChat result:", result);
    return result;
  } catch (error) {
    const gatewayError = toGatewayError(error);
    console.error("Rule One demoChat error:", gatewayError);
    throw new ModelGatewayError(gatewayError);
  }
}

async function loadProviderConfig(): Promise<ProviderConfig> {
  return loadModelConfig() as Promise<ProviderConfig>;
}

export function getProviderAdapter(provider: ProviderConfig["provider"]): ProviderAdapter {
  switch (provider) {
    case "deepseek":
      return new DeepseekProvider();
    case "dashscope":
    default:
      return new DashscopeProvider();
  }
}
