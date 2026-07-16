import client from "./OpenAIClient.js";
import { getModelRoutingConfig } from "./modelConfig.js";

function parseModels(value = "") {
  return value
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function getSafeMaxTokens(
  requestedValue,
  fallback = 2000
) {
  const configuredLimit =
    Number(
      process.env
        .AI_CHAT_MAX_TOKENS ||
      fallback
    );

  const safeConfiguredLimit =
    Number.isFinite(
      configuredLimit
    ) &&
    configuredLimit > 0
      ? configuredLimit
      : fallback;

  const requested =
    Number(requestedValue);

  if (
    !Number.isFinite(requested) ||
    requested <= 0
  ) {
    return safeConfiguredLimit;
  }

  return Math.min(
    requested,
    safeConfiguredLimit
  );
}

class LLMProvider {
  constructor() {
    this.modelHealth = new Map();
    this.cooldownMs = 5 * 60 * 1000;
  }

  markModelUnhealthy(model, status, message) {
    this.modelHealth.set(model, {
      unhealthyUntil: Date.now() + this.cooldownMs,
      status,
      message,
    });
  }

  markModelHealthy(model) {
    this.modelHealth.delete(model);
  }

  isModelHealthy(model) {
    const health = this.modelHealth.get(model);

    if (!health) return true;

    if (Date.now() >= health.unhealthyUntil) {
      this.modelHealth.delete(model);
      return true;
    }

    return false;
  }

getModels() {
  const primary =
    process.env
      .OPENROUTER_MODEL
      ?.trim() ||
    "openai/gpt-4.1-mini";

  const fallbacks =
    parseModels(
      process.env
        .OPENROUTER_FALLBACK_MODELS
    );

  return [
    primary,

    ...fallbacks.filter(
      (model) =>
        model !== primary
    ),
  ];
}

  async createChatCompletion(options) {
    const models = this.getModels();
    const simulateFailure =
      process.env.SIMULATE_PRIMARY_FAILURE === "true";

    const errors = [];

    for (let index = 0; index < models.length; index += 1) {
      const model = models[index];

      if (!this.isModelHealthy(model)) {
        console.warn(`Skipping unhealthy model: ${model}`);
        continue;
      }

      if (simulateFailure && index === 0) {
        console.warn(`Simulating failure for primary model: ${model}`);

        errors.push({
          model,
          status: 503,
          message: "Simulated primary failure",
        });

        continue;
      }

try {
  console.log(
    `Trying OpenRouter model: ${model}`
  );

  const {
    max_tokens,
    max_completion_tokens,
    ...safeOptions
  } = options || {};

  const response =
    await client
      .chat
      .completions
      .create({
        ...safeOptions,

        model,

        max_tokens:
          getSafeMaxTokens(
            max_tokens ??
            max_completion_tokens
          ),
      });

  const message =
    response
      ?.choices?.[0]
      ?.message;

  if (!message) {
    const error =
      new Error(
        "Provider returned no assistant message"
      );

    error.statusCode = 502;
    throw error;
  }

  console.log(
    `OpenRouter model succeeded: ${
      response.model ||
      model
    }`
  );

  this.markModelHealthy(
    model
  );

  return response;
} catch (error) {
  const status =
    Number(
      error?.status ||
      error?.statusCode ||
      error?.error?.code ||
      502
    );

  const message =
    error?.error?.metadata
      ?.raw ||
    error?.error?.message ||
    error?.message ||
    "Unknown provider error";

  const retryable =
    status === 408 ||
    status === 429 ||
    status >= 500 ||
    message.includes(
      "temporarily rate-limited"
    ) ||
    message.includes(
      "unavailable"
    ) ||
    message.includes(
      "Provider returned error"
    ) ||
    message.includes(
      "model is unavailable"
    );

  console.error(
    `Model failed: ${model}`,
    {
      status,
      message,
    }
  );

  errors.push({
    model,
    status,
    message,
  });

  const shouldFallback =
    retryable &&
    this.shouldTryNextModel(
      status,
      message
    );

  if (!shouldFallback) {
    throw this.normalizeError(
      error,
      errors
    );
  }

  this.markModelUnhealthy(
    model,
    status,
    message
  );
}
    }

    const error = new Error(
      "All configured AI models are currently unavailable."
    );

    error.statusCode = 503;
    error.providerErrors = errors;

    throw error;
  }

  async createChatCompletionStream(options) {
    const models = this.getModels();
    const errors = [];

    for (const model of models) {
      if (!this.isModelHealthy(model)) {
        console.warn(`Skipping unhealthy streaming model: ${model}`);
        continue;
      }

      try {
        console.log(`Trying streaming model: ${model}`);

const {
  max_tokens,
  max_completion_tokens,
  ...safeOptions
} = options || {};

const stream =
  await client.chat.completions.create({
    ...safeOptions,

    model,

    stream: true,

    max_tokens:
      getSafeMaxTokens(
        max_tokens ??
        max_completion_tokens
      ),
  });

        this.markModelHealthy(model);

        return {
          stream,
          model,
        };
      } catch (error) {
        const status = Number(
          error?.status ||
            error?.statusCode ||
            error?.error?.code ||
            502
        );

        const message =
          error?.error?.metadata?.raw ||
          error?.error?.message ||
          error?.message ||
          "Unknown provider error";

        errors.push({
          model,
          status,
          message,
        });

        console.error(`Streaming model failed: ${model}`, {
          status,
          message,
        });

        if (this.shouldTryNextModel(status, message)) {
          this.markModelUnhealthy(model, status, message);
          continue;
        }

        throw this.normalizeError(error, errors);
      }
    }

    const error = new Error(
      "All configured streaming models are unavailable."
    );

    error.statusCode = 503;
    error.providerErrors = errors;

    throw error;
  }

  shouldTryNextModel(status, message = "") {
    const text = message.toLowerCase();

    return (
      status === 404 ||
      status === 408 ||
      status === 429 ||
      status >= 500 ||
      text.includes("rate-limited") ||
      text.includes("temporarily unavailable") ||
      text.includes("model is unavailable")
    );
  }

  normalizeError(error, errors = []) {
    const status = Number(
      error?.status ||
      error?.statusCode ||
      error?.error?.code ||
      502
    );

    const normalized = new Error(
      status === 429
        ? "The AI service is temporarily rate-limited."
        : error?.error?.message ||
          error?.message ||
          "The AI provider request failed."
    );

    normalized.statusCode = status;
    normalized.providerError = true;
    normalized.providerErrors = errors;

    return normalized;
  }
}

export default new LLMProvider();