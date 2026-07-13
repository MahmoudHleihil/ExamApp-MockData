import pool from "../config/database.js";
import { randomUUID } from "crypto";

class ExamRepository {
  mapQuestion(row) {
    if (!row) return null;

    return {
      id: row.id,
      examId: row.exam_id,
      type: row.type,

      // Keep both names temporarily for frontend compatibility.
      text: row.question_text,
      question: row.question_text,

      options: Array.isArray(row.options)
        ? row.options
        : [],

      correctAnswer: row.correct_answer,
      points: Number(row.points),
      sourceEvidence: row.source_evidence,
      position: row.position,

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  mapExam(row, questions = []) {
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      description: row.description || "",
      subject: row.subject,
      difficulty: row.difficulty,

      createdBy: row.created_by,
      teacherId: row.created_by,
      teacherEmail: row.teacher_email,
      teacherName: row.teacher_name,

      published: row.published,
      isPublished: row.published,

      releaseScoresImmediately:
        row.release_scores_immediately,

      passwordHash: row.password_hash,

      timeLimit: row.time_limit,
      earlyAccessMinutes:
        row.early_access_minutes,

      isAlwaysAvailable:
        row.is_always_available,

      scheduledDate: row.scheduled_date,
      passingScore: Number(row.passing_score),

      sourceDocumentId:
        row.source_document_id,

      sourceDocumentTitle:
        row.source_document_title,

      createdAt: row.created_at,
      updatedAt: row.updated_at,

      questions,
    };
  }

  async getQuestionsForExam(
    examId,
    client = pool
  ) {
    const result = await client.query(
      `
        SELECT
          id,
          exam_id,
          position,
          type,
          question_text,
          options,
          correct_answer,
          points,
          source_evidence,
          created_at,
          updated_at
        FROM questions
        WHERE exam_id = $1
        ORDER BY position ASC
      `,
      [examId]
    );

    return result.rows.map((row) =>
      this.mapQuestion(row)
    );
  }

  async findAll() {
    const result = await pool.query(`
      SELECT
        e.*,
        u.email AS teacher_email,
        u.full_name AS teacher_name
      FROM exams e
      JOIN users u
        ON u.id = e.created_by
      ORDER BY e.created_at DESC
    `);

    return Promise.all(
      result.rows.map(async (row) => {
        const questions =
          await this.getQuestionsForExam(row.id);

        return this.mapExam(row, questions);
      })
    );
  }

  async findById(id) {
    const result = await pool.query(
      `
        SELECT
          e.*,
          u.email AS teacher_email,
          u.full_name AS teacher_name
        FROM exams e
        JOIN users u
          ON u.id = e.created_by
        WHERE e.id = $1
        LIMIT 1
      `,
      [id]
    );

    const row = result.rows[0];

    if (!row) return null;

    const questions =
      await this.getQuestionsForExam(id);

    return this.mapExam(row, questions);
  }

  async findByCreator(userId) {
    const result = await pool.query(
      `
        SELECT
          e.*,
          u.email AS teacher_email,
          u.full_name AS teacher_name
        FROM exams e
        JOIN users u
          ON u.id = e.created_by
        WHERE e.created_by = $1
        ORDER BY e.created_at DESC
      `,
      [userId]
    );

    return Promise.all(
      result.rows.map(async (row) => {
        const questions =
          await this.getQuestionsForExam(row.id);

        return this.mapExam(row, questions);
      })
    );
  }

  async findPublished() {
    const result = await pool.query(`
      SELECT
        e.*,
        u.email AS teacher_email,
        u.full_name AS teacher_name
      FROM exams e
      JOIN users u
        ON u.id = e.created_by
      WHERE e.published = TRUE
      ORDER BY
        e.scheduled_date ASC NULLS LAST,
        e.created_at DESC
    `);

    return Promise.all(
      result.rows.map(async (row) => {
        const questions =
          await this.getQuestionsForExam(row.id);

        return this.mapExam(row, questions);
      })
    );
  }

  async create(data) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const examId =
        data.id || randomUUID();

      const examResult = await client.query(
        `
          INSERT INTO exams (
            id,
            title,
            description,
            subject,
            difficulty,
            created_by,
            published,
            release_scores_immediately,
            password_hash,
            time_limit,
            early_access_minutes,
            is_always_available,
            scheduled_date,
            passing_score,
            source_document_id,
            source_document_title
          )
          VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11, $12,
            $13, $14, $15, $16
          )
          RETURNING *
        `,
        [
          examId,
          data.title,
          data.description || "",
          data.subject || null,
          data.difficulty || "medium",
          data.createdBy,
          data.published ??
            data.isPublished ??
            false,
          data.releaseScoresImmediately ??
            false,
          data.passwordHash || null,
          data.timeLimit || null,
          data.earlyAccessMinutes || 0,
          data.isAlwaysAvailable || false,
          data.scheduledDate || null,
          data.passingScore ?? 60,
          data.sourceDocumentId || null,
          data.sourceDocumentTitle || null,
        ]
      );

      const questions =
        Array.isArray(data.questions)
          ? data.questions
          : [];

      for (
        let index = 0;
        index < questions.length;
        index += 1
      ) {
        const question = questions[index];

        await client.query(
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
              $1, $2, $3, $4, $5,
              $6::JSONB,
              $7::JSONB,
              $8, $9
            )
          `,
          [
            randomUUID(),

            examId,
            index,

            question.type,

            question.question ||
              question.text,

            JSON.stringify(
              question.options || []
            ),

            JSON.stringify(
              question.correctAnswer
            ),

            question.points || 1,
            question.sourceEvidence || null,
          ]
        );
      }

      await client.query("COMMIT");

      return this.findById(
        examResult.rows[0].id
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

    const existingResult = await client.query(
      `
        SELECT id
        FROM exams
        WHERE id = $1
        FOR UPDATE
      `,
      [id]
    );

    if (!existingResult.rows[0]) {
      const error = new Error("Exam not found");
      error.statusCode = 404;
      throw error;
    }

    const normalizedUpdates = {
      ...updates,
    };

    if (
      normalizedUpdates.published === undefined &&
      normalizedUpdates.isPublished !== undefined
    ) {
      normalizedUpdates.published =
        normalizedUpdates.isPublished;
    }

    delete normalizedUpdates.isPublished;

    const allowedFields = {
      title: "title",
      description: "description",
      subject: "subject",
      difficulty: "difficulty",
      published: "published",

      releaseScoresImmediately:
        "release_scores_immediately",

      passwordHash: "password_hash",
      timeLimit: "time_limit",

      earlyAccessMinutes:
        "early_access_minutes",

      isAlwaysAvailable:
        "is_always_available",

      scheduledDate: "scheduled_date",
      passingScore: "passing_score",

      sourceDocumentId:
        "source_document_id",

      sourceDocumentTitle:
        "source_document_title",
    };

    const assignments = [];
    const values = [];
    const assignedColumns = new Set();

    for (const [field, value] of Object.entries(
      normalizedUpdates
    )) {
      const column = allowedFields[field];

      if (!column || value === undefined) {
        continue;
      }

      if (assignedColumns.has(column)) {
        continue;
      }

      assignedColumns.add(column);
      values.push(value);

      assignments.push(
        `${column} = $${values.length}`
      );
    }

    if (assignments.length > 0) {
      values.push(id);

      const updateResult = await client.query(
        `
          UPDATE exams
          SET ${assignments.join(", ")}
          WHERE id = $${values.length}
          RETURNING id
        `,
        values
      );

      if (updateResult.rowCount === 0) {
        const error = new Error("Exam not found");
        error.statusCode = 404;
        throw error;
      }
    }

    if (Array.isArray(normalizedUpdates.questions)) {
      await client.query(
        `
          DELETE FROM questions
          WHERE exam_id = $1
        `,
        [id]
      );

      for (
        let index = 0;
        index < normalizedUpdates.questions.length;
        index += 1
      ) {
        const question =
          normalizedUpdates.questions[index];

        const questionText =
          question.question ||
          question.text;

        if (!questionText?.trim()) {
          const error = new Error(
            `Question ${index + 1} is missing text`
          );

          error.statusCode = 400;
          throw error;
        }

        await client.query(
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
              $1, $2, $3, $4, $5,
              $6::JSONB,
              $7::JSONB,
              $8, $9
            )
          `,
          [
            randomUUID(),
            id,
            index,
            question.type,
            questionText,
            JSON.stringify(
              question.options || []
            ),
            JSON.stringify(
              question.correctAnswer
            ),
            question.points ?? 1,
            question.sourceEvidence || null,
          ]
        );
      }
    }

    await client.query("COMMIT");

    return await this.findById(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

  async delete(id) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existing =
        await client.query(
          `
            SELECT id, title
            FROM exams
            WHERE id = $1
            LIMIT 1
          `,
          [id]
        );

      if (!existing.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }

      await client.query(
        `
          DELETE FROM exams
          WHERE id = $1
        `,
        [id]
      );

      await client.query("COMMIT");

      return {
        id: existing.rows[0].id,
        title: existing.rows[0].title,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async exists(id) {
    const result = await pool.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM exams
          WHERE id = $1
        ) AS exists
      `,
      [id]
    );

    return result.rows[0].exists;
  }

  async count() {
    const result = await pool.query(`
      SELECT COUNT(*)::INTEGER AS count
      FROM exams
    `);

    return result.rows[0].count;
  }

  async countPublished() {
    const result = await pool.query(`
      SELECT COUNT(*)::INTEGER AS count
      FROM exams
      WHERE published = TRUE
    `);

    return result.rows[0].count;
  }
}

export default new ExamRepository();