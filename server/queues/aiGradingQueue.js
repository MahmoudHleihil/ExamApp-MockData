import {
  Queue,
} from "bullmq";

import {
  getRedisConnection,
} from "./redisConnection.js";

const queueName =
  process.env
    .AI_GRADING_QUEUE_NAME ||
  "ai-written-grading";

let queue = null;

export function getAiGradingQueue() {
  if (queue) {
    return queue;
  }

  const connection =
    getRedisConnection();

  if (!connection) {
    return null;
  }

  queue = new Queue(
    queueName,
    {
      connection,

      defaultJobOptions: {
        attempts: 4,

        backoff: {
          type:
            "exponential",

          delay: 5_000,
        },

        removeOnComplete: {
          age:
            24 * 60 * 60,

          count:
            1_000,
        },

        removeOnFail: {
          age:
            7 *
            24 *
            60 *
            60,

          count:
            5_000,
        },
      },
    }
  );

  return queue;
}

export async function enqueueWrittenAnswerGrading({
  submissionId,
  questionId,
  question,
  referenceAnswer,
  rubric = "",
  studentAnswer,
  maxPoints,
}) {
  const gradingQueue =
    getAiGradingQueue();

  if (!gradingQueue) {
    return null;
  }

  const jobId =
    `written-${submissionId}-${questionId}`;

  return gradingQueue.add(
    "grade-written-answer",
    {
      submissionId,
      questionId,
      question,
      referenceAnswer,
      rubric,
      studentAnswer,
      maxPoints,
    },
    {
      jobId,
    }
  );
}

export async function closeAiGradingQueue() {
  if (!queue) {
    return;
  }

  await queue.close();
  queue = null;
}