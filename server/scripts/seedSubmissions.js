import "dotenv/config";

import pool, {
  closeDatabase,
} from "../config/database.js";

async function seedSubmissions() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const studentResult =
      await client.query(
        `
          SELECT id
          FROM users
          WHERE email = $1
          LIMIT 1
        `,
        ["student@etest.com"]
      );

    const student =
      studentResult.rows[0];

    if (!student) {
      throw new Error(
        "Student user not found"
      );
    }

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
          submitted_at,
          graded_at,
          feedback,
          is_feedback_visible,
          is_score_published
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12
        )
        ON CONFLICT (id)
        DO UPDATE SET
          score =
            EXCLUDED.score,
          max_score =
            EXCLUDED.max_score,
          percentage =
            EXCLUDED.percentage,
          feedback =
            EXCLUDED.feedback,
          is_feedback_visible =
            EXCLUDED.is_feedback_visible,
          is_score_published =
            EXCLUDED.is_score_published
      `,
      [
        "s1",
        "1",
        student.id,
        "graded",
        85,
        100,
        85,
        "2026-06-01T11:00:00.000Z",
        "2026-06-01T11:10:00.000Z",
        "Great job on the fundamentals!",
        true,
        true,
      ]
    );

    await client.query(
      `
        DELETE FROM submission_answers
        WHERE submission_id = $1
      `,
      ["s1"]
    );

    const answers = [
      {
        questionId: "q1",
        answer:
          "A syntax extension for JavaScript",
        isCorrect: true,
        awardedPoints: 50,
        feedback: "Perfect!",
      },
      {
        questionId: "q2",
        answer: "useEffect",
        isCorrect: true,
        awardedPoints: 35,
        feedback:
          "Correct answer.",
      },
    ];

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
          "s1",
          answer.questionId,
          JSON.stringify(
            answer.answer
          ),
          answer.isCorrect,
          answer.awardedPoints,
          answer.feedback,
        ]
      );
    }

    await client.query("COMMIT");

    console.log(
      "Submissions seeded successfully"
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Submission seeding failed:",
      {
        message: error.message,
        code: error.code,
        detail: error.detail,
      }
    );

    process.exitCode = 1;
  } finally {
    client.release();
  }
}

try {
  await seedSubmissions();
} finally {
  await closeDatabase();
}