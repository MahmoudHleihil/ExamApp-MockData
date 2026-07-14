import pool from "../config/database.js";
import { randomUUID } from "crypto";

class SubmissionRepository {
  mapAnswer(row) {
    if (!row) return null;

    return {
      id: row.id,
      submissionId: row.submission_id,
      questionId: row.question_id,
      answer: row.answer,
      isCorrect: row.is_correct,
      awardedPoints:
        row.awarded_points === null
          ? null
          : Number(row.awarded_points),
      feedback: row.feedback || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  mapSubmission(row, answers = []) {
    if (!row) return null;

    const answerObject = {};
    const questionFeedback = {};

    for (const answer of answers) {
      answerObject[answer.questionId] =
        answer.answer;

      if (answer.feedback) {
        questionFeedback[answer.questionId] =
          answer.feedback;
      }
    }

    return {
      id: row.id,

      examId: row.exam_id,
      examTitle: row.exam_title,

      studentId: row.student_id,
      studentName: row.student_name,
      studentEmail: row.student_email,

      status: row.status,

      score:
        row.score === null
          ? null
          : Number(row.score),

      maxScore:
        row.max_score === null
          ? null
          : Number(row.max_score),

      percentage:
        row.percentage === null
          ? null
          : Number(row.percentage),

      startedAt: row.started_at,
      submittedAt: row.submitted_at,
      gradedAt: row.graded_at,

      // Compatibility with your old mockDb shape.
      date:
        row.submitted_at ||
        row.created_at,

      feedback: row.feedback || "",

      isFeedbackVisible:
        row.is_feedback_visible,

      isScorePublished:
        row.is_score_published,

      gradedBy: row.graded_by,
      graderName: row.grader_name,

      answers: answerObject,
      answerDetails: answers,
      questionFeedback,

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getAnswers(
    submissionId,
    client = pool
  ) {
    const result = await client.query(
      `
        SELECT
          id,
          submission_id,
          question_id,
          answer,
          is_correct,
          awarded_points,
          feedback,
          created_at,
          updated_at
        FROM submission_answers
        WHERE submission_id = $1
        ORDER BY id ASC
      `,
      [submissionId]
    );

    return result.rows.map((row) =>
      this.mapAnswer(row)
    );
  }

  async findById(id) {
    const result = await pool.query(
      `
        SELECT
          s.*,
          e.title AS exam_title,
          student.full_name AS student_name,
          student.email AS student_email,
          grader.full_name AS grader_name
        FROM exam_submissions s
        JOIN exams e
          ON e.id = s.exam_id
        JOIN users student
          ON student.id = s.student_id
        LEFT JOIN users grader
          ON grader.id = s.graded_by
        WHERE s.id = $1
        LIMIT 1
      `,
      [id]
    );

    const row = result.rows[0];

    if (!row) return null;

    const answers =
      await this.getAnswers(id);

    return this.mapSubmission(
      row,
      answers
    );
  }

  async findAll() {
    const result = await pool.query(`
      SELECT
        s.*,
        e.title AS exam_title,
        student.full_name AS student_name,
        student.email AS student_email,
        grader.full_name AS grader_name
      FROM exam_submissions s
      JOIN exams e
        ON e.id = s.exam_id
      JOIN users student
        ON student.id = s.student_id
      LEFT JOIN users grader
        ON grader.id = s.graded_by
      ORDER BY
        s.submitted_at DESC NULLS LAST,
        s.created_at DESC
    `);

    return Promise.all(
      result.rows.map(async (row) => {
        const answers =
          await this.getAnswers(row.id);

        return this.mapSubmission(
          row,
          answers
        );
      })
    );
  }

  async findByStudentId(studentId) {
    const result = await pool.query(
      `
        SELECT
          s.*,
          e.title AS exam_title,
          student.full_name AS student_name,
          student.email AS student_email,
          grader.full_name AS grader_name
        FROM exam_submissions s
        JOIN exams e
          ON e.id = s.exam_id
        JOIN users student
          ON student.id = s.student_id
        LEFT JOIN users grader
          ON grader.id = s.graded_by
        WHERE s.student_id = $1
        ORDER BY
          s.submitted_at DESC NULLS LAST,
          s.created_at DESC
      `,
      [studentId]
    );

    return Promise.all(
      result.rows.map(async (row) => {
        const answers =
          await this.getAnswers(row.id);

        return this.mapSubmission(
          row,
          answers
        );
      })
    );
  }

  async findByExam(examId) {
    const result = await pool.query(
      `
        SELECT
          s.*,
          e.title AS exam_title,
          student.full_name AS student_name,
          student.email AS student_email,
          grader.full_name AS grader_name
        FROM exam_submissions s
        JOIN exams e
          ON e.id = s.exam_id
        JOIN users student
          ON student.id = s.student_id
        LEFT JOIN users grader
          ON grader.id = s.graded_by
        WHERE s.exam_id = $1
        ORDER BY
          s.submitted_at DESC NULLS LAST,
          student.full_name ASC
      `,
      [examId]
    );

    return Promise.all(
      result.rows.map(async (row) => {
        const answers =
          await this.getAnswers(row.id);

        return this.mapSubmission(
          row,
          answers
        );
      })
    );
  }

  async findByStudentAndExam(
    studentId,
    examId
  ) {
    const result = await pool.query(
      `
        SELECT
          s.*,
          e.title AS exam_title,
          student.full_name AS student_name,
          student.email AS student_email,
          grader.full_name AS grader_name
        FROM exam_submissions s
        JOIN exams e
          ON e.id = s.exam_id
        JOIN users student
          ON student.id = s.student_id
        LEFT JOIN users grader
          ON grader.id = s.graded_by
        WHERE
          s.student_id = $1
          AND s.exam_id = $2
        LIMIT 1
      `,
      [studentId, examId]
    );

    const row = result.rows[0];

    if (!row) return null;

    const answers =
      await this.getAnswers(row.id);

    return this.mapSubmission(
      row,
      answers
    );
  }

  async create(data) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const submissionId =
        data.id || randomUUID();

      const submissionResult =
        await client.query(
          `
            INSERT INTO exam_submissions (
              id,
              exam_id,
              student_id,
              status,
              score,
              max_score,
              percentage,
              started_at,
              submitted_at,
              graded_at,
              feedback,
              is_feedback_visible,
              is_score_published,
              graded_by
            )
            VALUES (
              $1, $2, $3, $4,
              $5, $6, $7, $8,
              $9, $10, $11, $12,
              $13, $14
            )
            RETURNING id
          `,
          [
            submissionId,
            data.examId,
            data.studentId,
            data.status || "submitted",

            data.score ?? null,
            data.maxScore ?? null,
            data.percentage ?? null,

            data.startedAt || null,
            data.submittedAt ||
              new Date().toISOString(),

            data.gradedAt || null,

            data.feedback || "",
            data.isFeedbackVisible || false,
            data.isScorePublished || false,

            data.gradedBy || null,
          ]
        );

      const answers =
        this.normalizeAnswers(
          data.answers
        );

      for (const answer of answers) {
        await client.query(
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
              $4,
              $5,
              $6
            )
          `,
          [
            submissionId,
            answer.questionId,
            JSON.stringify(
              answer.answer
            ),
            answer.isCorrect ?? null,
            answer.awardedPoints ?? null,
            answer.feedback || "",
          ]
        );
      }

      await client.query("COMMIT");

      return this.findById(
        submissionResult.rows[0].id
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id, updates = {}) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const allowedFields = {
        status: "status",
        score: "score",
        maxScore: "max_score",
        percentage: "percentage",
        startedAt: "started_at",
        submittedAt: "submitted_at",
        gradedAt: "graded_at",
        feedback: "feedback",
        isFeedbackVisible:
          "is_feedback_visible",
        isScorePublished:
          "is_score_published",
        gradedBy: "graded_by",
      };

      const assignments = [];
      const values = [];

      for (
        const [field, value]
        of Object.entries(updates)
      ) {
        const column =
          allowedFields[field];

        if (
          !column ||
          value === undefined
        ) {
          continue;
        }

        values.push(value);

        assignments.push(
          `${column} = $${values.length}`
        );
      }

      if (assignments.length > 0) {
        values.push(id);

        const result =
          await client.query(
            `
              UPDATE exam_submissions
              SET ${assignments.join(", ")}
              WHERE id = $${values.length}
              RETURNING id
            `,
            values
          );

        if (!result.rows[0]) {
          const error =
            new Error(
              "Submission not found"
            );

          error.statusCode = 404;
          throw error;
        }
      }

      if (
        updates.answers !== undefined
      ) {
        await client.query(
          `
            DELETE FROM submission_answers
            WHERE submission_id = $1
          `,
          [id]
        );

        const answers =
          this.normalizeAnswers(
            updates.answers
          );

        for (const answer of answers) {
          await client.query(
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
                $4,
                $5,
                $6
              )
            `,
            [
              id,
              answer.questionId,
              JSON.stringify(
                answer.answer
              ),
              answer.isCorrect ?? null,
              answer.awardedPoints ?? null,
              answer.feedback || "",
            ]
          );
        }
      }

      await client.query("COMMIT");

      return this.findById(id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async publishScore(id) {
    return this.update(id, {
      isScorePublished: true,
      status: "graded",
      gradedAt:
        new Date().toISOString(),
    });
  }

  async publishFeedback(id) {
    return this.update(id, {
      isFeedbackVisible: true,
    });
  }

  async delete(id) {
    const result = await pool.query(
      `
        DELETE FROM exam_submissions
        WHERE id = $1
        RETURNING id
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  async getExamStatistics(examId) {
    const result = await pool.query(
      `
        SELECT
          COUNT(*)::INTEGER
            AS total_submissions,

          COUNT(*) FILTER (
            WHERE score IS NOT NULL
          )::INTEGER
            AS graded_submissions,

          AVG(percentage)
            AS average_percentage,

          MAX(percentage)
            AS highest_percentage,

          MIN(percentage)
            AS lowest_percentage,

          COUNT(*) FILTER (
            WHERE percentage >= e.passing_score
          )::INTEGER
            AS passed,

          COUNT(*) FILTER (
            WHERE
              percentage IS NOT NULL
              AND percentage < e.passing_score
          )::INTEGER
            AS failed,

          e.title AS exam_title,
          e.passing_score
        FROM exams e
        LEFT JOIN exam_submissions s
          ON s.exam_id = e.id
        WHERE e.id = $1
        GROUP BY
          e.id,
          e.title,
          e.passing_score
      `,
      [examId]
    );

    const row = result.rows[0];

    if (!row) return null;

    return {
      examId,
      examTitle: row.exam_title,

      totalSubmissions:
        row.total_submissions,

      gradedSubmissions:
        row.graded_submissions,

      averageScore:
        row.average_percentage === null
          ? 0
          : Number(
              Number(
                row.average_percentage
              ).toFixed(2)
            ),

      highestScore:
        row.highest_percentage === null
          ? null
          : Number(
              row.highest_percentage
            ),

      lowestScore:
        row.lowest_percentage === null
          ? null
          : Number(
              row.lowest_percentage
            ),

      passingScore:
        Number(row.passing_score),

      passed: row.passed,
      failed: row.failed,
    };
  }

  normalizeAnswers(answers) {
    if (!answers) return [];

    if (Array.isArray(answers)) {
      return answers.map((answer) => ({
        questionId:
          answer.questionId,
        answer: answer.answer,
        isCorrect:
          answer.isCorrect,
        awardedPoints:
          answer.awardedPoints,
        feedback:
          answer.feedback || "",
      }));
    }

    return Object.entries(answers).map(
      ([questionId, answer]) => ({
        questionId,
        answer,
        isCorrect: null,
        awardedPoints: null,
        feedback: "",
      })
    );
  }

  // Compatibility aliases.
  async getAll() {
    return this.findAll();
  }

  async getById(id) {
    return this.findById(id);
  }

  async getByStudent(studentId) {
    return this.findByStudent(
      studentId
    );
  }

  async add(data) {
    return this.create(data);
  }

  async remove(id) {
    return this.delete(id);
  }
}

export default new SubmissionRepository();