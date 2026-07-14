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

function getSubmissionRow(
  page,
  examTitle
) {
  return page
    .getByTestId(
      "submission-card"
    )
    .filter({
      has: page
        .getByTestId(
          "submission-exam-title"
        )
        .filter({
          hasText: examTitle,
        }),
    });
}

test.describe(
  "Teacher submission grading",
  () => {
    test(
      "teacher releases feedback for a student submission",
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
          `Grading E2E Exam ${Date.now()}`;

        const feedbackText =
          "Excellent work. You correctly identified how integration testing verifies interactions between components.";

        let examId = null;

        try {
          const exam =
            await createPublishedExam(
              teacherApi,
              examTitle
            );

          examId = exam.id;

          const submission =
            await submitExam(
              studentApi,
              exam
            );

          expect(
            submission.id
          ).toBeTruthy();

          await page.goto(
            "/#/teacher/submissions"
          );

          await expect(
            page.getByTestId(
              "teacher-dashboard"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            page.getByTestId(
              "teacher-submission-list"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          const submissionRow =
            getSubmissionRow(
              page,
              examTitle
            );

          await expect(
            submissionRow
          ).toBeVisible({
            timeout: 15_000,
          });

          const persistedSubmissionId =
            await submissionRow.getAttribute(
              "data-submission-id"
            );

          expect(
            persistedSubmissionId,
            "The PostgreSQL submission ID is missing from the rendered row."
          ).toBeTruthy();

          console.log(
            "Submit response ID:",
            submission.id
          );

          console.log(
            "Persisted submission ID:",
            persistedSubmissionId
          );

          await expect(
            submissionRow
              .getByTestId(
                "submission-student-name"
              )
          ).not.toHaveText("");

          const examResponsePromise =
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
                    "GET" &&
                  url.pathname ===
                    `/api/exams/${examId}`
                );
              },
              {
                timeout: 15_000,
              }
            );

          await submissionRow
            .getByTestId(
              "submission-view-button"
            )
            .click();

          const examResponse =
            await examResponsePromise;

          expect(
            examResponse.ok()
          ).toBeTruthy();

          await expect(
            page.getByTestId(
              "submission-detail"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            page.getByTestId(
              "submission-detail-exam-title"
            )
          ).toHaveText(
            examTitle
          );

          await expect(
            page.getByTestId(
              "submission-score"
            )
          ).toHaveText("100%");

          await page
            .getByTestId(
              "submission-feedback"
            )
            .fill(feedbackText);

          const visibility =
            page.getByTestId(
              "submission-feedback-visible"
            );

          if (
            !(await visibility
              .isChecked()
              .catch(() => false))
          ) {
            await visibility.check();
          }

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
                    .method() ===
                    "PUT" &&
                  url.pathname ===
                    `/api/exams/submissions/${persistedSubmissionId}`
                );
              },
              {
                timeout: 15_000,
              }
            );

          await page
            .getByTestId(
              "submission-save"
            )
            .click();

          const updateResponse =
            await updateResponsePromise;

          const updateText =
            await updateResponse
              .text()
              .catch(() => "");

          expect(
            updateResponse.ok(),
            `Saving feedback failed with ${updateResponse.status()}: ${updateText}`
          ).toBeTruthy();

          await expect(
            page.getByTestId(
              "submission-save-success"
            )
          ).toContainText(
            /released successfully/i
          );

          /*
           * Return to the list and reopen the submission.
           * This proves the feedback came from PostgreSQL
           * rather than only React component state.
           */
          await page.goto(
            "/#/teacher/submissions"
          );

          await expect(
            page.getByTestId(
              "teacher-submission-list"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          const persistedRow =
            getSubmissionRow(
              page,
              examTitle
            );

          await expect(
            persistedRow
          ).toBeVisible({
            timeout: 15_000,
          });

          await persistedRow
            .getByTestId(
              "submission-view-button"
            )
            .click();

          await expect(
            page.getByTestId(
              "submission-detail"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            page.getByTestId(
              "submission-feedback"
            )
          ).toHaveValue(
            feedbackText
          );

          await expect(
            page.getByTestId(
              "submission-feedback-visible"
            )
          ).toBeChecked();

          await expect(
            page.getByTestId(
              "submission-score"
            )
          ).toHaveText("100%");
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