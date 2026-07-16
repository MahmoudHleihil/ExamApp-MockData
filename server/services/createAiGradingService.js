import OpenAI from "openai";

import AIGradingClient from "../ai/AIGradingClient.js";
import AIGradingService from "./AIGradingService.js";

let gradingService = null;

function createFakeAiGradingService() {
  return {
    async gradeWrittenAnswer({
      maxPoints,
    }) {
      const normalizedMaxPoints =
        Math.max(
          0,
          Number(maxPoints) || 0
        );

      return {
        status:
          "ai-suggestion-ready",

        awardedPoints:
          Math.min(
            8,
            normalizedMaxPoints
          ),

        maxPoints:
          normalizedMaxPoints,

        confidence:
          0.88,

        feedback:
          "Good answer, but ordering and connection behavior were not fully explained.",

        strengths: [
          "Correctly identified reliability",
        ],

        missingConcepts: [
          "Packet ordering",
          "Connection-oriented versus connectionless behavior",
        ],

        requiresTeacherReview:
          true,
      };
    },
  };
}

export function getAiGradingService() {
  /*
   * Return the existing instance first.
   * This preserves singleton behavior for both
   * the fake and real grading services.
   */
  if (gradingService) {
    return gradingService;
  }

  const fakeGradingEnabled =
    process.env.NODE_ENV ===
      "test" &&
    process.env
      .E2E_FAKE_AI_GRADING ===
      "true";

  if (fakeGradingEnabled) {
    gradingService =
      createFakeAiGradingService();

    return gradingService;
  }

  const apiKey =
    process.env
      .OPENROUTER_API_KEY
      ?.trim();

  if (!apiKey) {
    return null;
  }

  const openRouterClient =
    new OpenAI({
      apiKey,

      baseURL:
        process.env
          .OPENROUTER_BASE_URL ||
        "https://openrouter.ai/api/v1",

      defaultHeaders: {
        "HTTP-Referer":
          process.env.APP_URL ||
          process.env
            .FRONTEND_URL ||
          "http://localhost:5173",

        "X-Title":
          process.env.APP_NAME ||
          "Exam App",
      },
    });

  const client =
    new AIGradingClient({
      client:
        openRouterClient,

      model:
        process.env
          .AI_GRADING_MODEL ||
        "openai/gpt-4.1-mini",
    });

  gradingService =
    new AIGradingService({
      client,
    });

  return gradingService;
}

export function resetAiGradingServiceForTests() {
  gradingService = null;
}