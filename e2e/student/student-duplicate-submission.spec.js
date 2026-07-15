import {
  test,
  expect,
} from "@playwright/test";

import {
  createApiContext,
  createPublishedExam,
  submitExam,
  deleteExam,
} from "../helpers/submissionApi.js";

test.describe(
  "Duplicate exam submission protection",
  () => {
    test(
      "student cannot submit the same exam twice",
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
          `Duplicate Submission E2E ${Date.now()}`;

        let examId = null;

        try {
          const exam =
            await createPublishedExam(
              teacherApi,
              examTitle
            );

          examId = exam.id;

          /*
           * First submission succeeds.
           */
          const firstSubmission =
            await submitExam(
              studentApi,
              exam
            );

          expect(
            firstSubmission.id
          ).toBeTruthy();

          /*
           * Verify the backend rejects a second
           * submission with HTTP 409.
           */
          const questionId =
            exam.questions?.[0]?.id ||
            firstSubmission
              .answerDetails?.[0]
              ?.questionId;

          expect(
            questionId,
            "Could not determine the exam question ID."
          ).toBeTruthy();

          const duplicateResponse =
            await studentApi.post(
              "/api/exams/submit",
              {
                data: {
                  examId,
                  answers: {
                    [questionId]:
                      "Interactions between components",
                  },
                },
              }
            );

          const duplicateBody =
            await duplicateResponse
              .json()
              .catch(() => null);

          expect(
            duplicateResponse.status(),
            `Expected duplicate submission to return 409, but received ${duplicateResponse.status()}: ${JSON.stringify(
              duplicateBody
            )}`
          ).toBe(409);

          expect(
            duplicateBody?.message ||
              duplicateBody?.error
          ).toMatch(
            /already submitted/i
          );

          /*
           * Open the student portal and try to
           * locate the already-submitted exam.
           */
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

          /*
           * The UI may either block starting the exam
           * immediately or let the student reach the
           * submit step and then display the 409.
           */
          const startButton =
            page.getByTestId(
              "student-start-exam"
            );

          const alreadySubmittedMessage =
            page.getByTestId(
              "student-already-submitted"
            );

          if (
            await alreadySubmittedMessage
              .isVisible()
              .catch(() => false)
          ) {
            await expect(
              alreadySubmittedMessage
            ).toContainText(
              /already submitted/i
            );

            await expect(
              startButton
            ).toBeDisabled();

            return;
          }

          /*
           * Fallback behavior: the student may open
           * the exam, but the second POST must fail.
           */
          await startButton.click();

          await expect(
            page.getByTestId(
              "student-exam-page"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await page
            .getByTestId(
              "student-answer-0-0"
            )
            .click();

          await page
            .getByTestId(
              "student-submit-exam"
            )
            .click();

          await expect(
            page.getByTestId(
              "student-submit-modal"
            )
          ).toBeVisible();

          const submitResponsePromise =
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
                    "/api/exams/submit"
                );
              },
              {
                timeout: 15_000,
              }
            );

          await page
            .getByTestId(
              "student-confirm-submit"
            )
            .click();

          const submitResponse =
            await submitResponsePromise;

          expect(
            submitResponse.status()
          ).toBe(409);

          await expect(
            page.getByTestId(
              "student-exam-error"
            )
          ).toContainText(
            /already submitted/i
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
