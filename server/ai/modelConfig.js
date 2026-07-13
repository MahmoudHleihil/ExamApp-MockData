function parseFallbackModels(value = "") {
  return value
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

export function getModelRoutingConfig() {
  const primaryModel =
    process.env.OPENROUTER_MODEL ||
    "openai/gpt-oss-120b:free";

  const fallbackModels = parseFallbackModels(
    process.env.OPENROUTER_FALLBACK_MODELS
  );

  return {
    primaryModel,
    models: [
      primaryModel,
      ...fallbackModels.filter(
        (model) => model !== primaryModel
      ),
    ],
  };
}