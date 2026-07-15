import "./bootstrap.js";

import {
  randomUUID,
} from "node:crypto";

import test, {
  after,
} from "node:test";

import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

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
  createTestTeacher,
  createTestStudent,
  createTestExam,
  cleanupTestUser,
} = await import(
  "./helpers/databaseTestUtils.js"
);

const createdUserIds = [];

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

async function createProtectedExam(
  teacher,
  {
    published = true,
    password =
      "SecureExam123!",
  } = {}
) {
  const exam =
    await createTestExam(
      teacher.id,
      {
        title:
          `Protected Exam ${Date.now()}-${randomUUID()}`,

        published,
        isPublished:
          published,

        isAlwaysAvailable:
          true,

        releaseScoresImmediately:
          true,

        passingScore: 60,
        timeLimit: 30,
      }
    );

  const passwordHash =
    await bcrypt.hash(
      password,
      12
    );

  await pool.query(
    `
      UPDATE exams
      SET
        published = $2,
        is_always_available = TRUE,
        password_hash = $3
      WHERE id = $1
    `,
    [
      exam.id,
      published,
      passwordHash,
    ]
  );

  return {
    ...exam,
    password,
  };
}

test(
  "correct exam password is accepted",
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
      await createProtectedExam(
        teacher
      );

    const result =
      await ExamService
        .verifyExamPassword(
          exam.id,
          exam.password,
          {
            ...student,
            role: "Student",
          }
        );

    assert.deepEqual(
      result,
      {
        success: true,
        passwordRequired:
          true,
      }
    );
  }
);

test(
  "wrong exam password is rejected",
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
      await createProtectedExam(
        teacher
      );

    await assert.rejects(
      () =>
        ExamService
          .verifyExamPassword(
            exam.id,
            "WrongPassword",
            {
              ...student,
              role: "Student",
            }
          ),
      (error) => {
        assert.equal(
          error.statusCode,
          403
        );

        assert.match(
          error.message,
          /incorrect exam password/i
        );

        return true;
      }
    );
  }
);

test(
  "student exam response never exposes password or password hash",
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
      await createProtectedExam(
        teacher
      );

    const studentExam =
      await ExamService
        .getExamForStudent(
          exam.id,
          {
            ...student,
            role: "Student",
          }
        );

    assert.equal(
      studentExam.passwordRequired,
      true
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          studentExam,
          "password"
        ),
      false
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          studentExam,
          "passwordHash"
        ),
      false
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          studentExam,
          "password_hash"
        ),
      false
    );
  }
);

test(
  "unprotected exam does not require verification",
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
      await createTestExam(
        teacher.id,
        {
          title:
            `Unprotected Exam ${Date.now()}`,

          published: true,
          isPublished: true,
          isAlwaysAvailable:
            true,
        }
      );

    await pool.query(
      `
        UPDATE exams
        SET
          published = TRUE,
          is_always_available = TRUE,
          password_hash = NULL
        WHERE id = $1
      `,
      [exam.id]
    );

    const result =
      await ExamService
        .verifyExamPassword(
          exam.id,
          "",
          {
            ...student,
            role: "Student",
          }
        );

    assert.deepEqual(
      result,
      {
        success: true,
        passwordRequired:
          false,
      }
    );
  }
);

test(
  "student cannot verify password for unpublished exam",
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
      await createProtectedExam(
        teacher,
        {
          published: false,
        }
      );

    await assert.rejects(
      () =>
        ExamService
          .verifyExamPassword(
            exam.id,
            exam.password,
            {
              ...student,
              role: "Student",
            }
          ),
      (error) => {
        assert.equal(
          error.statusCode,
          403
        );

        assert.match(
          error.message,
          /not published/i
        );

        return true;
      }
    );
  }
);

after(async () => {
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