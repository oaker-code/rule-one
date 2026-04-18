import type { ProviderConfig, TaskName } from "./types";

export const TASK_MODEL_ROUTE: Record<TaskName, keyof Pick<ProviderConfig, "chat_model" | "reasoning_model" | "safety_model">> = {
  emotion_detect: "chat_model",
  review_structuring: "chat_model",
  bias_detect: "reasoning_model",
  rule_generate: "reasoning_model",
  safety_filter: "safety_model",
};

export function resolveModelForTask(config: ProviderConfig, taskName: TaskName): string {
  return config[TASK_MODEL_ROUTE[taskName]];
}
