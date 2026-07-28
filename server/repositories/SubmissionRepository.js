import pool from "../config/database.js";
import { randomUUID } from "crypto";

function mapSubmission(row) {
  return {
    id: row.id,

    examId:
      row.exam_id,

    studentId:
      row.student_id,

    studentName:
      row.student_name,

    examTitle:
      row.exam_title,

    score:
      row.score === null
        ? null
        : Number(row.score),

    feedback:
      row.feedback || "",

    questionFeedback:
      row.question_feedback ||
      {},

    isFeedbackVisible:
      Boolean(
        row.is_feedback_visible
      ),

    isScorePublished:
      Boolean(
        row.is_score_published
      ),

    createdBy:
      row.created_by,

    teacherId:
      row.teacher_id,
  };
}

const mapSubmissionAnswerRow = (
  row
) => ({
  id: row.id,

  submissionId:
    row.submission_id,

  questionId:
    row.question_id,

  answer:
    row.answer,

  isCorrect:
    row.is_correct,

  awardedPoints:
    row.awarded_points === null
      ? null
      : Number(
          row.awarded_points
        ),

  feedback:
    row.feedback || "",

  aiAwardedPoints:
    row.ai_awarded_points === null
      ? null
      : Number(
          row.ai_awarded_points
        ),

  aiConfidence:
    row.ai_confidence === null
      ? null
      : Number(
          row.ai_confidence
        ),

  aiFeedback:
    row.ai_feedback || "",

  aiStrengths:
    Array.isArray(
      row.ai_strengths
    )
      ? row.ai_strengths
      : [],

  aiMissingConcepts:
    Array.isArray(
      row.ai_missing_concepts
    )
      ? row.ai_missing_concepts
      : [],

  aiGradingStatus:
    row.ai_grading_status ||
    null,

  aiGradedAt:
    row.ai_graded_at,

  createdAt:
    row.created_at,

  updatedAt:
    row.updated_at,
});

