import {
  randomUUID,
} from "node:crypto";

import "./bootstrap.js";

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
  const user = await factory();

  createdUserIds.push(user.id);

  return user;
}

test(
  "student can review their own released submission",
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
      await createTestExam(
        teacher.id,
        {
          title:
            `Review Test ${Date.now()}`,

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

        "What does integration testing verify?",

        JSON.stringify([
          "Interactions between components",
          "Only CSS styles",
          "Only one function",
          "Only database indexes",
        ]),

        JSON.stringify(
          "Interactions between components"
        ),
      ]
    );

    const fullExam =
      await ExamService.getExam(
        exam.id,
        {
          ...teacher,
          role: "Teacher",
        }
      );

    assert.equal(
      fullExam.questions.length,
      1
    );

    assert.ok(
      Array.isArray(
        fullExam.questions
      ),
      "Exam questions were not returned as an array."
    );

    assert.ok(
      fullExam.questions[0],
      `No question was returned. Exam: ${JSON.stringify(
        fullExam
      )}`
    );

    const question =
      fullExam.questions[0];

    assert.ok(
      question,
      "The test question was not returned with the exam."
    );

    assert.equal(
      question.id,
      questionId
    );

    const submission =
      await ExamService.submitAnswers(
        {
          examId: exam.id,

          answers: {
            [question.id]:
              "Interactions between components",
          },
        },
        {
          ...student,
          role: "Student",
        }
      );

    /*
     * Release feedback and score.
     */
    await ExamService.updateSubmissionFeedback(
      submission.id,
      {
        feedback:
          "Excellent understanding.",

        questionFeedback: {
          [question.id]:
            "Correct answer.",
        },

        isFeedbackVisible:
          true,

        isScorePublished:
          true,
      },
      {
        ...teacher,
        role: "Teacher",
      }
    );

    const review =
      await ExamService
        .getStudentSubmissionReview(
          submission.id,
          {
            ...student,
            role: "Student",
          }
        );

    assert.ok(review);

    assert.equal(
      review.id,
      submission.id
    );

    assert.equal(
      review.examId,
      exam.id
    );

    assert.equal(
      review.examTitle,
      exam.title
    );

    assert.equal(
      Number(review.score),
      10
    );

    assert.equal(
      Number(review.maxScore),
      10
    );

    assert.equal(
      Number(review.percentage),
      100
    );

    assert.equal(
      review.isScorePublished,
      true
    );

    assert.equal(
      review.isFeedbackVisible,
      true
    );

    assert.equal(
      review.feedback,
      "Excellent understanding."
    );

    assert.equal(
      review.questions.length,
      1
    );

    const reviewedQuestion =
      review.questions[0];

    assert.equal(
      reviewedQuestion.questionId,
      question.id
    );

    assert.equal(
      reviewedQuestion.text,
      "What does integration testing verify?"
    );

    assert.equal(
      reviewedQuestion.studentAnswer,
      "Interactions between components"
    );

    assert.equal(
      Number(
        reviewedQuestion.awardedPoints
      ),
      10
    );

    assert.equal(
      reviewedQuestion.feedback,
      "Correct answer."
    );

    /*
     * Security: correct answers must never
     * be included in the student review.
     */
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        reviewedQuestion,
        "correctAnswer"
      ),
      false
    );

    assert.equal(
      Object.prototype.hasOwnProperty.call(
        reviewedQuestion,
        "correct_answer"
      ),
      false
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

test(
  "student cannot review another student's submission",
  async () => {
    const teacher =
      await createUser(
        createTestTeacher
      );

    const ownerStudent =
      await createUser(
        createTestStudent
      );

    const otherStudent =
      await createUser(
        createTestStudent
      );

    const exam =
      await createTestExam(
        teacher.id,
        {
          title:
            `Private Review Test ${Date.now()}`,
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
        "Which student owns this submission?",
        JSON.stringify([
          "The submitting student",
          "Any logged-in student",
        ]),
        JSON.stringify(
          "The submitting student"
        ),
      ]
    );

    const submission =
      await ExamService.submitAnswers(
        {
          examId: exam.id,
          answers: {
            [questionId]:
              "The submitting student",
          },
        },
        {
          ...ownerStudent,
          role: "Student",
        }
      );

    await assert.rejects(
      () =>
        ExamService
          .getStudentSubmissionReview(
            submission.id,
            {
              ...otherStudent,
              role: "Student",
            }
          ),
      (error) => {
        assert.equal(
          error.statusCode,
          403
        );

        assert.match(
          error.message,
          /another student|cannot access/i
        );

        return true;
      }
    );
  }
);

test(
  "student cannot see unpublished score or hidden feedback",
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
      await createTestExam(
        teacher.id,
        {
          title:
            `Hidden Review Test ${Date.now()}`,
          published: true,
          isPublished: true,
          isAlwaysAvailable: true,
          releaseScoresImmediately:
            false,
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
        "What should remain hidden?",
        JSON.stringify([
          "Unreleased scores and feedback",
          "The exam title",
        ]),
        JSON.stringify(
          "Unreleased scores and feedback"
        ),
      ]
    );

    const submission =
      await ExamService.submitAnswers(
        {
          examId: exam.id,
          answers: {
            [questionId]:
              "Unreleased scores and feedback",
          },
        },
        {
          ...student,
          role: "Student",
        }
      );

    const review =
      await ExamService
        .getStudentSubmissionReview(
          submission.id,
          {
            ...student,
            role: "Student",
          }
        );

    assert.equal(
      review.isScorePublished,
      false
    );

    assert.equal(
      review.isFeedbackVisible,
      false
    );

    assert.equal(
      review.score,
      null
    );

    assert.equal(
      review.percentage,
      null
    );

    assert.equal(
      review.feedback,
      ""
    );

    assert.equal(
      review.questions.length,
      1
    );

    const question =
      review.questions[0];

    assert.equal(
      question.studentAnswer,
      "Unreleased scores and feedback"
    );

    assert.equal(
      question.feedback,
      ""
    );

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
  }
);