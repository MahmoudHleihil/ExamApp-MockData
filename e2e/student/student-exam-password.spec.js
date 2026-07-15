import {
  test,
  expect,
} from "@playwright/test";

import {
  createApiContext,
  deleteExam,
} from "../helpers/submissionApi.js";

async function createProtectedExam(
  teacherApi,
  studentApi,
  examTitle,
  password
) {
  const createResponse =
    await teacherApi.post(
      "/api/exams",
      {
        data: {
          title: examTitle,
          timeLimit: 30,
          earlyAccessMinutes: 0,
          isAlwaysAvailable: true,
          releaseScoresImmediately: true,
          scheduledDate:
            new Date().toISOString(),
          passingScore: 60,
          published: false,
          password,

          questions: [
            {
              type:
                "multiple-choice",

              text:
                "What protects this exam?",

              options: [
                "Server-side password verification",
                "CSS",
                "Local storage",
                "The browser URL",
              ],

              correctAnswer:
                "Server-side password verification",

              points: 10,
            },
          ],
        },
      }
    );

  const createBody =
    await createResponse
      .json()
      .catch(() => null);

  expect(
    createResponse.ok(),
    `Protected exam creation failed with ${createResponse.status()}: ${JSON.stringify(
      createBody
    )}`
  ).toBeTruthy();

  const createdExam =
    createBody?.exam ||
    createBody?.data ||
    createBody;

  expect(createdExam).not.toHaveProperty(
    "password"
  );

  expect(createdExam).not.toHaveProperty(
    "passwordHash"
  );

  expect(createdExam).not.toHaveProperty(
    "password_hash"
  );

  const examId =
    createdExam?.id;

  expect(
    examId,
    "Created protected exam ID is missing."
  ).toBeTruthy();

  const publishResponse =
    await teacherApi.put(
      `/api/exams/${encodeURIComponent(
        examId
      )}`,
      {
        data: {
          published: true,
        },
      }
    );

  const publishBody =
    await publishResponse
      .json()
      .catch(() => null);

  expect(
    publishResponse.ok(),
    `Protected exam publishing failed with ${publishResponse.status()}: ${JSON.stringify(
      publishBody
    )}`
  ).toBeTruthy();

  expect(publishBody).not.toHaveProperty(
    "passwordHash"
  );

  expect(publishBody).not.toHaveProperty(
    "password_hash"
  );

  const studentExamResponse =
    await studentApi.get(
      `/api/exams/take/${encodeURIComponent(
        examId
      )}`
    );

  const studentExam =
    await studentExamResponse
      .json()
      .catch(() => null);

  expect(
    studentExamResponse.ok(),
    `Student exam lookup failed with ${studentExamResponse.status()}: ${JSON.stringify(
      studentExam
    )}`
  ).toBeTruthy();

  expect(
    studentExam.passwordRequired
  ).toBe(true);

  expect(studentExam).not.toHaveProperty(
    "password"
  );

  expect(studentExam).not.toHaveProperty(
    "passwordHash"
  );

  expect(studentExam).not.toHaveProperty(
    "password_hash"
  );

  return {
    id: examId,
    title: examTitle,
  };
}

test.describe(
  "Password-protected student exam",
  () => {
    test(
      "wrong password is rejected and correct password starts the exam",
      async ({ page }) => {
        const teacherApi =
          await createApiContext(
            "playwright/.auth/teacher.json"
          );

        const studentApi =
          await createApiContext(
            "playwright/.auth/student.json"
          );

        const examTitle =
          `Protected E2E Exam ${Date.now()}`;

        const password =
          "SecureExam123!";

        let examId = null;

        try {
          const exam =
            await createProtectedExam(
              teacherApi,
              studentApi,
              examTitle,
              password
            );

          examId = exam.id;

          await page.goto(
            "/#/student/exams"
          );

          await expect(
            page.getByTestId(
              "student-dashboard"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await page
            .getByTestId(
              "student-exam-id"
            )
            .fill(examId);

          await page
            .getByTestId(
              "student-search-exam"
            )
            .click();

          await expect(
            page.getByTestId(
              "student-exam-preview"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            page.getByTestId(
              "student-exam-title"
            )
          ).toHaveText(
            examTitle
          );

          await expect(
            page.getByTestId(
              "student-exam-password"
            )
          ).toBeVisible();

          /*
           * Wrong password.
           */
          await page
            .getByTestId(
              "student-exam-password"
            )
            .fill(
              "WrongPassword"
            );

          const wrongPasswordResponsePromise =
            page.waitForResponse(
              (response) => {
                const url =
                  new URL(
                    response.url()
                  );

                return (
                  response
                    .request()
                    .method() ===
                    "POST" &&
                  url.pathname ===
                    `/api/exams/take/${examId}/verify-password`
                );
              },
              {
                timeout: 15_000,
              }
            );

          await page
            .getByTestId(
              "student-start-exam"
            )
            .click();

          const wrongPasswordResponse =
            await wrongPasswordResponsePromise;

          expect(
            wrongPasswordResponse.status()
          ).toBe(403);

          await expect(
            page.getByTestId(
              "student-password-error"
            )
          ).toContainText(
            /incorrect password/i
          );

          await expect
            .poll(
              () =>
                new URL(
                  page.url()
                ).hash
            )
            .not.toBe(
              `#/student/exams/${examId}/take`
            );

          /*
           * Correct password.
           */
          await page
            .getByTestId(
              "student-exam-password"
            )
            .fill(password);

          const correctPasswordResponsePromise =
            page.waitForResponse(
              (response) => {
                const url =
                  new URL(
                    response.url()
                  );

                return (
                  response
                    .request()
                    .method() ===
                    "POST" &&
                  url.pathname ===
                    `/api/exams/take/${examId}/verify-password`
                );
              },
              {
                timeout: 15_000,
              }
            );

          await page
            .getByTestId(
              "student-start-exam"
            )
            .click();

          const correctPasswordResponse =
            await correctPasswordResponsePromise;

          expect(
            correctPasswordResponse.ok()
          ).toBeTruthy();

          await expect
            .poll(
              () =>
                new URL(
                  page.url()
                ).hash,
              {
                timeout: 15_000,
              }
            )
            .toBe(
              `#/student/exams/${examId}/take`
            );

          await expect(
            page.getByTestId(
              "student-exam-page"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            page.getByTestId(
              "student-question-text"
            )
          ).toHaveText(
            "What protects this exam?"
          );
        } finally {
          if (examId) {
            await deleteExam(
              teacherApi,
              examId
            );
          }

          await studentApi.dispose();
          await teacherApi.dispose();
        }
      }
    );
  }
);
