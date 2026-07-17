import test from "node:test";
import assert from "node:assert/strict";

import {
  processGradingJob,
} from "../src/processor.js";

const jobData = {
  submissionId:
    "submission-1",

  questionId:
    "question-1",

  question:
    "Explain TCP and UDP.",

  referenceAnswer:
    "TCP is reliable and ordered.",

  rubric:
    "Mention reliability.",

  studentAnswer:
    "TCP guarantees delivery.",

  maxPoints: 10,
};

test(
  "processor stores an AI suggestion",
  async () => {
    const calls = [];

    const result =
      await processGradingJob(
        jobData,
        {
          async findAnswer() {
            return {
              ai_grading_status:
                null,
            };
          },

          async gradeWrittenAnswer() {
            return {
              status:
                "ai-suggestion-ready",

              awardedPoints: 8,
              confidence: 0.88,
              feedback:
                "Good answer.",

              strengths: [
                "Correct concept",
              ],

              missingConcepts: [
                "Ordering",
              ],
            };
          },

          async saveAiSuggestion(
            submissionId,
            questionId,
            suggestion
          ) {
            calls.push({
              submissionId,
              questionId,
              suggestion,
            });

            return {
              ai_grading_status:
                suggestion.status,
            };
          },
        }
      );

    assert.equal(
      calls.length,
      1
    );

    assert.equal(
      calls[0]
        .suggestion
        .awardedPoints,
      8
    );

    assert.equal(
      result.status,
      "ai-suggestion-ready"
    );
  }
);

test(
  "processor skips an already graded answer",
  async () => {
    let providerCalled =
      false;

    const result =
      await processGradingJob(
        jobData,
        {
          async findAnswer() {
            return {
              ai_grading_status:
                "ai-suggestion-ready",
            };
          },

          async gradeWrittenAnswer() {
            providerCalled =
              true;

            return {};
          },
        }
      );

    assert.equal(
      providerCalled,
      false
    );

    assert.equal(
      result.skipped,
      true
    );
  }
);

test(
  "processor rejects a missing answer",
  async () => {
    await assert.rejects(
      () =>
        processGradingJob(
          jobData,
          {
            async findAnswer() {
              return null;
            },
          }
        ),

      (error) => {
        assert.equal(
          error.code,
          "ANSWER_NOT_FOUND"
        );

        return true;
      }
    );
  }
);