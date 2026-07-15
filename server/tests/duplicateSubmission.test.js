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
  createTestTeacher,
  createTestStudent,
  createTestExam,
  cleanupTestUser,
} = await import(
  "./helpers/databaseTestUtils.js"
);

const createdUserIds = [];

async function createUser(
  factory
) {
  const user =
    await factory();

  createdUserIds.push(
    user.id
  );

  return user;
}

async function createExamWithQuestion(
  teacherId
) {
  const exam =
    await createTestExam(
      teacherId,
      {
        title:
          `Duplicate Submission Test ${Date.now()}-${randomUUID()}`,

        published: true,
        isPublished: true,
        isAlwaysAvailable: true,
        releaseScoresImmediately:
          true,
      }
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
        'multiple-choice',
        $3,
        $4::JSONB,
        $5::JSONB,
        10
      )
    `,
    [
      questionId,
      exam.id,
      "What should happen after a student submits once?",
      JSON.stringify([
        "A second submission should be rejected",
        "Unlimited submissions should be allowed",
      ]),
      JSON.stringify(
        "A second submission should be rejected"
      ),
    ]
  );

  return {
    ...exam,
    questionId,
  };
}

test(
  "first submission succeeds",
  async () => {
    const teacher =
      await createUser(
        createTestTeacher
      );

    const student =
      await createUser(
        createTestStudent
      );

    const exam =
      await createExamWithQuestion(
        teacher.id
      );

    const submission =
      await ExamService.submitAnswers(
        {
          examId: exam.id,
          answers: {
            [exam.questionId]:
              "A second submission should be rejected",
          },
        },
        {
          ...student,
          role: "Student",
        }
      );

    assert.ok(submission);
    assert.equal(
      submission.examId,
      exam.id
    );

    assert.equal(
      submission.studentId,
      student.id
    );
  }
);

test(
  "second submission by the same student is rejected with 409",
  async () => {
    const teacher =
      await createUser(
        createTestTeacher
      );

    const student =
      await createUser(
        createTestStudent
      );

    const exam =
      await createExamWithQuestion(
        teacher.id
      );

    const payload = {
      examId: exam.id,
      answers: {
        [exam.questionId]:
          "A second submission should be rejected",
      },
    };

    await ExamService.submitAnswers(
      payload,
      {
        ...student,
        role: "Student",
      }
    );

    await assert.rejects(
      () =>
        ExamService.submitAnswers(
          payload,
          {
            ...student,
            role: "Student",
          }
        ),
      (error) => {
        assert.equal(
          error.statusCode,
          409
        );

        assert.match(
          error.message,
          /already submitted/i
        );

        return true;
      }
    );
  }
);

test(
  "a different student can submit the same exam",
  async () => {
    const teacher =
      await createUser(
        createTestTeacher
      );

    const firstStudent =
      await createUser(
        createTestStudent
      );

    const secondStudent =
      await createUser(
        createTestStudent
      );

    const exam =
      await createExamWithQuestion(
        teacher.id
      );

    const payload = {
      examId: exam.id,
      answers: {
        [exam.questionId]:
          "A second submission should be rejected",
      },
    };

    const firstSubmission =
      await ExamService.submitAnswers(
        payload,
        {
          ...firstStudent,
          role: "Student",
        }
      );

    const secondSubmission =
      await ExamService.submitAnswers(
        payload,
        {
          ...secondStudent,
          role: "Student",
        }
      );

    assert.notEqual(
      firstSubmission.id,
      secondSubmission.id
    );

    assert.equal(
      firstSubmission.studentId,
      firstStudent.id
    );

    assert.equal(
      secondSubmission.studentId,
      secondStudent.id
    );
  }
);

after(async () => {
  for (
    const userId
    of createdUserIds.reverse()
  ) {
    await cleanupTestUser(
      userId
    );
  }

  await pool.end();
});