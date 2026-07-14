import {
  test,
  expect,
} from "@playwright/test";

import {
  deleteExamById,
} from "../helpers/examApi.js";

async function fillExamForm(
  page,
  {
    title,
    questionText,
    firstOption,
  }
) {
  await page
    .getByTestId("exam-title")
    .fill(title);

  const alwaysAvailable =
    page.getByTestId(
      "exam-always-available"
    );

  if (
    !(await alwaysAvailable
      .isChecked()
      .catch(() => false))
  ) {
    await alwaysAvailable.check();
  }

  await page
    .getByTestId("exam-time-limit")
    .fill("45");

  await page
    .getByTestId("exam-early-access")
    .fill("10");

  await page
    .getByTestId("exam-passing-score")
    .fill("60");

  await page
    .getByTestId("question-text-0")
    .fill(questionText);

  await page
    .getByTestId("question-points-0")
    .fill("10");

  await page
    .getByTestId(
      "question-0-option-0"
    )
    .fill(firstOption);

  await page
    .getByTestId(
      "question-0-option-1"
    )
    .fill("Incorrect option one");

  await page
    .getByTestId(
      "question-0-option-2"
    )
    .fill("Incorrect option two");

  await page
    .getByTestId(
      "question-0-option-3"
    )
    .fill("Incorrect option three");

  await page
    .getByTestId(
      "question-0-correct-0"
    )
    .check();
}

function getExamRow(
  page,
  examTitle
) {
  return page
    .getByTestId("exam-card")
    .filter({
      has: page
        .getByTestId(
          "exam-card-title"
        )
        .filter({
          hasText: examTitle,
        }),
    });
}

