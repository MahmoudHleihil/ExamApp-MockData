import "./bootstrap.js";

import {
  randomUUID,
} from "node:crypto";

import test, {
  after,
} from "node:test";

import assert from "node:assert/strict";

const {
  default: pool,
} = await import(
  "../config/database.js"
);

const {
  default: ExamService,
} = await import(
  "../services/ExamService.js"
);

const {
  getAiGradingQueue,
  closeAiGradingQueue,
} = await import(
  "../queues/aiGradingQueue.js"
);

const {
  createTestTeacher,
  createTestStudent,
  createTestExam,
  cleanupTestUser,
} = await import(
  "./helpers/databaseTestUtils.js"
);

const createdUserIds = [];
const createdExamIds = [];

test(
  "written submission enqueues an AI grading job",
  async () => {
    const teacher =
      await createTestTeacher();

    const student =
      await createTestStudent();

    createdUserIds.push(
      teacher.id,
      student.id
    );

    const exam =
      await createTestExam(
        teacher.id,
        {
          title:
            `Queue Submission ${Date.now()}`,

          published: true,
          isPublished: true,
          isAlwaysAvailable: true,

          releaseScoresImmediately:
            false,
        }
      );

    createdExamIds.push(
      exam.id
    );

    const questionId =
      randomUUID();

    await pool.query(
      `
        INSERT INTO questions (
          id,
          exam_id,
          position,
          type,
          question_text,
          options,
          correct_answer,
          points
        )
        VALUES (
          $1,
          $2,
          0,
          'written',
          $3,
          '[]'::jsonb,
          $4::jsonb,
          10
        )
      `,
      [
        questionId,
        exam.id,
        "Explain TCP and UDP.",
        JSON.stringify(
          "TCP is reliable and ordered. UDP is connectionless."
        ),
      ]
    );

    const submission =
      await ExamService
        .submitAnswers(
          {
            examId:
              exam.id,

            answers: {
              [questionId]:
                "TCP guarantees delivery while UDP is faster.",
            },
          },

          {
            ...student,
            role: "Student",
          }
        );

    assert.ok(
      submission?.id
    );

    const queue =
      getAiGradingQueue();

    assert.ok(queue);

    const jobId =
      `written-${submission.id}-${questionId}`;

    const job =
      await queue.getJob(
        jobId
      );

    assert.ok(
      job,
      "AI grading job was not found in Redis."
    );

    assert.equal(
      job.name,
      "grade-written-answer"
    );

    assert.equal(
      job.data.submissionId,
      submission.id
    );

    assert.equal(
      job.data.questionId,
      questionId
    );

    await job.remove();
  }
);

after(async () => {
  for (
    const examId
    of createdExamIds.reverse()
  ) {
    await pool.query(
      `
        DELETE FROM exams
        WHERE id = $1
      `,
      [examId]
    );
  }

  for (
    const userId
    of createdUserIds.reverse()
  ) {
    await cleanupTestUser(
      userId
    );
  }

  await closeAiGradingQueue();
  await pool.end();
});