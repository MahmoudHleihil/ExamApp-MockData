import pg from "pg";

import {
  config,
} from "./config.js";

const {
  Pool,
} = pg;

function getRequiredEnvironmentValue(
  name
) {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `${name} is required`
    );
  }

  return value;
}

let pool = null;

function getPool() {
  if (pool) {
    return pool;
  }

  pool =
    new Pool({
      connectionString:
        config.databaseUrl,

      max:
        Number(
          process.env
            .DATABASE_POOL_SIZE ||
            5
        ),

      connectionTimeoutMillis:
        10_000,

      idleTimeoutMillis:
        30_000,
    });

  return pool;
}

export async function verifyDatabase() {
  const result =
    await getPool().query(`
      SELECT
        current_database()
          AS database,
        current_user
          AS user
    `);

  return result.rows[0];
}

export async function findAnswer(
  submissionId,
  questionId
) {
  const result =
    await getPool().query(
      `
        SELECT
          submission_id,
          question_id,
          ai_grading_status,
          ai_graded_at
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

  return (
    result.rows[0] ||
    null
  );
}

export async function saveAiSuggestion(
  submissionId,
  questionId,
  suggestion
) {
  const result =
    await getPool().query(
      `
        UPDATE submission_answers
        SET
          ai_awarded_points =
            $1::numeric,

          ai_confidence =
            $2::numeric,

          ai_feedback =
            $3,

          ai_strengths =
            $4::jsonb,

          ai_missing_concepts =
            $5::jsonb,

          ai_grading_status =
            $6,

          ai_graded_at =
            NOW(),

          updated_at =
            NOW()

        WHERE
          submission_id = $7
          AND question_id = $8

        RETURNING
          submission_id,
          question_id,
          ai_awarded_points,
          ai_confidence,
          ai_grading_status,
          ai_graded_at
      `,
      [
        suggestion
          .awardedPoints ??
          null,

        suggestion
          .confidence ??
          null,

        suggestion.feedback ||
          "",

        JSON.stringify(
          suggestion.strengths ||
          []
        ),

        JSON.stringify(
          suggestion
            .missingConcepts ||
          []
        ),

        suggestion.status,

        submissionId,
        questionId,
      ]
    );

  if (!result.rows[0]) {
    const error =
      new Error(
        "Submission answer not found"
      );

    error.code =
      "ANSWER_NOT_FOUND";

    throw error;
  }

  return result.rows[0];
}

export async function saveAiFailure(
  submissionId,
  questionId,
  message
) {
  return saveAiSuggestion(
    submissionId,
    questionId,
    {
      awardedPoints:
        null,

      confidence:
        null,

      feedback:
        message,

      strengths: [],
      missingConcepts: [],

      status:
        "ai-grading-failed",
    }
  );
}

export async function closeDatabase() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}