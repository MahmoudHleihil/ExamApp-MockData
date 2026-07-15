class AIGradingService {
  constructor({
    client,
    logger = console,
  } = {}) {
    if (!client) {
      throw new Error(
        "AI grading client is required"
      );
    }

    this.client = client;
    this.logger = logger;
  }

  async gradeWrittenAnswer({
    question,
    referenceAnswer,
    rubric = "",
    studentAnswer,
    maxPoints,
  }) {
    const normalizedMaxPoints =
      Math.max(
        0,
        Number(maxPoints) || 0
      );

    try {
      const result =
        await this.client
          .gradeWrittenAnswer({
            question,
            referenceAnswer,
            rubric,
            studentAnswer,
            maxPoints:
              normalizedMaxPoints,
          });

      const rawPoints =
        Number(
          result?.awardedPoints
        );

      const awardedPoints =
        Number.isFinite(rawPoints)
          ? Math.min(
              normalizedMaxPoints,
              Math.max(
                0,
                rawPoints
              )
            )
          : null;

      const rawConfidence =
        Number(
          result?.confidence
        );

      const confidence =
        Number.isFinite(
          rawConfidence
        )
          ? Math.min(
              1,
              Math.max(
                0,
                rawConfidence
              )
            )
          : null;

      return {
        status:
          "ai-suggestion-ready",

        awardedPoints,

        maxPoints:
          normalizedMaxPoints,

        confidence,

        feedback:
          String(
            result?.feedback ||
            ""
          ),

        strengths:
          Array.isArray(
            result?.strengths
          )
            ? result.strengths
            : [],

        missingConcepts:
          Array.isArray(
            result?.missingConcepts
          )
            ? result
                .missingConcepts
            : [],

        requiresTeacherReview:
          true,
      };
    } catch (error) {
      this.logger.error?.(
        "AI written grading failed",
        {
          error:
            error?.message ||
            "Unknown AI grading error",
        }
      );

      return {
        status:
          "ai-grading-failed",

        awardedPoints: null,

        maxPoints:
          normalizedMaxPoints,

        confidence: null,

        feedback:
          "AI grading is currently unavailable. Manual teacher review is required.",

        strengths: [],
        missingConcepts: [],

        requiresTeacherReview:
          true,
      };
    }
  }
}

export default AIGradingService;