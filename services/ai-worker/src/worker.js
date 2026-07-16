import {
  Worker,
} from "bullmq";

import {
  config,
} from "./config.js";

import {
  processGradingJob,
} from "./processor.js";

function createRedisConnection() {
  const redisUrl =
    new URL(
      config.redisUrl
    );

  return {
    host:
      redisUrl.hostname,

    port:
      Number(
        redisUrl.port ||
        6379
      ),

    username:
      redisUrl.username ||
      undefined,

    password:
      redisUrl.password ||
      undefined,

    maxRetriesPerRequest:
      null,

    connectTimeout:
      10_000,
  };
}

export function createAiWorker() {
  const worker =
    new Worker(
      config.queueName,

      async (job) => {
        if (
          job.name !==
          "grade-written-answer"
        ) {
          const error =
            new Error(
              `Unsupported job: ${job.name}`
            );

          error.code =
            "UNSUPPORTED_JOB";

          throw error;
        }

        try {
          return await processGradingJob(
            job.data
          );
        } catch (error) {
          if (
            error?.code ===
            "ANSWER_NOT_FOUND"
          ) {
            job.discard();

            console.warn(
              "Discarding stale AI grading job",
              {
                jobId:
                  job.id,

                submissionId:
                  job.data
                    ?.submissionId,

                questionId:
                  job.data
                    ?.questionId,
              }
            );

            return {
              skipped: true,

              reason:
                "answer-not-found",

              submissionId:
                job.data
                  ?.submissionId,

              questionId:
                job.data
                  ?.questionId,
            };
          }

          throw error;
        }
      },

      {
        connection:
          createRedisConnection(),

        concurrency:
          config.concurrency,

        lockDuration:
          120_000,
        gradingMaxTokens:
          Number(
            process.env.AI_GRADING_MAX_TOKENS ||
            800
          ),
      }
    );

  worker.on(
    "completed",
    (job, result) => {
      console.log(
        "AI grading job completed",
        {
          jobId:
            job.id,

          ...result,
        }
      );
    }
  );

  worker.on(
    "failed",
    async (
      job,
      error
    ) => {
      console.error(
        "AI grading job failed",
        {
          jobId:
            job?.id,

          attemptsMade:
            job?.attemptsMade,

          maxAttempts:
            job?.opts
              ?.attempts,

          error:
            error?.message,
        }
      );
    }
  );

  worker.on(
    "error",
    (error) => {
      console.error(
        "AI worker connection error",
        {
          error:
            error?.message ||
            String(error),
        }
      );
    }
  );

  return worker;
}