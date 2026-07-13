import "./bootstrap.js";

import {
  randomUUID,
} from "crypto";

import test, {
  after,
} from "node:test";

import assert from "node:assert/strict";

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
  default: pool,
} = await import(
  "../config/database.js"
);

const {
  createTestTeacher,
  createTestStudent,
  createTestAdmin,
  createTestExam,
  createTestSubmission,
  cleanupTestUser,
} = await import(
  "./helpers/databaseTestUtils.js"
);

test(
  "student cannot see an unpublished score",
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
              "Hidden Score Exam",
          }
        );

      await createTestSubmission({
        examId: exam.id,
        studentId: student.id,
        score: 88,
        maxScore: 100,
        percentage: 88,
        isScorePublished: false,
        feedback:
          "Private teacher feedback",
        isFeedbackVisible: false,
      });

      const submissions =
        await ExamService
          .getMySubmissions(
            student
          );

      assert.equal(
        submissions.length,
        1
      );

      const submission =
        submissions[0];

      assert.equal(
        submission.examId,
        exam.id
      );

      assert.equal(
        submission.score,
        null
      );

      assert.equal(
        submission.maxScore,
        null
      );

      assert.equal(
        submission.percentage,
        null
      );

      assert.equal(
        submission.feedback,
        ""
      );

      assert.equal(
        submission.isScorePublished,
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
  "student can see a published score",
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
              "Published Score Exam",
          }
        );

      await createTestSubmission({
        examId: exam.id,
        studentId: student.id,
        score: 91,
        maxScore: 100,
        percentage: 91,
        isScorePublished: true,
        isFeedbackVisible: true,
        feedback:
          "Excellent work",
      });

      const submissions =
        await ExamService
          .getMySubmissions(
            student
          );

      assert.equal(
        submissions.length,
        1
      );

      const submission =
        submissions[0];

      assert.equal(
        submission.score,
        91
      );

      assert.equal(
        submission.maxScore,
        100
      );

      assert.equal(
        submission.percentage,
        91
      );

      assert.equal(
        submission.feedback,
        "Excellent work"
      );

      assert.equal(
        submission.isScorePublished,
        true
      );

      assert.equal(
        submission.isFeedbackVisible,
        true
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
  "student only receives their own submissions",
  async () => {
    const teacher =
      await createTestTeacher();

    const firstStudent =
      await createTestStudent();

    const secondStudent =
      await createTestStudent();

    try {
      const exam =
        await createTestExam(
          teacher.id,
          {
            title:
              "Student Isolation Exam",
          }
        );

      await createTestSubmission({
        examId: exam.id,
        studentId:
          firstStudent.id,
        score: 70,
        percentage: 70,
        isScorePublished: true,
      });

      await createTestSubmission({
        examId: exam.id,
        studentId:
          secondStudent.id,
        score: 95,
        percentage: 95,
        isScorePublished: true,
      });

      const firstResults =
        await ExamService
          .getMySubmissions(
            firstStudent
          );

      const secondResults =
        await ExamService
          .getMySubmissions(
            secondStudent
          );

      assert.equal(
        firstResults.length,
        1
      );

      assert.equal(
        secondResults.length,
        1
      );

      assert.equal(
        firstResults[0]
          .studentId,
        firstStudent.id
      );

      assert.equal(
        secondResults[0]
          .studentId,
        secondStudent.id
      );

      assert.equal(
        firstResults[0].score,
        70
      );

      assert.equal(
        secondResults[0].score,
        95
      );
    } finally {
      await cleanupTestUser(
        firstStudent.id
      );

      await cleanupTestUser(
        secondStudent.id
      );

      await cleanupTestUser(
        teacher.id
      );
    }
  }
);

test(
  "teacher only receives submissions for exams they own",
  async () => {
    const firstTeacher =
      await createTestTeacher();

    const secondTeacher =
      await createTestTeacher();

    const student =
      await createTestStudent();

    try {
      const firstExam =
        await createTestExam(
          firstTeacher.id,
          {
            title:
              "First Teacher Exam",
          }
        );

      const secondExam =
        await createTestExam(
          secondTeacher.id,
          {
            title:
              "Second Teacher Exam",
          }
        );

      await createTestSubmission({
        examId:
          firstExam.id,
        studentId:
          student.id,
        score: 75,
        percentage: 75,
      });

      /*
       * A database constraint allows only one
       * submission per student per exam, so this
       * second exam is safe.
       */
      await createTestSubmission({
        examId:
          secondExam.id,
        studentId:
          student.id,
        score: 85,
        percentage: 85,
      });

      const firstTeacherResults =
        await ExamService
          .getAllSubmissions(
            firstTeacher
          );

      const secondTeacherResults =
        await ExamService
          .getAllSubmissions(
            secondTeacher
          );

      assert.equal(
        firstTeacherResults.length,
        1
      );

      assert.equal(
        secondTeacherResults.length,
        1
      );

      assert.equal(
        firstTeacherResults[0]
          .examId,
        firstExam.id
      );

      assert.equal(
        secondTeacherResults[0]
          .examId,
        secondExam.id
      );
    } finally {
      await cleanupTestUser(
        student.id
      );

      await cleanupTestUser(
        firstTeacher.id
      );

      await cleanupTestUser(
        secondTeacher.id
      );
    }
  }
);

