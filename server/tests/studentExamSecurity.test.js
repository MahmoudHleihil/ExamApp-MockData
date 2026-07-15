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
  default: SubmissionRepository,
} = await import(
  "../repositories/SubmissionRepository.js"
);

const {
  default: ExamRepository,
} = await import(
  "../repositories/ExamRepository.js"
);

const {
  createTestTeacher,
  createTestStudent,
  createTestExam,
  cleanupTestUser,
} = await import(
  "./helpers/databaseTestUtils.js"
);

async function createPublishedExamWithQuestion(
  teacher
) {
  const exam =
    await createTestExam(
      teacher.id,
      {
        title:
          `Secure Student Exam ${Date.now()}`,
      }
    );

  await pool.query(
    `
      UPDATE exams
      SET
        published = TRUE,
        is_always_available = TRUE,
        release_scores_immediately = TRUE,
        scheduled_date = $2,
        early_access_minutes = 0,
        time_limit = 30,
        passing_score = 60
      WHERE id = $1
    `,
    [
      exam.id,
      new Date(
        Date.now() +
          60 * 60 * 1000
      ),
    ]
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
      "What does secure server-side grading prevent?",
      JSON.stringify([
        "Client score manipulation",
        "CSS loading",
        "Route rendering",
        "Browser navigation",
      ]),
      JSON.stringify(
        "Client score manipulation"
      ),
    ]
  );

  const fullExam =
    await ExamRepository.findById(
      exam.id
    );

  assert.equal(
    fullExam.published,
    true
  );

  assert.equal(
    fullExam.isAlwaysAvailable,
    true
  );

  assert.equal(
    fullExam.releaseScoresImmediately,
    true
  );

  return fullExam;
}

test(
  "student exam response does not expose correct answers",
  async () => {
    const teacher =
      await createTestTeacher();

    const student =
      await createTestStudent();

    try {
      const fullExam =
        await createPublishedExamWithQuestion(
          teacher
        );

      const studentExam =
        await ExamService
          .getExamForStudent(
            fullExam.id,
            student
          );

      assert.equal(
        studentExam.id,
        fullExam.id
      );

      assert.equal(
        studentExam.questions.length,
        1
      );

      const question =
        studentExam.questions[0];

      assert.equal(
        Object.prototype.hasOwnProperty.call(
          question,
          "correctAnswer"
        ),
        false
      );

      assert.equal(
        Object.prototype.hasOwnProperty.call(
          question,
          "correct_answer"
        ),
        false
      );

      assert.equal(
        Object.prototype.hasOwnProperty.call(
          question,
          "sourceEvidence"
        ),
        false
      );

      assert.equal(
        Object.prototype.hasOwnProperty.call(
          studentExam,
          "passwordHash"
        ),
        false
      );
    } finally {
      await cleanupTestUser(
        student.id
      );

      await cleanupTestUser(
        teacher.id
      );
    }
  }
);

test(
  "server calculates score and ignores browser supplied score",
  async () => {
    const teacher =
      await createTestTeacher();

    const student =
      await createTestStudent();

    try {
      const exam =
        await createPublishedExamWithQuestion(
          teacher
        );

      const question =
        exam.questions[0];

      const submission =
        await ExamService
          .submitAnswers(
            {
              examId: exam.id,

              answers: {
                [question.id]:
                  "Client score manipulation",
              },

              /*
               * These values must be ignored by
               * the service if a malicious client
               * sends them.
               */
              score: 0,
              percentage: 0,
              earnedPoints: 0,
              maxScore: 999,
              studentId:
                teacher.id,
              isPassed: false,
            },
            student
          );

      assert.equal(
        submission.studentId,
        student.id
      );

      assert.equal(
        submission.examId,
        exam.id
      );

      assert.equal(
        Number(
          submission.score
        ),
        10
      );

      assert.equal(
        Number(
          submission.maxScore
        ),
        10
      );

      assert.equal(
        Number(
          submission.percentage
        ),
        100
      );

      assert.equal(
        submission.isScorePublished,
        true
      );

      const stored =
        await SubmissionRepository
          .findById(
            submission.id
          );

      assert.ok(stored);

      assert.equal(
        stored.studentId,
        student.id
      );

      assert.equal(
        Number(stored.score),
        10
      );

      assert.equal(
        Number(
          stored.maxScore
        ),
        10
      );

      assert.equal(
        Number(
          stored.percentage
        ),
        100
      );

      assert.equal(
        stored.answers[
          question.id
        ],
        "Client score manipulation"
      );
    } finally {
      await cleanupTestUser(
        student.id
      );

      await cleanupTestUser(
        teacher.id
      );
    }
  }
);

test(
  "server assigns zero for an incorrect answer despite browser claiming full score",
  async () => {
    const teacher =
      await createTestTeacher();

    const student =
      await createTestStudent();

    try {
      const exam =
        await createPublishedExamWithQuestion(
          teacher
        );

      const question =
        exam.questions[0];

      const submission =
        await ExamService
          .submitAnswers(
            {
              examId: exam.id,

              answers: {
                [question.id]:
                  "CSS loading",
              },

              score: 100,
              percentage: 100,
              earnedPoints: 10,
              isPassed: true,
            },
            student
          );

      assert.equal(
        Number(
          submission.score
        ),
        0
      );

      assert.equal(
        Number(
          submission.maxScore
        ),
        10
      );

      assert.equal(
        Number(
          submission.percentage
        ),
        0
      );
    } finally {
      await cleanupTestUser(
        student.id
      );

      await cleanupTestUser(
        teacher.id
      );
    }
  }
);

test(
  "student cannot load an unpublished exam",
  async () => {
    const teacher =
      await createTestTeacher();

    const student =
      await createTestStudent();

    try {
      const exam =
        await createTestExam(
          teacher.id,
          {
            title:
              "Unpublished Secure Exam",

            published: false,
            isPublished: false,

            isAlwaysAvailable:
              true,
          }
        );

      await assert.rejects(
        () =>
          ExamService
            .getExamForStudent(
              exam.id,
              student
            ),
        (error) => {
          assert.equal(
            error.statusCode,
            403
          );

          assert.match(
            error.message,
            /not published/i
          );

          return true;
        }
      );
    } finally {
      await cleanupTestUser(
        student.id
      );

      await cleanupTestUser(
        teacher.id
      );
    }
  }
);

after(async () => {
  await pool.end();
});