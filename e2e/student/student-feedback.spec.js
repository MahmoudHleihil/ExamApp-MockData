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

const feedbackText =
  "Excellent work. Your answer correctly explains how integration testing verifies interactions between components.";

const questionFeedback =
  "Correct answer. The components are tested together.";

function getFeedbackRow(
  page,
  examTitle
) {
  return page
    .getByTestId(
      "student-feedback-card"
    )
    .filter({
      has: page
        .getByTestId(
          "student-feedback-list-exam-title"
        )
        .filter({
          hasText: examTitle,
        }),
    });
}

test.describe(
  "Student feedback review",
  () => {
    test(
      "student sees released feedback for their own submission",
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
          `Student Feedback Exam ${Date.now()}`;

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

          const questionId =
            exam.questions?.[0]?.id ||
            submission.answerDetails?.[0]
              ?.questionId ||
            submission.answers?.[0]
              ?.questionId;

          expect(
            questionId,
            "Could not determine the submitted question ID."
          ).toBeTruthy();

          const releaseResponse =
            await teacherApi.put(
              `/api/exams/submissions/${encodeURIComponent(
                submission.id
              )}`,
              {
                data: {
                  feedback:
                    feedbackText,

                  questionFeedback: {
                    [questionId]:
                      questionFeedback,
                  },

                  isFeedbackVisible:
                    true,

                  isScorePublished:
                    true,
                },
              }
            );

          const releaseBody =
            await releaseResponse
              .json()
              .catch(() => null);

          expect(
            releaseResponse.ok(),
            `Releasing feedback failed with ${releaseResponse.status()}: ${JSON.stringify(
              releaseBody
            )}`
          ).toBeTruthy();

          await page.goto(
            "/#/student/feedback"
          );

          await expect(
            page.getByTestId(
              "student-dashboard"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            page.getByTestId(
              "student-feedback-list"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          const feedbackRow =
            getFeedbackRow(
              page,
              examTitle
            );

          await expect(
            feedbackRow
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            feedbackRow.getByTestId(
              "student-feedback-list-score"
            )
          ).toHaveText(
            "100%"
          );

          await feedbackRow
            .getByTestId(
              "student-feedback-view"
            )
            .click();

          await expect(
            page.getByTestId(
              "student-feedback-detail"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            page.getByTestId(
              "student-feedback-exam-title"
            )
          ).toContainText(
            examTitle
          );

          await expect(
            page.getByTestId(
              "student-feedback-score"
            )
          ).toHaveText(
            "100%"
          );

          await expect(
            page.getByTestId(
              "student-feedback-general"
            )
          ).toContainText(
            feedbackText
          );

          await page
            .getByTestId(
              "student-feedback-open-review"
            )
            .click();

          await expect(
            page.getByTestId(
              "student-feedback-question"
            )
          ).toHaveCount(1);

          await expect(
            page.getByTestId(
              "student-feedback-question-text"
            )
          ).toContainText(
            "integration testing"
          );

          await expect(
            page.getByTestId(
              "student-feedback-student-answer"
            )
          ).toContainText(
            "Interactions between components"
          );

          await expect(
            page.getByTestId(
              "student-feedback-question-points"
            )
          ).toContainText(
            "10"
          );

          await expect(
            page.getByTestId(
              "student-feedback-question-comment"
            )
          ).toContainText(
            questionFeedback
          );

          /*
           * Security: the student review must
           * never render or expose the correct
           * answer.
           */
          await expect(
            page.getByText(
              "Correct Answer",
              {
                exact: true,
              }
            )
          ).toHaveCount(0);

          const reviewResponse =
            await studentApi.get(
              `/api/exams/my-submissions/${encodeURIComponent(
                submission.id
              )}/review`
            );

          const reviewBody =
            await reviewResponse
              .json()
              .catch(() => null);

          expect(
            reviewResponse.ok(),
            `Loading the student review failed with ${reviewResponse.status()}: ${JSON.stringify(
              reviewBody
            )}`
          ).toBeTruthy();

          const review =
            reviewBody?.review ||
            reviewBody?.data ||
            reviewBody;

          expect(
            review
          ).toBeTruthy();

          expect(
            Number(
              review.percentage
            )
          ).toBe(100);

          expect(
            review.feedback
          ).toBe(
            feedbackText
          );

          for (
            const question
            of review.questions || []
          ) {
            expect(
              question
            ).not.toHaveProperty(
              "correctAnswer"
            );

            expect(
              question
            ).not.toHaveProperty(
              "correct_answer"
            );
          }
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
