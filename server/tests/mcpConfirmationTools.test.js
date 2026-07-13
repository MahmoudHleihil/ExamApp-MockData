import "./bootstrap.js";

import test, {
  after,
} from "node:test";

import assert from "node:assert/strict";

// Register only the MCP tools used by this test file.
await import("../mcp/tools/teacher/deleteExam.js");
await import("../mcp/tools/teacher/publishExam.js");
await import(
  "../mcp/tools/document/deleteCourseMaterial.js"
);

const { default: MCPServer } =
  await import("../mcp/server.js");

const { default: pool } =
  await import("../config/database.js");

const {
  createTestTeacher,
  createTestExam,
  createTestDocument,
  getLatestConfirmation,
  getLatestAudit,
  examExists,
  documentExists,
  cleanupTestUser,
} = await import(
  "./helpers/databaseTestUtils.js"
);

function createContext(user) {
  return {
    user,
    requestId:
      `test-${Date.now()}`,
  };
}

test(
  "delete_exam requires confirmation and deletes only after confirmation",
  async () => {
    const teacher =
      await createTestTeacher();

    try {
      const exam =
        await createTestExam(
          teacher.id,
          {
            title:
              "Exam To Delete",
          }
        );

      const context =
        createContext(teacher);

      const firstResult =
        await MCPServer.execute(
          "delete_exam",
          {
            examId: exam.id,
          },
          context
        );

      assert.equal(
        firstResult.requiresConfirmation,
        true
      );

      assert.equal(
        firstResult.action.examId,
        exam.id
      );

      assert.match(
        firstResult.confirmationId,
        /^[0-9a-f-]{36}$/i
      );

      assert.equal(
        await examExists(exam.id),
        true,
        "Exam must still exist before confirmation"
      );

      const confirmation =
        await getLatestConfirmation(
          teacher.id,
          "delete_exam"
        );

      assert.ok(confirmation);

      assert.equal(
        confirmation.status,
        "pending"
      );

      const secondResult =
        await MCPServer.execute(
          "delete_exam",
          {
            examId: exam.id,
            confirmationId:
              firstResult.confirmationId,
          },
          context
        );

      assert.equal(
        secondResult.success,
        true
      );

      assert.equal(
        secondResult.deleted,
        true
      );

      assert.equal(
        await examExists(exam.id),
        false
      );

      const consumedConfirmation =
        await getLatestConfirmation(
          teacher.id,
          "delete_exam"
        );

      assert.equal(
        consumedConfirmation.status,
        "consumed"
      );

      const audit =
        await getLatestAudit(
          teacher.id,
          "delete_exam"
        );

      assert.ok(audit);
      assert.equal(
        audit.success,
        true
      );
      assert.equal(
        audit.error,
        null
      );
    } finally {
      await cleanupTestUser(
        teacher.id
      );
    }
  }
);

test(
  "delete_exam rejects an invented confirmation ID",
  async () => {
    const teacher =
      await createTestTeacher();

    try {
      const exam =
        await createTestExam(
          teacher.id
        );

      const context =
        createContext(teacher);

      await MCPServer.execute(
        "delete_exam",
        {
          examId: exam.id,
        },
        context
      );

      await assert.rejects(
        () =>
          MCPServer.execute(
            "delete_exam",
            {
              examId: exam.id,

              confirmationId:
                "11111111-1111-4111-8111-111111111111",
            },
            context
          ),

        (error) => {
          assert.equal(
            error.statusCode,
            403
          );

          assert.match(
            error.message,
            /invalid|expired/i
          );

          return true;
        }
      );

      assert.equal(
        await examExists(exam.id),
        true
      );
    } finally {
      await cleanupTestUser(
        teacher.id
      );
    }
  }
);

test(
  "publish_exam remains unpublished before confirmation",
  async () => {
    const teacher =
      await createTestTeacher();

    try {
      const exam =
        await createTestExam(
          teacher.id,
          {
            published: false,
          }
        );

      const context =
        createContext(teacher);

      const firstResult =
        await MCPServer.execute(
          "publish_exam",
          {
            examId: exam.id,
          },
          context
        );

      assert.equal(
        firstResult.requiresConfirmation,
        true
      );

      const beforeResult =
        await pool.query(
          `
            SELECT published
            FROM exams
            WHERE id = $1
          `,
          [exam.id]
        );

      assert.equal(
        beforeResult.rows[0]
          .published,
        false
      );

      const secondResult =
        await MCPServer.execute(
          "publish_exam",
          {
            examId: exam.id,
            confirmationId:
              firstResult.confirmationId,
          },
          context
        );

      assert.equal(
        secondResult.published ??
          secondResult.isPublished,
        true
      );

      const afterResult =
        await pool.query(
          `
            SELECT published
            FROM exams
            WHERE id = $1
          `,
          [exam.id]
        );

      assert.equal(
        afterResult.rows[0]
          .published,
        true
      );
    } finally {
      await cleanupTestUser(
        teacher.id
      );
    }
  }
);

test(
  "delete_course_material deletes database record after confirmation",
  async () => {
    const teacher =
      await createTestTeacher();

    try {
      const document =
        await createTestDocument(
          teacher,
          {
            title:
              "Material To Delete.pdf",
          }
        );

      const context =
        createContext(teacher);

      const firstResult =
        await MCPServer.execute(
          "delete_course_material",
          {
            documentId:
              document.id,
          },
          context
        );

      assert.equal(
        firstResult.requiresConfirmation,
        true
      );

      assert.equal(
        await documentExists(
          document.id
        ),
        true
      );

      const secondResult =
        await MCPServer.execute(
          "delete_course_material",
          {
            documentId:
              document.id,

            confirmationId:
              firstResult.confirmationId,
          },
          context
        );

      assert.equal(
        secondResult.success,
        true
      );

      assert.equal(
        await documentExists(
          document.id
        ),
        false
      );
    } finally {
      await cleanupTestUser(
        teacher.id
      );
    }
  }
);

after(async () => {
  await pool.end();
});