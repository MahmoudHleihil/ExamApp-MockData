import "./bootstrap.js";

import {
  randomUUID,
} from "node:crypto";

import test, {
  beforeEach,
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

const createdUserIds = [];
const createdExamIds = [];

let teacher;
let otherTeacher;
let student;
let exam;
let questionId;
let submissionId;

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

async function createAiGradedSubmission() {
  teacher =
    await createUser(
      createTestTeacher
    );

  otherTeacher =
    await createUser(
      createTestTeacher
    );

  student =
    await createUser(
      createTestStudent
    );

  exam =
    await createTestExam(
      teacher.id,
      {
        title:
          `AI Review Exam ${Date.now()}-${randomUUID()}`,

        published: true,
        isPublished: true,
        isAlwaysAvailable: true,
        releaseScoresImmediately:
          false,

        passingScore: 60,
      }
    );

  createdExamIds.push(
    exam.id
  );

  questionId =
    randomUUID();

  submissionId =
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
        points,
        source_evidence
      )
      VALUES (
        $1,
        $2,
        0,
        'written',
        $3,
        '[]'::JSONB,
        $4::JSONB,
        10,
        $5
      )
    `,
    [
      questionId,
      exam.id,

      "Explain the difference between TCP and UDP.",

      JSON.stringify(
        "TCP is reliable, ordered, and connection-oriented. UDP is connectionless and does not guarantee delivery or ordering."
      ),

      "Mention reliability, ordering, and connection behavior.",
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
        0,
        10,
        0,
        NOW(),
        '',
        FALSE,
        FALSE
      )
    `,
    [
      submissionId,
      exam.id,
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
        feedback,
        ai_awarded_points,
        ai_confidence,
        ai_feedback,
        ai_strengths,
        ai_missing_concepts,
        ai_grading_status,
        ai_graded_at
      )
      VALUES (
        $1,
        $2,
        $3::JSONB,
        NULL,
        NULL,
        '',
        8,
        0.88,
        $4,
        $5::JSONB,
        $6::JSONB,
        'ai-suggestion-ready',
        NOW()
      )
    `,
    [
      submissionId,
      questionId,

      JSON.stringify(
        "TCP guarantees delivery, while UDP is generally faster."
      ),

      "Good answer, but ordering and connection behavior were not fully explained.",

      JSON.stringify([
        "Correctly identified reliability",
      ]),

      JSON.stringify([
        "Packet ordering",
        "Connection-oriented versus connectionless behavior",
      ]),
    ]
  );
}

beforeEach(async () => {
  await createAiGradedSubmission();
});

test(
  "exam owner can accept the AI grading suggestion",
  async () => {
    const updated =
      await ExamService
        .reviewAiGradingSuggestion(
          submissionId,
          questionId,
          {
            action: "accept",
          },
          {
            ...teacher,
            role: "Teacher",
          }
        );

    assert.ok(updated);

    const answer =
      updated.answerDetails.find(
        (item) =>
          String(
            item.questionId
          ) ===
          String(
            questionId
          )
      );

    assert.ok(answer);

    assert.equal(
      answer.awardedPoints,
      8
    );

    assert.equal(
      answer.feedback,
      "Good answer, but ordering and connection behavior were not fully explained."
    );

    assert.equal(
      answer.aiGradingStatus,
      "accepted"
    );

    assert.equal(
      updated.score,
      8
    );

    assert.equal(
      updated.maxScore,
      10
    );

    assert.equal(
      updated.percentage,
      80
    );

    assert.equal(
      updated.isScorePublished,
      false
    );
  }
);

test(
  "exam owner can override the AI grading suggestion",
  async () => {
    const updated =
      await ExamService
        .reviewAiGradingSuggestion(
          submissionId,
          questionId,
          {
            action:
              "override",

            awardedPoints: 6,

            feedback:
              "The answer is partly correct, but important protocol properties are missing.",
          },
          {
            ...teacher,
            role: "Teacher",
          }
        );

    const answer =
      updated.answerDetails.find(
        (item) =>
          String(
            item.questionId
          ) ===
          String(
            questionId
          )
      );

    assert.equal(
      answer.awardedPoints,
      6
    );

    assert.equal(
      answer.feedback,
      "The answer is partly correct, but important protocol properties are missing."
    );

    assert.equal(
      answer.aiGradingStatus,
      "overridden"
    );

    assert.equal(
      updated.score,
      6
    );

    assert.equal(
      updated.percentage,
      60
    );
  }
);

test(
  "exam owner can reject the AI suggestion without assigning a final grade",
  async () => {
    const updated =
      await ExamService
        .reviewAiGradingSuggestion(
          submissionId,
          questionId,
          {
            action: "reject",
          },
          {
            ...teacher,
            role: "Teacher",
          }
        );

    const answer =
      updated.answerDetails.find(
        (item) =>
          String(
            item.questionId
          ) ===
          String(
            questionId
          )
      );

    assert.equal(
      answer.awardedPoints,
      null
    );

    assert.equal(
      answer.feedback,
      ""
    );

    assert.equal(
      answer.aiGradingStatus,
      "rejected"
    );

    assert.equal(
      updated.score,
      0
    );

    assert.equal(
      updated.percentage,
      0
    );

    assert.equal(
      updated.status,
      "submitted"
    );
  }
);

test(
  "teacher cannot review an AI suggestion for another teacher's exam",
  async () => {
    await assert.rejects(
      () =>
        ExamService
          .reviewAiGradingSuggestion(
            submissionId,
            questionId,
            {
              action:
                "accept",
            },
            {
              ...otherTeacher,
              role: "Teacher",
            }
          ),

      (error) => {
        assert.equal(
          error.statusCode,
          403
        );

        assert.match(
          error.message,
          /not allowed|another teacher|owner/i
        );

        return true;
      }
    );
  }
);

test(
  "override cannot exceed the question maximum",
  async () => {
    await assert.rejects(
      () =>
        ExamService
          .reviewAiGradingSuggestion(
            submissionId,
            questionId,
            {
              action:
                "override",

              awardedPoints:
                15,

              feedback:
                "Invalid override",
            },
            {
              ...teacher,
              role: "Teacher",
            }
          ),

      (error) => {
        assert.equal(
          error.statusCode,
          400
        );

        assert.match(
          error.message,
          /maximum|points/i
        );

        return true;
      }
    );
  }
);

test(
  "unsupported AI review action is rejected",
  async () => {
    await assert.rejects(
      () =>
        ExamService
          .reviewAiGradingSuggestion(
            submissionId,
            questionId,
            {
              action:
                "approve-everything",
            },
            {
              ...teacher,
              role: "Teacher",
            }
          ),

      (error) => {
        assert.equal(
          error.statusCode,
          400
        );

        assert.match(
          error.message,
          /invalid.*action/i
        );

        return true;
      }
    );
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

  await pool.end();
});

test(
  "AI review controller returns the recalculated submission",
  async () => {
    const updated =
      await ExamService
        .reviewAiGradingSuggestion(
          submissionId,
          questionId,
          {
            action: "accept",
          },
          {
            ...teacher,
            role: "Teacher",
          }
        );

    assert.equal(
      updated.score,
      8
    );

    assert.equal(
      updated.percentage,
      80
    );

    const answer =
      updated.answerDetails.find(
        (item) =>
          String(item.questionId) ===
          String(questionId)
      );

    assert.equal(
      answer.aiGradingStatus,
      "accepted"
    );
  }
);