import type { GatewayError } from "./types";

export class ModelGatewayError extends Error {
  readonly details: GatewayError;

  constructor(details: GatewayError) {
    super(details.message);
    this.name = "ModelGatewayError";
    this.details = details;
  }
}

export function toGatewayError(error: unknown): GatewayError {
  if (isGatewayError(error)) {
    return error;
  }

  if (error instanceof ModelGatewayError) {
    return error.details;
  }

  if (error instanceof Error) {
    return {
      code: "UNKNOWN_ERROR",
      message: error.message,
    };
  }

  if (typeof error === "string") {
    return {
      code: "UNKNOWN_ERROR",
      message: error,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "Unknown gateway error",
  };
}

function isGatewayError(value: unknown): value is GatewayError {
  return typeof value === "object" && value !== null && "code" in value && "message" in value;
}
