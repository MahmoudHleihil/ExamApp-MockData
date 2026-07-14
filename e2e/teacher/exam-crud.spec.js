import {
  test,
  expect,
} from "@playwright/test";

import {
  deleteExamById,
} from "../helpers/examApi.js";

test.describe(
  "Teacher exam management",
  () => {
    test(
      "teacher creates a draft exam",
      async ({ page }) => {
        const uniqueSuffix =
          Date.now();

        const examTitle =
          `Playwright Exam ${uniqueSuffix}`;

        let createdExamId = null;

        try {
          await page.goto("/");

          await expect(
            page.getByTestId(
              "teacher-dashboard"
            )
          ).toBeVisible();

          await page
            .getByTestId(
              "create-exam-button"
            )
            .click();

          await expect(
            page.getByTestId(
              "exam-form"
            )
          ).toBeVisible();

          await page
            .getByTestId(
              "exam-title"
            )
            .fill(examTitle);

          await page
            .getByTestId(
              "exam-always-available"
            )
            .check();

          await page
            .getByTestId(
              "exam-time-limit"
            )
            .fill("45");

          await page
            .getByTestId(
              "exam-early-access"
            )
            .fill("10");

          await page
            .getByTestId(
              "exam-passing-score"
            )
            .fill("60");

          await page
            .getByTestId(
              "question-text-0"
            )
            .fill(
              "What does end-to-end testing verify?"
            );

          await page
            .getByTestId(
              "question-points-0"
            )
            .fill("10");

          await page
            .getByTestId(
              "question-0-option-0"
            )
            .fill(
              "The complete application workflow"
            );

          await page
            .getByTestId(
              "question-0-option-1"
            )
            .fill(
              "Only CSS styles"
            );

          await page
            .getByTestId(
              "question-0-option-2"
            )
            .fill(
              "Only database migrations"
            );

          await page
            .getByTestId(
              "question-0-option-3"
            )
            .fill(
              "Only individual functions"
            );

          await page
            .getByTestId(
              "question-0-correct-0"
            )
            .check();

          const createResponsePromise =
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
                    "/api/exams"
                );
              },
              {
                timeout: 15_000,
              }
            );

          await page
            .getByTestId(
              "exam-save"
            )
            .click();

          const createResponse =
            await createResponsePromise;

          const responseText =
            await createResponse
              .text()
              .catch(() => "");

          expect(
            createResponse.ok(),
            `Exam creation failed with ${createResponse.status()}: ${responseText}`
          ).toBeTruthy();

          let createdExam = {};

          if (responseText) {
            try {
              createdExam =
                JSON.parse(
                  responseText
                );
            } catch {
              throw new Error(
                `Exam API returned invalid JSON: ${responseText}`
              );
            }
          }

          createdExamId =
            createdExam.id ||
            createdExam.exam?.id ||
            createdExam.data?.id ||
            null;

          const examCard =
            page
              .getByTestId(
                "exam-card"
              )
              .filter({
                has:
                  page.getByTestId(
                    "exam-card-title"
                  )
                  .filter({
                    hasText:
                      examTitle,
                  }),
              });

          await expect(
            examCard
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            examCard.getByTestId(
              "exam-card-title"
            )
          ).toHaveText(
            examTitle
          );

          await expect(
            examCard.getByTestId(
              "exam-question-count"
            )
          ).toContainText("1");

          if (!createdExamId) {
            createdExamId =
              await examCard
                .getAttribute(
                  "data-exam-id"
                );
          }

          expect(
            createdExamId,
            "Created exam ID was not returned by the API or rendered in the exam row."
          ).toBeTruthy();
        } finally {
          if (createdExamId) {
            await deleteExamById(
              page,
              createdExamId
            );
          }
        }
      }
    );
  }
);