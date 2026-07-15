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

async function createWrittenExam(
  teacherId
) {
  const exam =
    await createTestExam(
      teacherId,
      {
        title:
          `AI Written Submission ${Date.now()}-${randomUUID()}`,

        published: true,
        isPublished: true,
        isAlwaysAvailable: true,
        releaseScoresImmediately:
          false,

        passingScore: 60,
        timeLimit: 30,
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
        "TCP is connection-oriented, reliable, ordered, and retransmits lost packets. UDP is connectionless and does not guarantee delivery or ordering."
      ),

      "Mention reliability, ordering, connection behavior, and retransmission.",
    ]
  );

  return {
    ...exam,
    questionId,
  };
}

function createFakeAiGradingService() {
  const calls = [];

  return {
    calls,

    async gradeWrittenAnswer(
      payload
    ) {
      calls.push(payload);

      return {
        status:
          "ai-suggestion-ready",

        awardedPoints: 8,
        maxPoints: 10,
        confidence: 0.88,

        feedback:
          "Good answer, but ordering and connection behavior were not fully explained.",

        strengths: [
          "Correctly identified reliability",
          "Correctly identified the speed tradeoff",
        ],

        missingConcepts: [
          "Packet ordering",
          "Connection-oriented versus connectionless behavior",
        ],

        requiresTeacherReview:
          true,
      };
    },
  };
}

test(
  "written submission stores an AI suggestion without setting the final teacher grade",
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
      await createWrittenExam(
        teacher.id
      );

    const fakeAiService =
      createFakeAiGradingService();

    const submission =
      await ExamService
        .submitAnswers(
          {
            examId: exam.id,

            answers: {
              [exam.questionId]:
                "TCP guarantees delivery, while UDP is generally faster.",
            },
          },

          {
            ...student,
            role: "Student",
          },

          {
            aiGradingService:
              fakeAiService,
          }
        );

    assert.ok(
      submission?.id,
      "Submission was not created."
    );

    assert.equal(
      fakeAiService.calls.length,
      1
    );

    const gradingCall =
      fakeAiService.calls[0];

    assert.equal(
      gradingCall.question,
      "Explain the difference between TCP and UDP."
    );

    assert.match(
      gradingCall.referenceAnswer,
      /connection-oriented/i
    );

    assert.equal(
      gradingCall.studentAnswer,
      "TCP guarantees delivery, while UDP is generally faster."
    );

    assert.equal(
      gradingCall.maxPoints,
      10
    );

    const stored =
      await SubmissionRepository
        .findById(
          submission.id
        );

    assert.ok(stored);

    const answer =
      stored.answerDetails.find(
        (item) =>
          String(
            item.questionId
          ) ===
          String(
            exam.questionId
          )
      );

    assert.ok(
      answer,
      "Written submission answer was not stored."
    );

    /*
     * AI suggestion fields.
     */
    assert.equal(
      answer.aiAwardedPoints,
      8
    );

    assert.equal(
      answer.aiConfidence,
      0.88
    );

    assert.equal(
      answer.aiGradingStatus,
      "ai-suggestion-ready"
    );

    assert.match(
      answer.aiFeedback,
      /ordering/i
    );

    assert.deepEqual(
      answer.aiStrengths,
      [
        "Correctly identified reliability",
        "Correctly identified the speed tradeoff",
      ]
    );

    assert.deepEqual(
      answer.aiMissingConcepts,
      [
        "Packet ordering",
        "Connection-oriented versus connectionless behavior",
      ]
    );

    /*
     * The AI suggestion must not become
     * the final teacher-controlled grade.
     */
    assert.equal(
      answer.awardedPoints,
      null
    );

    assert.equal(
      answer.feedback,
      ""
    );

    assert.equal(
      answer.isCorrect,
      null
    );

    assert.equal(
      stored.isScorePublished,
      false
    );

    assert.equal(
      stored.isFeedbackVisible,
      false
    );
  }
);

test(
  "AI grading failure does not fail the student submission",
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
      await createWrittenExam(
        teacher.id
      );

    const failingAiService = {
      async gradeWrittenAnswer() {
        return {
          status:
            "ai-grading-failed",

          awardedPoints: null,
          maxPoints: 10,
          confidence: null,

          feedback:
            "AI grading is currently unavailable. Manual teacher review is required.",

          strengths: [],
          missingConcepts: [],

          requiresTeacherReview:
            true,
        };
      },
    };

    const submission =
      await ExamService
        .submitAnswers(
          {
            examId: exam.id,

            answers: {
              [exam.questionId]:
                "TCP is reliable and UDP is faster.",
            },
          },

          {
            ...student,
            role: "Student",
          },

          {
            aiGradingService:
              failingAiService,
          }
        );

    assert.ok(
      submission?.id,
      "Submission should still be created when AI grading fails."
    );

    const stored =
      await SubmissionRepository
        .findById(
          submission.id
        );

    const answer =
      stored.answerDetails.find(
        (item) =>
          String(
            item.questionId
          ) ===
          String(
            exam.questionId
          )
      );

    assert.ok(answer);

    assert.equal(
      answer.aiGradingStatus,
      "ai-grading-failed"
    );

    assert.equal(
      answer.aiAwardedPoints,
      null
    );

    assert.equal(
      answer.awardedPoints,
      null
    );

    assert.equal(
      stored.status,
      "submitted"
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
