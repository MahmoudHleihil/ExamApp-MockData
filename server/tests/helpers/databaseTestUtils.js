import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

import pool from "../../config/database.js";

const TEST_PASSWORD_HASH =
  "$2a$10$TtVDG/.tdNP/vIEScg0pBeDwg3ujMCCp2kdmeLurR/YpOeiGEgKwu";

export async function createTestTeacher() {
  const email =
    `teacher-${randomUUID()}@etest.com`;

  const result = await pool.query(
    `
      INSERT INTO users (
        email,
        password_hash,
        role,
        full_name,
        status,
        is_super_admin
      )
      VALUES (
        $1,
        $2,
        'Teacher',
        'Integration Test Teacher',
        'active',
        FALSE
      )
      RETURNING
        id,
        email,
        role,
        full_name
    `,
    [email, TEST_PASSWORD_HASH]
  );

  const row = result.rows[0];

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
  };
}

export async function createTestExam(
  teacherId,
  overrides = {}
) {
  const examId =
    overrides.id || randomUUID();

  const result = await pool.query(
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
        time_limit,
        early_access_minutes,
        is_always_available,
        passing_score
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        FALSE,
        30,
        0,
        FALSE,
        60
      )
      RETURNING *
    `,
    [
      examId,
      overrides.title ||
        `Test Exam ${examId}`,
      overrides.description || "",
      overrides.subject || "Testing",
      overrides.difficulty || "medium",
      teacherId,
      overrides.published ?? false,
    ]
  );

  return result.rows[0];
}

export async function createTestDocument(
  teacher,
  overrides = {}
) {
  const uploadsDirectory =
    path.resolve(
      process.cwd(),
      "uploads",
      "test"
    );

  await fs.mkdir(uploadsDirectory, {
    recursive: true,
  });

  const storedFilename =
    `${randomUUID()}.pdf`;

  const storagePath = path.join(
    uploadsDirectory,
    storedFilename
  );

  await fs.writeFile(
    storagePath,
    Buffer.from(
      "%PDF-1.4 integration test file"
    )
  );

  const result = await pool.query(
    `
      INSERT INTO documents (
        title,
        original_filename,
        stored_filename,
        storage_path,
        mime_type,
        uploaded_by,
        uploaded_by_role,
        visibility,
        file_size_bytes,
        processing_status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'application/pdf',
        $5,
        $6,
        'private',
        $7,
        'ready'
      )
      RETURNING *
    `,
    [
      overrides.title ||
        "Integration Test Material.pdf",

      overrides.originalFilename ||
        "Integration Test Material.pdf",

      storedFilename,
      storagePath,
      teacher.id,
      teacher.role,
      32,
    ]
  );

  return result.rows[0];
}

export async function getLatestConfirmation(
  userId,
  toolName
) {
  const result = await pool.query(
    `
      SELECT *
      FROM mcp_confirmations
      WHERE
        user_id = $1
        AND tool_name = $2
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId, toolName]
  );

  return result.rows[0] || null;
}

export async function getLatestAudit(
  userId,
  toolName
) {
  const result = await pool.query(
    `
      SELECT *
      FROM mcp_audit_logs
      WHERE
        user_id = $1
        AND tool_name = $2
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId, toolName]
  );

  return result.rows[0] || null;
}

export async function examExists(examId) {
  const result = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM exams
        WHERE id = $1
      ) AS exists
    `,
    [examId]
  );

  return result.rows[0].exists;
}

export async function documentExists(
  documentId
) {
  const result = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM documents
        WHERE id = $1
      ) AS exists
    `,
    [documentId]
  );

  return result.rows[0].exists;
}

export async function cleanupTestUser(
  userId
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    /*
     * Remove submissions graded by this user without
     * deleting submissions belonging to other users.
     */
    await client.query(
      `
        UPDATE exam_submissions
        SET graded_by = NULL
        WHERE graded_by = $1
      `,
      [userId]
    );

    /*
     * Remove submissions owned by the test student.
     * submission_answers are deleted by cascade.
     */
    await client.query(
      `
        DELETE FROM exam_submissions
        WHERE student_id = $1
      `,
      [userId]
    );

    await client.query(
      `
        DELETE FROM mcp_confirmations
        WHERE user_id = $1
      `,
      [userId]
    );

    await client.query(
      `
        DELETE FROM mcp_audit_logs
        WHERE user_id = $1
      `,
      [userId]
    );

    await client.query(
      `
        DELETE FROM conversations
        WHERE user_id = $1
      `,
      [userId]
    );

    await client.query(
      `
        DELETE FROM notifications
        WHERE user_id = $1
      `,
      [userId]
    );

    await client.query(
      `
        DELETE FROM documents
        WHERE uploaded_by = $1
      `,
      [userId]
    );

    /*
     * Questions and submissions for these exams are
     * removed through ON DELETE CASCADE.
     */
    await client.query(
      `
        DELETE FROM exams
        WHERE created_by = $1
      `,
      [userId]
    );

    await client.query(
      `
        DELETE FROM users
        WHERE id = $1
      `,
      [userId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createTestStudent() {
  const email =
    `student-${randomUUID()}@etest.com`;

  const result = await pool.query(
    `
      INSERT INTO users (
        email,
        password_hash,
        role,
        full_name,
        status,
        is_super_admin
      )
      VALUES (
        $1,
        $2,
        'Student',
        'Integration Test Student',
        'active',
        FALSE
      )
      RETURNING
        id,
        email,
        role,
        full_name
    `,
    [
      email,
      TEST_PASSWORD_HASH,
    ]
  );

  const row = result.rows[0];

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
  };
}

export async function createTestAdmin() {
  const email =
    `admin-${randomUUID()}@etest.com`;

  const result = await pool.query(
    `
      INSERT INTO users (
        email,
        password_hash,
        role,
        full_name,
        status,
        is_super_admin
      )
      VALUES (
        $1,
        $2,
        'Admin',
        'Integration Test Admin',
        'active',
        TRUE
      )
      RETURNING
        id,
        email,
        role,
        full_name
    `,
    [
      email,
      TEST_PASSWORD_HASH,
    ]
  );

  const row = result.rows[0];

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    fullName: row.full_name,
    isSuperAdmin: true,
  };
}

export async function createTestSubmission({
  examId,
  studentId,
  score = 80,
  maxScore = 100,
  percentage = 80,
  status = "graded",
  isScorePublished = false,
  isFeedbackVisible = false,
  feedback = "",
  gradedBy = null,
}) {
  const submissionId =
    randomUUID();

  const gradedAt = status === "graded" ? new Date() : null;

  const result = await pool.query(
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
        graded_at,
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
        NOW(),
        $8,
        $9,
        $10,
        $11,
        $12
      )
      RETURNING *
    `,
    [
      submissionId,
      examId,
      studentId,
      status,
      score,
      maxScore,
      percentage,
      gradedAt,
      feedback,
      isFeedbackVisible,
      isScorePublished,
      gradedBy,
    ]
  );

  return result.rows[0];
}