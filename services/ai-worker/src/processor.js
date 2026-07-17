import {
  findAnswer,
  saveAiFailure,
  saveAiSuggestion,
} from "./database.js";

import {
  gradeWrittenAnswer,
} from "./gradingClient.js";

export async function processGradingJob(
  jobData,
  dependencies = {}
) {
  const grade =
    dependencies.gradeWrittenAnswer ||
    gradeWrittenAnswer;

  const find =
    dependencies.findAnswer ||
    findAnswer;

  const save =
    dependencies.saveAiSuggestion ||
    saveAiSuggestion;

  const saveFailure =
    dependencies.saveAiFailure ||
    saveAiFailure;

  const {
    submissionId,
    questionId,
    question,
    referenceAnswer,
    rubric,
    studentAnswer,
    maxPoints,
  } = jobData || {};

  if (
    !submissionId ||
    !questionId
  ) {
    const error =
      new Error(
        "Invalid grading job payload"
      );

    error.code =
      "INVALID_JOB_PAYLOAD";

    throw error;
  }

  const existing =
    await find(
      submissionId,
      questionId
    );

  if (!existing) {
    const error =
      new Error(
        "Submission answer not found"
      );

    error.code =
      "ANSWER_NOT_FOUND";

    throw error;
  }

  /*
   * Idempotency:
   * if a suggestion is already ready or accepted,
   * do not call the provider again.
   */
  if (
    [
      "ai-suggestion-ready",
      "accepted",
      "overridden",
    ].includes(
      existing.ai_grading_status
    )
  ) {
    return {
      skipped: true,
      reason:
        "already-graded",

      submissionId,
      questionId,

      status:
        existing
          .ai_grading_status,
    };
  }

  try {
    const suggestion =
      await grade({
        question:
          String(
            question || ""
          ),

        referenceAnswer:
          String(
            referenceAnswer ||
            ""
          ),

        rubric:
          String(
            rubric || ""
          ),

        studentAnswer:
          String(
            studentAnswer ||
            ""
          ),

        maxPoints:
          Number(
            maxPoints
          ) || 0,
      });

    const stored =
      await save(
        submissionId,
        questionId,
        suggestion
      );

    return {
      skipped: false,
      submissionId,
      questionId,

      status:
        stored
          .ai_grading_status,
    };
  } catch (error) {
    /*
     * Provider errors should retry through BullMQ.
     * We store a failed state only on the final
     * attempt inside the worker.
     */
    error.submissionId =
      submissionId;

    error.questionId =
      questionId;

    error.saveFailure =
      saveFailure;

    throw error;
  }
}