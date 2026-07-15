import "./bootstrap.js";

import test from "node:test";
import assert from "node:assert/strict";

const {
  default: AIGradingService,
} = await import(
  "../services/AIGradingService.js"
);

test(
  "AI grading returns a normalized written-answer suggestion",
  async () => {
    const fakeClient = {
      async gradeWrittenAnswer() {
        return {
          awardedPoints: 8,
          maxPoints: 10,
          confidence: 0.87,
          feedback:
            "Good explanation, but ordering and connection setup were omitted.",
          strengths: [
            "Correctly identified reliability",
            "Correctly identified speed tradeoff",
          ],
          missingConcepts: [
            "Packet ordering",
            "Connection-oriented versus connectionless communication",
          ],
        };
      },
    };

    const service =
      new AIGradingService({
        client: fakeClient,
      });

    const result =
      await service.gradeWrittenAnswer({
        question:
          "Explain the difference between TCP and UDP.",

        referenceAnswer:
          "TCP is connection-oriented, reliable, ordered, and retransmits lost packets. UDP is connectionless, unordered, and does not guarantee delivery.",

        studentAnswer:
          "TCP guarantees delivery while UDP is faster.",

        maxPoints: 10,
      });

    assert.equal(
      result.awardedPoints,
      8
    );

    assert.equal(
      result.maxPoints,
      10
    );

    assert.equal(
      result.requiresTeacherReview,
      true
    );

    assert.match(
      result.feedback,
      /ordering|connection/i
    );
  }
);

test(
  "AI score is clamped to the question maximum",
  async () => {
    const fakeClient = {
      async gradeWrittenAnswer() {
        return {
          awardedPoints: 25,
          confidence: 0.9,
          feedback: "Excellent.",
        };
      },
    };

    const service =
      new AIGradingService({
        client: fakeClient,
      });

    const result =
      await service.gradeWrittenAnswer({
        question: "Explain REST.",
        referenceAnswer:
          "REST is an architectural style.",
        studentAnswer:
          "REST is an architectural style.",
        maxPoints: 10,
      });

    assert.equal(
      result.awardedPoints,
      10
    );
  }
);

test(
  "negative AI scores are normalized to zero",
  async () => {
    const fakeClient = {
      async gradeWrittenAnswer() {
        return {
          awardedPoints: -4,
          confidence: 0.4,
          feedback:
            "The answer is incomplete.",
        };
      },
    };

    const service =
      new AIGradingService({
        client: fakeClient,
      });

    const result =
      await service.gradeWrittenAnswer({
        question: "Explain DNS.",
        referenceAnswer:
          "DNS resolves domain names to IP addresses.",
        studentAnswer: "",
        maxPoints: 10,
      });

    assert.equal(
      result.awardedPoints,
      0
    );
  }
);

test(
  "AI failure produces a pending manual-review result",
  async () => {
    const fakeClient = {
      async gradeWrittenAnswer() {
        throw new Error(
          "Provider unavailable"
        );
      },
    };

    const service =
      new AIGradingService({
        client: fakeClient,
      });

    const result =
      await service.gradeWrittenAnswer({
        question:
          "Explain virtual memory.",
        referenceAnswer:
          "Virtual memory maps virtual addresses to physical memory.",
        studentAnswer:
          "It lets programs use more apparent memory.",
        maxPoints: 10,
      });

    assert.equal(
      result.awardedPoints,
      null
    );

    assert.equal(
      result.requiresTeacherReview,
      true
    );

    assert.equal(
      result.status,
      "ai-grading-failed"
    );
  }
);