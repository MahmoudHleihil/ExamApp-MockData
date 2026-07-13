import "dotenv/config";

import pool, {
  closeDatabase,
} from "../config/database.js";

const exams = [
  {
    id: "1",
    title: "React Fundamentals",
    description:
      "Basic React concepts and hooks.",
    subject: "React",
    difficulty: "medium",
    published: true,
    releaseScoresImmediately: true,
    timeLimit: 30,
    earlyAccessMinutes: 30,
    isAlwaysAvailable: false,
    scheduledDate:
      "2026-06-01T10:00:00.000Z",
    passingScore: 60,

    questions: [
      {
        id: "q1",
        type: "multiple-choice",
        text: "What is JSX?",
        options: [
          "A CSS framework",
          "A syntax extension for JavaScript",
          "A database type",
          "A server-side language",
        ],
        correctAnswer:
          "A syntax extension for JavaScript",
        points: 50,
      },
      {
        id: "q2",
        type: "multiple-choice",
        text:
          "Which hook is used for side effects?",
        options: [
          "useState",
          "useMemo",
          "useEffect",
          "useContext",
        ],
        correctAnswer: "useEffect",
        points: 50,
      },
    ],
  },

  {
    id: "demo",
    title: "Full-Stack Web Mastery",
    description:
      "Full-stack development fundamentals.",
    subject: "Full Stack",
    difficulty: "medium",
    published: true,
    releaseScoresImmediately: false,
    timeLimit: 60,
    earlyAccessMinutes: 15,
    isAlwaysAvailable: true,
    scheduledDate:
      "2026-05-30T10:00:00.000Z",
    passingScore: 70,

    questions: [
      {
        id: "d1",
        type: "multiple-choice",
        text:
          "Which of the following is NOT a JavaScript framework?",
        options: [
          "React",
          "Angular",
          "Vue",
          "Django",
        ],
        correctAnswer: "Django",
        points: 25,
      },
      {
        id: "d2",
        type: "true-false",
        text:
          "JavaScript is a statically typed language.",
        options: ["True", "False"],
        correctAnswer: "False",
        points: 25,
      },
      {
        id: "d3",
        type: "multiple-response",
        text:
          "Which of these are HTTP methods?",
        options: [
          "GET",
          "POST",
          "PUSH",
          "DELETE",
        ],
        correctAnswer: [
          "GET",
          "POST",
          "DELETE",
        ],
        points: 25,
      },
      {
        id: "d4",
        type: "written",
        text:
          "What does CSS stand for?",
        options: [],
        correctAnswer:
          "Cascading Style Sheets",
        points: 25,
      },
    ],
  },
];

async function seedExams() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const teacherResult =
      await client.query(
        `
          SELECT id
          FROM users
          WHERE email = $1
          LIMIT 1
        `,
        ["teacher@etest.com"]
      );

    const teacher =
      teacherResult.rows[0];

    if (!teacher) {
      throw new Error(
        "Teacher user was not found. Run npm run db:seed first."
      );
    }

    for (const exam of exams) {
      await client.query(
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
            scheduled_date,
            passing_score
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13
          )
          ON CONFLICT (id)
          DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            subject = EXCLUDED.subject,
            difficulty = EXCLUDED.difficulty,
            created_by = EXCLUDED.created_by,
            published = EXCLUDED.published,
            release_scores_immediately =
              EXCLUDED.release_scores_immediately,
            time_limit = EXCLUDED.time_limit,
            early_access_minutes =
              EXCLUDED.early_access_minutes,
            is_always_available =
              EXCLUDED.is_always_available,
            scheduled_date =
              EXCLUDED.scheduled_date,
            passing_score =
              EXCLUDED.passing_score
        `,
        [
          exam.id,
          exam.title,
          exam.description,
          exam.subject,
          exam.difficulty,
          teacher.id,
          exam.published,
          exam.releaseScoresImmediately,
          exam.timeLimit,
          exam.earlyAccessMinutes,
          exam.isAlwaysAvailable,
          exam.scheduledDate,
          exam.passingScore,
        ]
      );

      await client.query(
        `
          DELETE FROM questions
          WHERE exam_id = $1
        `,
        [exam.id]
      );

      for (
        let index = 0;
        index < exam.questions.length;
        index += 1
      ) {
        const question =
          exam.questions[index];

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
              points
            )
            VALUES (
              $1, $2, $3, $4,
              $5, $6::JSONB,
              $7::JSONB, $8
            )
          `,
          [
            question.id,
            exam.id,
            index,
            question.type,
            question.text,

            JSON.stringify(
              question.options
            ),

            JSON.stringify(
              question.correctAnswer
            ),

            question.points,
          ]
        );
      }
    }

    await client.query("COMMIT");

    console.log(
      "Exams seeded successfully"
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Exam seeding failed:",
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
  await seedExams();
} finally {
  await closeDatabase();
}