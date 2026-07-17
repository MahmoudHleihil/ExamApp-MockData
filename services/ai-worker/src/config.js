function getRequiredEnvironmentValue(
  name
) {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `${name} is required`
    );
  }

  return value;
}

export const config = {
  get databaseUrl() {
    return getRequiredEnvironmentValue(
      "DATABASE_URL"
    );
  },

  get redisUrl() {
    return getRequiredEnvironmentValue(
      "REDIS_URL"
    );
  },

  queueName:
    process.env
      .AI_GRADING_QUEUE_NAME ||
    "ai-written-grading",

  concurrency:
    Number(
      process.env
        .AI_WORKER_CONCURRENCY ||
        2
    ),

  openRouterApiKey:
    process.env
      .OPENROUTER_API_KEY ||
    "",

  openRouterBaseUrl:
    process.env
      .OPENROUTER_BASE_URL ||
    "https://openrouter.ai/api/v1",

  model:
    process.env
      .AI_GRADING_MODEL ||
    "openai/gpt-4.1-mini",

  appName:
    process.env.APP_NAME ||
    "Exam App AI Worker",

  appUrl:
    process.env.APP_URL ||
    "http://localhost:8080",

  fakeGrading:
    process.env
      .AI_FAKE_GRADING ===
    "true",
};