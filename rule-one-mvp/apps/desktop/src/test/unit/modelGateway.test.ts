import { describe, expect, it } from "vitest";

import { ModelGatewayError, toGatewayError } from "../../lib/llm/errors";
import { getProviderAdapter } from "../../lib/llm/modelGateway";

describe("modelGateway", () => {
  it("routes provider adapter by provider name", () => {
    expect(getProviderAdapter("dashscope").provider).toBe("dashscope");
    expect(getProviderAdapter("deepseek").provider).toBe("deepseek");
  });

  it("returns a stable gateway error structure", () => {
    const error = new ModelGatewayError({
      code: "AUTH_ERROR",
      message: "API key missing",
      provider: "dashscope",
      model: "qwen-plus",
    });

    expect(toGatewayError(error)).toEqual({
      code: "AUTH_ERROR",
      message: "API key missing",
      provider: "dashscope",
      model: "qwen-plus",
    });
    expect(toGatewayError(new Error("boom")).code).toBe("UNKNOWN_ERROR");
  });
});
