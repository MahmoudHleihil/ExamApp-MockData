import "./bootstrap.js";

import {
  randomUUID,
} from "node:crypto";

import test, {
  before,
  after,
} from "node:test";

import assert from "node:assert/strict";

const {
  default: pool,
} = await import(
  "../config/database.js"
);

const {
  default:
    SubmissionRepository,
} = await import(
  "../repositories/SubmissionRepository.js"
);

const {
  createTestTeacher,
  createTestStudent,
  createTestExam,
  cleanupTestUser,
} = await import(
  "./helpers/databaseTestUtils.js"
);

let teacher;
let student;
let examId;
let submissionId;
let questionId;

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

before(async () => {
  teacher =
    await createUser(
      createTestTeacher
    );

  student =
    await createUser(
      createTestStudent
    );

  const exam =
    await createTestExam(
      teacher.id,
      {
        title:
          `AI Persistence Test ${Date.now()}`,

        published: true,
        isPublished: true,
        isAlwaysAvailable: true,
      }
    );

  examId = exam.id;
  questionId = randomUUID();
  submissionId = randomUUID();

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
        '[]'::JSONB,
        $4::JSONB,
        10
      )
    `,
    [
      questionId,
      examId,
      "Explain the difference between TCP and UDP.",
      JSON.stringify(
        "TCP is reliable, connection-oriented, and ordered. UDP is connectionless and does not guarantee delivery or ordering."
      ),
    ]
  );

  await pool.query(
    `
      INSERT INTO exam_submissions (
        id,
        exam_id,
        student_id,
        status,
        score,
        max_score,
        percentage,
        submitted_at,
        feedback,
        is_feedback_visible,
        is_score_published
      )
      VALUES (
        $1,
        $2,
        $3,
        'submitted',
        4,
        10,
        40,
        NOW(),
        'Existing teacher feedback',
        FALSE,
        FALSE
      )
    `,
    [
      submissionId,
      examId,
      student.id,
    ]
  );

  await pool.query(
    `
      INSERT INTO submission_answers (
        submission_id,
        question_id,
        answer,
        is_correct,
        awarded_points,
        feedback
      )
      VALUES (
        $1,
        $2,
        $3::JSONB,
        FALSE,
        4,
        'Existing answer feedback'
      )
    `,
    [
      submissionId,
      questionId,
      JSON.stringify(
        "TCP guarantees delivery while UDP is faster."
      ),
    ]
  );
const rawAiResult =
  await pool.query(
    `
      SELECT
        ai_awarded_points,
        ai_confidence,
        ai_grading_status
      FROM submission_answers
      WHERE
        submission_id = $1
        AND question_id = $2
    `,
    [
      submissionId,
      exam.questionId,
    ]
  );

console.log(
  "Raw AI grading row:",
  rawAiResult.rows[0]
);
});

test(
  "AI suggestion persists without changing the final grade",
  async () => {
    const beforeResult =
      await pool.query(
        `
          SELECT *
          FROM submission_answers
          WHERE
            submission_id = $1
            AND question_id = $2
        `,
        [
          submissionId,
          questionId,
        ]
      );

    const before =
      beforeResult.rows[0];

    assert.ok(
      before,
      "Submission answer was not created."
    );

    const updated =
      await SubmissionRepository
        .updateAiGradingSuggestion(
          submissionId,
          questionId,
          {
            awardedPoints: 8,
            confidence: 0.87,
            feedback:
              "Good answer, but two concepts are missing.",

            strengths: [
              "Correctly explained reliability",
            ],

            missingConcepts: [
              "Ordering",
              "Connection establishment",
            ],

            status:
              "ai-suggestion-ready",
          }
        );

    assert.equal(
      updated.aiAwardedPoints,
      8
    );

    assert.equal(
      updated.aiConfidence,
      0.87
    );

    assert.equal(
      updated.aiGradingStatus,
      "ai-suggestion-ready"
    );

    assert.equal(
      updated.aiFeedback,
      "Good answer, but two concepts are missing."
    );

    assert.deepEqual(
      updated.aiStrengths,
      [
        "Correctly explained reliability",
      ]
    );

    assert.deepEqual(
      updated.aiMissingConcepts,
      [
        "Ordering",
        "Connection establishment",
      ]
    );

    assert.ok(
      updated.aiGradedAt
    );

    const afterResult =
      await pool.query(
        `
          SELECT *
          FROM submission_answers
          WHERE
            submission_id = $1
            AND question_id = $2
        `,
        [
          submissionId,
          questionId,
        ]
      );

    const after =
      afterResult.rows[0];

    assert.ok(after);

    /*
     * Final teacher-controlled grading fields
     * must remain unchanged.
     */
    assert.equal(
      Number(
        after.awarded_points
      ),
      Number(
        before.awarded_points
      )
    );

    assert.equal(
      after.feedback,
      before.feedback
    );

    assert.equal(
      after.is_correct,
      before.is_correct
    );

    /*
     * AI-specific fields must be persisted.
     */
    assert.equal(
      Number(
        after.ai_awarded_points
      ),
      8
    );

    assert.equal(
      Number(
        after.ai_confidence
      ),
      0.87
    );

    assert.equal(
      after.ai_grading_status,
      "ai-suggestion-ready"
    );
  }
);

test(
  "failed AI grading status can be persisted",
  async () => {
    const updated =
      await SubmissionRepository
        .updateAiGradingSuggestion(
          submissionId,
          questionId,
          {
            awardedPoints: null,
            confidence: null,

            feedback:
              "AI grading is unavailable. Manual review is required.",

            strengths: [],
            missingConcepts: [],

            status:
              "ai-grading-failed",
          }
        );

    assert.equal(
      updated.aiAwardedPoints,
      null
    );

    assert.equal(
      updated.aiConfidence,
      null
    );

    assert.equal(
      updated.aiGradingStatus,
      "ai-grading-failed"
    );

    assert.equal(
      updated.aiFeedback,
      "AI grading is unavailable. Manual review is required."
    );

    assert.deepEqual(
      updated.aiStrengths,
      []
    );

    assert.deepEqual(
      updated.aiMissingConcepts,
      []
    );

    /*
     * A failed AI attempt must still not
     * overwrite the teacher grade.
     */
    assert.equal(
      updated.awardedPoints,
      4
    );

    assert.equal(
      updated.feedback,
      "Existing answer feedback"
    );
  }
);

test(
  "AI suggestion cannot be saved for an unknown submission answer",
  async () => {
    await assert.rejects(
      () =>
        SubmissionRepository
          .updateAiGradingSuggestion(
            randomUUID(),
            questionId,
            {
              awardedPoints: 5,
              confidence: 0.5,
              feedback: "",
              strengths: [],
              missingConcepts: [],
              status:
                "ai-suggestion-ready",
            }
          ),
      (error) => {
        assert.equal(
          error.statusCode,
          404
        );

        assert.match(
          error.message,
          /submission answer not found/i
        );

        return true;
      }
    );
  }
);

after(async () => {
  if (submissionId) {
    await pool.query(
      `
        DELETE FROM exam_submissions
        WHERE id = $1
      `,
      [submissionId]
    );
  }

  if (examId) {
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

  await pool.end();
});