test(
  "teacher cannot grade another teacher's submission",
  async () => {
    const ownerTeacher =
      await createTestTeacher();

    const otherTeacher =
      await createTestTeacher();

    const student =
      await createTestStudent();

    try {
      const exam =
        await createTestExam(
          ownerTeacher.id,
          {
            title:
              "Ownership Grading Exam",
          }
        );

      const submission =
        await createTestSubmission({
          examId: exam.id,
          studentId: student.id,
          score: 60,
          maxScore: 100,
          percentage: 60,
          status: "grading",
          isScorePublished: false,
        });

      await assert.rejects(
        () =>
          ExamService
            .gradeSubmission(
              submission.id,
              {
                feedback:
                  "Unauthorized grading attempt",
                answers: [],
              },
              otherTeacher
            ),
        (error) => {
          assert.equal(
            error.statusCode,
            403
          );

          assert.match(
            error.message,
            /cannot grade|forbidden/i
          );

          return true;
        }
      );

      const unchanged =
        await SubmissionRepository
          .findById(
            submission.id
          );

      assert.notEqual(
        unchanged.feedback,
        "Unauthorized grading attempt"
      );
    } finally {
      await cleanupTestUser(
        student.id
      );

      await cleanupTestUser(
        ownerTeacher.id
      );

      await cleanupTestUser(
        otherTeacher.id
      );
    }
  }
);

test(
  "exam owner can grade their student's submission",
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
              "Teacher Grading Exam",
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
            'written',
            'Explain dependency injection.',
            '[]'::JSONB,
            '"Expected explanation"'::JSONB,
            10
          )
        `,
        [
          questionId,
          exam.id,
        ]
      );

      const submission =
        await createTestSubmission({
          examId: exam.id,
          studentId: student.id,
          score: 0,
          maxScore: 10,
          percentage: 0,
          status: "grading",
          isScorePublished: false,
        });

      await pool.query(
        `
          INSERT INTO submission_answers (
            submission_id,
            question_id,
            answer,
            awarded_points,
            feedback
          )
          VALUES (
            $1,
            $2,
            $3::JSONB,
            NULL,
            ''
          )
        `,
        [
          submission.id,
          questionId,
          JSON.stringify(
            "Dependency injection supplies dependencies externally."
          ),
        ]
      );

      const graded =
        await ExamService
          .gradeSubmission(
            submission.id,
            {
              feedback:
                "Good explanation",
              answers: [
                {
                  questionId,
                  awardedPoints: 8,
                  feedback:
                    "Clear but needs an example",
                },
              ],
            },
            teacher
          );

      assert.equal(
        graded.status,
        "graded"
      );

      assert.equal(
        graded.score,
        8
      );

      assert.equal(
        graded.maxScore,
        10
      );

      assert.equal(
        graded.percentage,
        80
      );

      assert.equal(
        graded.feedback,
        "Good explanation"
      );

      assert.equal(
        graded.gradedBy,
        teacher.id
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
  "admin can access submissions from all teachers",
  async () => {
    const admin =
      await createTestAdmin();

    const firstTeacher =
      await createTestTeacher();

    const secondTeacher =
      await createTestTeacher();

    const student =
      await createTestStudent();

    try {
      const firstExam =
        await createTestExam(
          firstTeacher.id
        );

      const secondExam =
        await createTestExam(
          secondTeacher.id
        );

      await createTestSubmission({
        examId:
          firstExam.id,
        studentId:
          student.id,
      });

      await createTestSubmission({
        examId:
          secondExam.id,
        studentId:
          student.id,
      });

      const submissions =
        await ExamService
          .getAllSubmissions(
            admin
          );

      const testSubmissionExamIds =
        submissions
          .map(
            (submission) =>
              submission.examId
          )
          .filter((examId) =>
            [
              firstExam.id,
              secondExam.id,
            ].includes(examId)
          );

      assert.equal(
        testSubmissionExamIds
          .length,
        2
      );

      assert.ok(
        testSubmissionExamIds
          .includes(firstExam.id)
      );

      assert.ok(
        testSubmissionExamIds
          .includes(secondExam.id)
      );
    } finally {
      await cleanupTestUser(
        student.id
      );

      await cleanupTestUser(
        firstTeacher.id
      );

      await cleanupTestUser(
        secondTeacher.id
      );

      await cleanupTestUser(
        admin.id
      );
    }
  }
);

after(async () => {
  await pool.end();
});