class SubmissionRepository {
mapAnswer(row) {
  return {
    id: String(row.id),

    submissionId: row.submission_id,
    questionId: row.question_id,

    answer: row.answer ?? "",
    isCorrect: row.is_correct,

    awardedPoints:
      row.awarded_points === null
        ? null
        : Number(row.awarded_points),

    feedback: row.feedback ?? "",

    aiAwardedPoints:
      row.ai_awarded_points === null
        ? null
        : Number(row.ai_awarded_points),

    aiConfidence:
      row.ai_confidence === null
        ? null
        : Number(row.ai_confidence),

    aiFeedback: row.ai_feedback ?? "",

    aiStrengths:
      Array.isArray(row.ai_strengths)
        ? row.ai_strengths
        : [],

    aiMissingConcepts:
      Array.isArray(row.ai_missing_concepts)
        ? row.ai_missing_concepts
        : [],

    aiGradingStatus:
      row.ai_grading_status ?? null,

    aiGradedAt:
      row.ai_graded_at ?? null,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

mapSubmission(row, rawAnswerRows = []) {
  const answerDetails =
    rawAnswerRows.map((answer) =>
      this.mapAnswer(answer)
    );

  const answers = Object.fromEntries(
    answerDetails
      .filter((answer) => answer.questionId)
      .map((answer) => [
        answer.questionId,
        answer.answer,
      ])
  );

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

    date:
      row.submitted_at ??
      row.created_at,

    feedback: row.feedback ?? "",
    isFeedbackVisible: row.is_feedback_visible,
    isScorePublished: row.is_score_published,

    gradedBy: row.graded_by,
    graderName: row.grader_name,

    answers,
    answerDetails,

    questionFeedback: {},

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
  
  async gradeWrittenAnswer(
    submissionId,
    questionId,
    {
      awardedPoints,
      feedback,
    }
  ) {
    const result =
      await pool.query(
        `
          UPDATE submission_answers
          SET
            awarded_points =
              $1::numeric,

            feedback = $2,

            is_correct =
              CASE
                WHEN $1::numeric =
                  0
                THEN FALSE
                ELSE TRUE
              END,

            updated_at =
              NOW()

          WHERE
            submission_id = $3
            AND question_id = $4

          RETURNING *
        `,
        [
          awardedPoints,
          feedback || "",
          submissionId,
          questionId,
        ]
      );

    if (!result.rows[0]) {
      const error =
        new Error(
          "Submission answer not found"
        );

      error.statusCode = 404;
      throw error;
    }

    return this
      .mapSubmissionAnswer(
        result.rows[0]
      );
  }

  mapSubmissionAnswer(row) {
    return {
      id: String(row.id),

      submissionId:
        row.submission_id,

      questionId:
        row.question_id,

      type:
        row.question_type,

      text:
        row.question_text,

      points:
        Number(
          row.question_points ??
            0
        ),

      answer:
        row.answer,

      isCorrect:
        row.is_correct,

      awardedPoints:
        row.awarded_points === null
          ? null
          : Number(
              row.awarded_points
            ),

      feedback:
        row.feedback || "",

      aiAwardedPoints:
        row.ai_awarded_points === null
          ? null
          : Number(
              row.ai_awarded_points
            ),

      aiConfidence:
        row.ai_confidence === null
          ? null
          : Number(
              row.ai_confidence
            ),

      aiFeedback:
        row.ai_feedback || "",

      aiStrengths:
        Array.isArray(
          row.ai_strengths
        )
          ? row.ai_strengths
          : [],

      aiMissingConcepts:
        Array.isArray(
          row.ai_missing_concepts
        )
          ? row.ai_missing_concepts
          : [],

      aiGradingStatus:
        row.ai_grading_status ||
        null,

      aiGradedAt:
        row.ai_graded_at,

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }

  async recalculateSubmissionScore(
    submissionId
  ) {
    const result =
      await pool.query(
        `
          WITH calculated AS (
            SELECT
              es.id,

              COALESCE(
                SUM(
                  sa.awarded_points
                ),
                0
              ) AS score,

              COALESCE(
                SUM(q.points),
                0
              ) AS max_score,

              BOOL_AND(
                sa.awarded_points
                IS NOT NULL
              ) AS all_graded

            FROM exam_submissions es

            JOIN submission_answers sa
              ON sa.submission_id =
                es.id

            JOIN questions q
              ON q.id =
                sa.question_id

            WHERE es.id = $1

            GROUP BY es.id
          )

          UPDATE exam_submissions es
          SET
            score =
              calculated.score,

            max_score =
              calculated.max_score,

            percentage =
              CASE
                WHEN
                  calculated.max_score > 0
                THEN
                  ROUND(
                    (
                      calculated.score /
                      calculated.max_score
                    ) * 100,
                    2
                  )
                ELSE 0
              END,

            status =
              CASE
                WHEN
                  calculated.all_graded
                THEN 'graded'
                ELSE 'submitted'
              END,

            graded_at =
              CASE
                WHEN
                  calculated.all_graded
                THEN NOW()
                ELSE NULL
              END,

            updated_at = NOW()

          FROM calculated

          WHERE
            es.id =
            calculated.id

          RETURNING es.*
        `,
        [submissionId]
      );

    if (!result.rows[0]) {
      const error = new Error(
        "Submission not found"
      );
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }

  async reviewAiGradingSuggestion(
    submissionId,
    questionId,
    {
      awardedPoints,
      feedback,
      aiGradingStatus,
    }
  ) {
    const result =
      await pool.query(
        `
          UPDATE submission_answers
          SET
            awarded_points = $1::numeric,
            feedback = $2,
            is_correct = CASE
              WHEN $1::numeric IS NULL
                THEN NULL
              WHEN $1::numeric = 0
                THEN FALSE
              ELSE TRUE
            END,
            ai_grading_status = $3,
            updated_at = NOW()
          WHERE
            submission_id = $4
            AND question_id = $5
          RETURNING *
        `,
        [
          awardedPoints,
          feedback || "",
          aiGradingStatus,
          submissionId,
          questionId,
        ]
      );

    if (!result.rows[0]) {
      const error = new Error(
        "Submission answer not found"
      );
      error.statusCode = 404;
      throw error;
    }

    return mapSubmissionAnswerRow(
      result.rows[0]
    );
  }

  async updateAiGradingSuggestion(
    submissionId,
    questionId,
    suggestion
  ) {
    const result =
      await pool.query(
        `
          UPDATE submission_answers
          SET
            ai_awarded_points = $1,
            ai_confidence = $2,
            ai_feedback = $3,
            ai_strengths = $4::JSONB,
            ai_missing_concepts = $5::JSONB,
            ai_grading_status = $6,
            ai_graded_at = NOW(),
            updated_at = NOW()
          WHERE
            submission_id = $7
            AND question_id = $8
          RETURNING *
        `,
        [
          suggestion.awardedPoints ??
            null,

          suggestion.confidence ??
            null,

          suggestion.feedback || "",

          JSON.stringify(
            suggestion.strengths || []
          ),

          JSON.stringify(
            suggestion.missingConcepts || []
          ),

          suggestion.status ||
            "ai-suggestion-ready",

          submissionId,
          questionId,
        ]
      );

    if (!result.rows[0]) {
      const error = new Error(
        "Submission answer not found"
      );

      error.statusCode = 404;
      throw error;
    }

    return mapSubmissionAnswerRow(
      result.rows[0]
    );
  }

  async updateGrade(
    submissionId,
    updates
  ) {
    const client =
      await pool.connect();

    try {
      await client.query("BEGIN");

      const submissionResult =
        await client.query(
          `
            UPDATE exam_submissions
            SET
              status = 'graded',
              score = $1,
              percentage = $2,
              feedback = $3,
              is_feedback_visible = $4,
              is_score_published = $5,
              graded_by = $6,
              graded_at = NOW()
            WHERE id = $7
            RETURNING id
          `,
          [
            updates.score,
            updates.percentage,
            updates.feedback || "",
            Boolean(
              updates.isFeedbackVisible
            ),
            Boolean(
              updates.isScorePublished
            ),
            updates.gradedBy,
            submissionId,
          ]
        );

      if (!submissionResult.rows[0]) {
        const error =
          new Error(
            "Submission not found"
          );

        error.statusCode = 404;
        throw error;
      }

      const answers = Array.isArray(updates.answers)
        ? updates.answers
        : [];

      for (const answer of answers) {
        const answerResult = await client.query(
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
            ON CONFLICT (
              submission_id,
              question_id
            )
            DO UPDATE SET
              answer = COALESCE(
                submission_answers.answer,
                EXCLUDED.answer
              ),
              is_correct = COALESCE(
                EXCLUDED.is_correct,
                submission_answers.is_correct
              ),
              awarded_points =
                EXCLUDED.awarded_points,
              feedback =
                EXCLUDED.feedback
            RETURNING
              question_id,
              awarded_points,
              feedback
          `,
          [
            submissionId,
            answer.questionId,
            JSON.stringify(
              answer.answer ?? null
            ),
            answer.isCorrect ?? null,
            Number(
              answer.awardedPoints ?? 0
            ),
            answer.feedback || "",
          ]
        );

        if (!answerResult.rows[0]) {
          throw new Error(
            `Failed to save grade for question ${answer.questionId}`
          );
        }
      }

      await client.query("COMMIT");

      return this
        .findById(submissionId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getAnswers(submissionId) {
    const result = await pool.query(
      `
        SELECT
          sa.*,

          q.type AS question_type,
          q.question_text,
          q.points AS question_points

        FROM submission_answers sa

        JOIN questions q
          ON q.id = sa.question_id

        WHERE sa.submission_id = $1

        ORDER BY q.position ASC
      `,
      [submissionId]
    );

    return result.rows.map(
      (row) =>
        this.mapSubmissionAnswer(
          row
        )
    );
  }

  async findById(id) {
    const submissionResult =
      await pool.query(
        `
          SELECT
            es.id,
            es.exam_id,
            es.student_id,
            es.status,
            es.score,
            es.max_score,
            es.percentage,
            es.started_at,
            es.submitted_at,
            es.graded_at,
            es.feedback,
            es.is_feedback_visible,
            es.is_score_published,
            es.graded_by,
            es.created_at,
            es.updated_at,

            e.title AS exam_title,
            e.created_by AS teacher_id,

            u.full_name AS student_name,
            u.email AS student_email

          FROM exam_submissions es

          JOIN exams e
            ON e.id = es.exam_id

          JOIN users u
            ON u.id = es.student_id

          WHERE es.id = $1

          LIMIT 1
        `,
        [id]
      );

    const row =
      submissionResult.rows[0];

    if (!row) {
      return null;
    }

    const answersResult =
      await pool.query(
        `
          SELECT
            sa.id,
            sa.submission_id,
            sa.question_id,
            sa.answer,
            sa.is_correct,
            sa.awarded_points,
            sa.feedback,

            sa.ai_awarded_points,
            sa.ai_confidence,
            sa.ai_feedback,
            sa.ai_strengths,
            sa.ai_missing_concepts,
            sa.ai_grading_status,
            sa.ai_graded_at,

            sa.created_at,
            sa.updated_at
          FROM submission_answers sa
          WHERE sa.submission_id = $1
          ORDER BY sa.id ASC
        `,
        [id]
      );

    const answers = {};

    const questionFeedback = {};

    for (const answerRow of answersResult.rows) {
      answers[answerRow.question_id] =
        answerRow.answer;

      questionFeedback[
        answerRow.question_id
      ] =
        answerRow.feedback || "";
    }

    return {
      id: row.id,

      examId: row.exam_id,
      examTitle: row.exam_title,

      studentId: row.student_id,
      studentName: row.student_name,
      studentEmail: row.student_email,

      teacherId: row.teacher_id,
      createdBy: row.teacher_id,

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

      date:
        row.submitted_at ||
        row.created_at,

      feedback:
        row.feedback || "",

      isFeedbackVisible:
        Boolean(
          row.is_feedback_visible
        ),

      isScorePublished:
        Boolean(
          row.is_score_published
        ),

      gradedBy:
        row.graded_by,

      answers,
      questionFeedback,

      createdAt: row.created_at,
      updatedAt: row.updated_at,
      answerDetails:
        answersResult.rows.map(
          mapSubmissionAnswerRow
        ),
    };
  }
async getAnswersForSubmissions(submissionIds) {
  if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
    return new Map();
  }

  const result = await pool.query(
    `
      SELECT *
      FROM submission_answers
      WHERE submission_id = ANY($1::text[])
      ORDER BY submission_id, id
    `,
    [submissionIds]
  );

  const answersBySubmission = new Map();

  for (const answer of result.rows) {
    const currentAnswers =
      answersBySubmission.get(answer.submission_id) ?? [];

    currentAnswers.push(answer);

    answersBySubmission.set(
      answer.submission_id,
      currentAnswers
    );
  }

  return answersBySubmission;
}
async findAll() {
  console.log("SubmissionRepository.findAll called");
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

  const submissionIds = result.rows.map(
    (row) => row.id
  );

  const answersBySubmission =
    await this.getAnswersForSubmissions(submissionIds);

  return result.rows.map((row) =>
    this.mapSubmission(
      row,
      answersBySubmission.get(row.id) ?? []
    )
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

  const submissionIds = result.rows.map(
    (row) => row.id
  );

  const answersBySubmission =
    await this.getAnswersForSubmissions(submissionIds);

  return result.rows.map((row) =>
    this.mapSubmission(
      row,
      answersBySubmission.get(row.id) ?? []
    )
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

  const submissionIds = result.rows.map(
    (row) => row.id
  );

  const answersBySubmission =
    await this.getAnswersForSubmissions(submissionIds);

  return result.rows.map((row) =>
    this.mapSubmission(
      row,
      answersBySubmission.get(row.id) ?? []
    )
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
    const client =
      await pool.connect();

    const submissionId =
      data.id || randomUUID();

    try {
      await client.query("BEGIN");

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
              feedback,
              is_feedback_visible,
              is_score_published,
              graded_by
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              $13
            )
            RETURNING id
          `,
          [
            submissionId,
            data.examId,
            data.studentId,
            data.status ||
              "submitted",

            data.score ?? null,

            data.maxScore ??
              data.totalPoints ??
              null,

            data.percentage ??
              data.score ??
              null,

            data.startedAt ||
              null,

            data.submittedAt ||
              data.date ||
              new Date(),

            data.feedback || "",

            Boolean(
              data.isFeedbackVisible
            ),

            Boolean(
              data.isScorePublished
            ),

            data.gradedBy ||
              null,
          ]
        );

      const answers =
        Array.isArray(data.answers)
          ? data.answers
          : Object.entries(
              data.answers || {}
            ).map(
              ([questionId, answer]) => ({
                questionId,
                answer,
                isCorrect: null,
                awardedPoints: null,
                feedback: "",
              })
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
              answer.answer ?? null
            ),
            answer.isCorrect,
            answer.awardedPoints,
            answer.feedback || "",
          ]
        );
      }

      await client.query("COMMIT");

      return this
        .findById(
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

  async updateFeedback(
    submissionId,
    updates
  ) {
    const client =
      await pool.connect();

    try {
      await client.query("BEGIN");

      const result =
        await client.query(
          `
            UPDATE exam_submissions
            SET
              feedback = $1,
              is_feedback_visible = $2,
              is_score_published = $2,
              graded_by = $3,
              status = 'graded',
              graded_at = COALESCE(
                graded_at,
                NOW()
              )
            WHERE id = $4
            RETURNING id
          `,
          [
            updates.feedback || "",
            Boolean(
              updates.isFeedbackVisible
            ),
            updates.gradedBy || null,
            submissionId,
          ]
        );

      if (!result.rows[0]) {
        const error =
          new Error(
            "Submission not found"
          );
        error.statusCode = 404;
        throw error;
      }

      const questionFeedback =
        updates.questionFeedback &&
        typeof updates.questionFeedback ===
          "object"
          ? updates.questionFeedback
          : {};

      for (
        const [
          questionId,
          feedback,
        ] of Object.entries(
          questionFeedback
        )
      ) {
        await client.query(
          `
            UPDATE submission_answers
            SET feedback = $1
            WHERE
              submission_id = $2
              AND question_id = $3
          `,
          [
            feedback || "",
            submissionId,
            questionId,
          ]
        );
      }

      await client.query("COMMIT");

      return this.findById(
        submissionId
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async publishScore(id) {
    return SubmissionRepository.update(id, {
      isScorePublished: true,
      status: "graded",
      gradedAt:
        new Date().toISOString(),
    });
  }

  async publishFeedback(id) {
    return SubmissionRepository.update(id, {
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

  async findByStudentAndExam(
    studentId,
    examId
  ) {
    const result =
      await pool.query(
        `
          SELECT id
          FROM exam_submissions
          WHERE
            student_id = $1
            AND exam_id = $2
          LIMIT 1
        `,
        [
          studentId,
          examId,
        ]
      );

    return result.rows[0] || null;
  }

  async add(data) {
    return this.create(data);
  }

  async remove(id) {
    return this.delete(id);
  }
}

export default new SubmissionRepository();