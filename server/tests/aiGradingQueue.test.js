import test, {
  after,
  before,
} from "node:test";

import assert from "node:assert/strict";

let queueModule;

before(async () => {
  process.env.REDIS_URL =
    process.env.TEST_REDIS_URL ||
    "redis://redis:6379";

  queueModule =
    await import(
      "../queues/aiGradingQueue.js"
    );
});

test(
  "written-answer grading job is added to Redis",
  async () => {
    const queue =
      queueModule
        .getAiGradingQueue();

    assert.ok(
      queue,
      "AI grading queue was not created."
    );

    const submissionId =
      crypto.randomUUID();

    const questionId =
      crypto.randomUUID();

    const job =
      await queueModule
        .enqueueWrittenAnswerGrading({
          submissionId,
          questionId,

          question:
            "Explain TCP and UDP.",

          referenceAnswer:
            "TCP is reliable and ordered. UDP is connectionless.",

          rubric:
            "Mention reliability and ordering.",

          studentAnswer:
            "TCP guarantees delivery while UDP is faster.",

          maxPoints: 10,
        });

    assert.ok(job);

    assert.equal(
      job.name,
      "grade-written-answer"
    );

    assert.equal(
      job.id,
      `written-${submissionId}-${questionId}`
    );

    assert.equal(
      job.data.submissionId,
      submissionId
    );

    assert.equal(
      job.data.questionId,
      questionId
    );

    /*
     * Clean up the test job so it is not
     * consumed later by the real worker.
     */
    await job.remove();
  }
);

test(
  "queue is disabled when REDIS_URL is missing",
  async () => {
    await queueModule
      .closeAiGradingQueue();

    delete process.env.REDIS_URL;

    const isolatedModule =
      await import(
        `../queues/aiGradingQueue.js?disabled=${Date.now()}`
      );

    assert.equal(
      isolatedModule
        .getAiGradingQueue(),
      null
    );
  }
);

after(async () => {
  await queueModule
    ?.closeAiGradingQueue();
});