async function createExamThroughUI(
  page,
  examTitle
) {
  await page
    .getByTestId(
      "create-exam-button"
    )
    .click();

  await expect(
    page.getByTestId("exam-form")
  ).toBeVisible();

  await fillExamForm(page, {
    title: examTitle,
    questionText:
      "What does end-to-end testing verify?",
    firstOption:
      "The complete application workflow",
  });

  const responsePromise =
    page.waitForResponse(
      (response) => {
        const url =
          new URL(response.url());

        return (
          response.request().method() ===
            "POST" &&
          url.pathname === "/api/exams"
        );
      },
      {
        timeout: 15_000,
      }
    );

  await page
    .getByTestId("exam-save")
    .click();

  const response =
    await responsePromise;

  const body =
    await response
      .json()
      .catch(() => ({}));

  expect(
    response.ok(),
    `Exam creation failed: ${JSON.stringify(
      body
    )}`
  ).toBeTruthy();

  const examId =
    body.id ||
    body.exam?.id ||
    body.data?.id;

  const examRow =
    getExamRow(page, examTitle);

  await expect(
    examRow
  ).toBeVisible({
    timeout: 15_000,
  });

  return {
    examId:
      examId ||
      (await examRow.getAttribute(
        "data-exam-id"
      )),
    examRow,
  };
}

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

    test(
      "teacher edits an existing exam",
      async ({ page }) => {
        page.on(
          "pageerror",
          (error) => {
            console.error(
              "[page error]",
              error.stack ||
              error.message
            );
          }
        );

        page.on("dialog", async (dialog) => {
          console.error(
            "[dialog]",
            dialog.message()
          );

          await dialog.accept().catch(() => {});
        });

        const suffix = Date.now();

        const originalTitle =
          `Playwright Edit Exam ${suffix}`;

        const updatedTitle =
          `Updated Playwright Exam ${suffix}`;

        const updatedQuestion =
          "What does a Playwright locator provide?";

        let createdExamId = null;

        try {
          await page.goto("/");

          await expect(
            page.getByTestId(
              "teacher-dashboard"
            )
          ).toBeVisible();

          const created =
            await createExamThroughUI(
              page,
              originalTitle
            );

          createdExamId =
            created.examId;

          expect(
            createdExamId,
            "Created exam ID was not found."
          ).toBeTruthy();

          const editButton =
            created.examRow.getByTestId(
              "exam-edit-button"
            );

          await expect(
            editButton
          ).toBeVisible();

          await expect(
            editButton
          ).toBeEnabled();

          const getExamResponsePromise =
            page.waitForResponse(
              (response) => {
                const url =
                  new URL(
                    response.url()
                  );

                return (
                  response
                    .request()
                    .method() === "GET" &&
                  url.pathname ===
                    `/api/exams/${createdExamId}`
                );
              },
              {
                timeout: 15_000,
              }
            );

          await created.examRow
            .getByTestId(
              "exam-edit-button"
            )
            .click();

          const getExamResponse =
            await getExamResponsePromise;

          const responseBody =
            await getExamResponse
              .text()
              .catch(() => "");

          expect(
            getExamResponse.ok(),
            `Loading exam failed with ${getExamResponse.status()}: ${responseBody}`
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
              `#/teacher/exams/edit/${createdExamId}`
            );

          await expect(
            page.getByTestId(
              "exam-form"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            page.getByTestId(
              "exam-title"
            )
          ).toHaveValue(
            originalTitle
          );

          await expect(
            page.getByTestId(
              "question-text-0"
            )
          ).toHaveValue(
            "What does end-to-end testing verify?"
          );

          await page
            .getByTestId(
              "exam-title"
            )
            .fill(updatedTitle);

          await page
            .getByTestId(
              "question-text-0"
            )
            .fill(updatedQuestion);

          await page
            .getByTestId(
              "question-0-option-0"
            )
            .fill(
              "Reliable element lookup with automatic waiting"
            );

          /*
          * Selecting the first answer again ensures the
          * correctAnswer value matches the updated option.
          */
          await page
            .getByTestId(
              "question-0-correct-0"
            )
            .check();

          const updateResponsePromise =
            page.waitForResponse(
              (response) => {
                const url =
                  new URL(
                    response.url()
                  );

                return (
                  response
                    .request()
                    .method() === "PUT" &&
                  url.pathname ===
                    `/api/exams/${createdExamId}`
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

          const updateResponse =
            await updateResponsePromise;

          const responseText =
            await updateResponse
              .text()
              .catch(() => "");

          expect(
            updateResponse.ok(),
            `Exam update failed with ${updateResponse.status()}: ${responseText}`
          ).toBeTruthy();

          await expect(
            getExamRow(
              page,
              originalTitle
            )
          ).toHaveCount(0);

          const updatedRow =
            getExamRow(
              page,
              updatedTitle
            );

          await expect(
            updatedRow
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            updatedRow.getByTestId(
              "exam-card-title"
            )
          ).toHaveText(
            updatedTitle
          );

          /*
          * Reload to verify the update was persisted in
          * PostgreSQL rather than only React state.
          */
          await page.reload();

          await expect(
            page.getByTestId(
              "teacher-dashboard"
            )
          ).toBeVisible();

          const persistedRow =
            getExamRow(
              page,
              updatedTitle
            );

          await expect(
            persistedRow
          ).toBeVisible({
            timeout: 15_000,
          });

          await persistedRow
            .getByTestId(
              "exam-edit-button"
            )
            .click();

          await expect(
            page.getByTestId(
              "exam-title"
            )
          ).toHaveValue(
            updatedTitle
          );

          await expect(
            page.getByTestId(
              "question-text-0"
            )
          ).toHaveValue(
            updatedQuestion
          );

          await page
            .getByTestId(
              "exam-cancel"
            )
            .click();
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

    test(
      "teacher deletes an existing exam",
      async ({ page }) => {
        const suffix = Date.now();

        const examTitle =
          `Playwright Delete Exam ${suffix}`;

        let createdExamId = null;
        let deletedThroughUi = false;

        try {
          await page.goto("/");

          await expect(
            page.getByTestId(
              "teacher-dashboard"
            )
          ).toBeVisible();

          const created =
            await createExamThroughUI(
              page,
              examTitle
            );

          createdExamId =
            created.examId;

          expect(
            createdExamId,
            "Created exam ID was not found."
          ).toBeTruthy();

          const examRow =
            getExamRow(
              page,
              examTitle
            );

          await expect(
            examRow
          ).toBeVisible();

          await examRow
            .getByTestId(
              "exam-delete-button"
            )
            .click();

          await expect(
            examRow.getByTestId(
              "exam-confirm-delete"
            )
          ).toBeVisible();

          await expect(
            examRow.getByTestId(
              "exam-cancel-delete"
            )
          ).toBeVisible();

          const deleteResponsePromise =
            page.waitForResponse(
              (response) => {
                const url =
                  new URL(
                    response.url()
                  );

                return (
                  response
                    .request()
                    .method() === "DELETE" &&
                  url.pathname ===
                    `/api/exams/${createdExamId}`
                );
              },
              {
                timeout: 15_000,
              }
            );

          await examRow
            .getByTestId(
              "exam-confirm-delete"
            )
            .click();

          const deleteResponse =
            await deleteResponsePromise;

          const responseText =
            await deleteResponse
              .text()
              .catch(() => "");

          expect(
            deleteResponse.ok(),
            `Exam deletion failed with ${deleteResponse.status()}: ${responseText}`
          ).toBeTruthy();

          deletedThroughUi = true;

          await expect(
            getExamRow(
              page,
              examTitle
            )
          ).toHaveCount(0, {
            timeout: 15_000,
          });

          /*
          * Reload to prove the exam was deleted from
          * PostgreSQL and not only removed from React state.
          */
          await page.reload();

          await expect(
            page.getByTestId(
              "teacher-dashboard"
            )
          ).toBeVisible();

          await expect(
            page.getByTestId(
              "exam-list"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            getExamRow(
              page,
              examTitle
            )
          ).toHaveCount(0);
        } finally {
          /*
          * Only use API cleanup when the UI deletion failed
          * before completing.
          */
          if (
            createdExamId &&
            !deletedThroughUi
          ) {
            await deleteExamById(
              page,
              createdExamId
            );
          }
        }
      }
    );

    test(
      "teacher publishes a draft exam",
      async ({ page }) => {
        const suffix = Date.now();

        const examTitle =
          `Playwright Publish Exam ${suffix}`;

        let createdExamId = null;

        try {
          await page.goto("/");

          await expect(
            page.getByTestId(
              "teacher-dashboard"
            )
          ).toBeVisible();

          const created =
            await createExamThroughUI(
              page,
              examTitle
            );

          createdExamId =
            created.examId;

          expect(
            createdExamId
          ).toBeTruthy();

          const examRow =
            getExamRow(
              page,
              examTitle
            );

          await expect(
            examRow.getByTestId(
              "exam-publish-status"
            )
          ).toHaveText(/draft/i);

          page.once(
            "dialog",
            async (dialog) => {
              expect(
                dialog.type()
              ).toBe("confirm");

              expect(
                dialog.message()
              ).toMatch(
                /publish this exam/i
              );

              await dialog.accept();
            }
          );

          const publishResponsePromise =
            page.waitForResponse(
              (response) => {
                if (
                  response.request().method() !==
                  "PUT"
                ) {
                  return false;
                }

                const url =
                  new URL(response.url());

                if (
                  url.pathname !==
                  `/api/exams/${createdExamId}`
                ) {
                  return false;
                }

                const body =
                  response.request()
                    .postDataJSON();

                return body?.published === true;
              },
              {
                timeout: 15_000,
              }
            );

          await examRow
            .getByTestId(
              "exam-publish-button"
            )
            .click();

          const publishResponse =
            await publishResponsePromise;

          const responseText =
            await publishResponse
              .text()
              .catch(() => "");

          expect(
            publishResponse.ok(),
            `Publishing failed with ${publishResponse.status()}: ${responseText}`
          ).toBeTruthy();

          await expect(
            getExamRow(
              page,
              examTitle
            ).getByTestId(
              "exam-publish-status"
            )
          ).toHaveText(
            /published/i,
            {
              timeout: 15_000,
            }
          );

          await page.reload();

          await expect(
            page.getByTestId(
              "teacher-dashboard"
            )
          ).toBeVisible();

          await expect(
            getExamRow(
              page,
              examTitle
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            getExamRow(
              page,
              examTitle
            ).getByTestId(
              "exam-publish-status"
            )
          ).toHaveText(
            /published/i
          );

          await expect(
            getExamRow(
              page,
              examTitle
            ).getByTestId(
              "exam-publish-button"
            )
          ).toBeDisabled();
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