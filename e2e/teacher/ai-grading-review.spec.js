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

async function createWrittenExam(
  teacherApi,
  examTitle
) {
  const response =
    await teacherApi.post(
      "/api/exams",
      {
        data: {
          title: examTitle,
          description:
            "Written-answer AI grading E2E test.",

          subject:
            "Computer Networks",

          difficulty:
            "medium",

          timeLimit: 30,
          passingScore: 60,

          isAlwaysAvailable:
            true,

          releaseScoresImmediately:
            false,

          published: true,
          isPublished: true,

          questions: [
            {
              type: "written",

              text:
                "Explain the difference between TCP and UDP.",

              correctAnswer:
                "TCP is connection-oriented, reliable, ordered, and retransmits lost packets. UDP is connectionless and does not guarantee delivery or ordering.",

              sourceEvidence:
                "Mention reliability, ordering, retransmission, and connection-oriented versus connectionless communication.",

              options: [],
              points: 10,
            },
          ],
        },
      }
    );

  const body =
    await response
      .json()
      .catch(() => null);

  expect(
    response.ok(),
    `Written exam creation failed with ${response.status()}: ${JSON.stringify(
      body
    )}`
  ).toBeTruthy();

  const exam =
    body?.exam ||
    body?.data ||
    body;

  expect(
    exam?.id,
    "Created written exam ID is missing."
  ).toBeTruthy();

  /*
   * Some create endpoints preserve the
   * published flag; others require a
   * separate update.
   */
  if (
    !exam.published &&
    !exam.isPublished
  ) {
    const publishResponse =
      await teacherApi.put(
        `/api/exams/${encodeURIComponent(
          exam.id
        )}`,
        {
          data: {
            published: true,
            isPublished: true,
          },
        }
      );

    const publishBody =
      await publishResponse
        .json()
        .catch(() => null);

    expect(
      publishResponse.ok(),
      `Written exam publishing failed with ${publishResponse.status()}: ${JSON.stringify(
        publishBody
      )}`
    ).toBeTruthy();
  }

  /*
   * Reload the exam so the test receives
   * persisted question IDs from PostgreSQL.
   */
  const reloadResponse =
    await teacherApi.get(
      `/api/exams/manage/${encodeURIComponent(
        exam.id
      )}`
    );

  const reloadBody =
    await reloadResponse
      .json()
      .catch(() => null);

  expect(
    reloadResponse.ok(),
    `Reloading the written exam failed with ${reloadResponse.status()}: ${JSON.stringify(
      reloadBody
    )}`
  ).toBeTruthy();

  return (
    reloadBody?.exam ||
    reloadBody?.data ||
    reloadBody
  );
}

async function submitWrittenAnswer(
  studentApi,
  exam
) {
  const questionId =
    exam.questions?.[0]?.id;

  expect(
    questionId,
    "Written question ID is missing."
  ).toBeTruthy();

  const response =
    await studentApi.post(
      "/api/exams/submit",
      {
        data: {
          examId: exam.id,

          answers: {
            [questionId]:
              "TCP guarantees delivery, while UDP is generally faster.",
          },
        },
      }
    );

  const body =
    await response
      .json()
      .catch(() => null);

  expect(
    response.ok(),
    `Written exam submission failed with ${response.status()}: ${JSON.stringify(
      body
    )}`
  ).toBeTruthy();

  const submission =
    body?.submission ||
    body?.data ||
    body;

  expect(
    submission?.id,
    "Written submission ID is missing."
  ).toBeTruthy();

  return {
    submission,
    questionId,
  };
}

async function seedAiSuggestion(
  teacherApi,
  submissionId,
  questionId
) {
  /*
   * Use the project’s test-only AI seed endpoint.
   * Add this endpoint only in NODE_ENV=test.
   */
  const response =
    await teacherApi.put(
      `/api/test/submissions/${encodeURIComponent(
        submissionId
      )}/answers/${encodeURIComponent(
        questionId
      )}/ai-suggestion`,
      {
        data: {
          awardedPoints: 8,
          confidence: 0.88,

          feedback:
            "Good answer, but ordering and connection behavior were not fully explained.",

          strengths: [
            "Correctly identified reliability",
          ],

          missingConcepts: [
            "Packet ordering",
            "Connection-oriented versus connectionless behavior",
          ],

          status:
            "ai-suggestion-ready",
        },
      }
    );

  const body =
    await response
      .json()
      .catch(() => null);

  expect(
    response.ok(),
    `Seeding the AI suggestion failed with ${response.status()}: ${JSON.stringify(
      body
    )}`
  ).toBeTruthy();
}

test.describe(
  "Teacher AI grading review",
  () => {
    test(
      "teacher accepts an AI suggestion and the recalculated score persists",
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
          `AI Review E2E ${Date.now()}`;

        let examId = null;

        try {
          const exam =
            await createWrittenExam(
              teacherApi,
              examTitle
            );

          examId = exam.id;

          const {
            submission,
            questionId,
          } =
            await submitWrittenAnswer(
              studentApi,
              exam
            );

          await seedAiSuggestion(
            teacherApi,
            submission.id,
            questionId
          );
page.on(
  "response",
  async (response) => {
    const url =
      new URL(response.url());

    if (
      response.ok() &&
      url.pathname ===
        "/api/exams/submissions"
    ) {
      const body =
        await response
          .json()
          .catch(() => null);

      console.log(
        "Teacher submissions response:",
        JSON.stringify(
          body,
          null,
          2
        )
      );
    }
  }
);
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

          await submissionRow
            .getByTestId(
              "submission-view-button"
            )
            .click();
const detailText =
  await page
    .getByTestId("submission-detail")
    .textContent();

console.log(
  "Submission detail text:",
  detailText
);
          await expect(
            page.getByTestId(
              "submission-detail"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          const aiCard =
            page
              .getByTestId(
                "teacher-ai-suggestion"
              )
              .filter({
                has: page.getByText(
                  "AI Grading Suggestion",
                  {
                    exact: true,
                  }
                ),
              });

          await expect(
            aiCard
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            aiCard.getByTestId(
              "teacher-ai-points"
            )
          ).toHaveText(
            "8 / 10"
          );

          await expect(
            aiCard.getByTestId(
              "teacher-ai-confidence"
            )
          ).toHaveText(
            "88%"
          );

          await expect(
            aiCard.getByTestId(
              "teacher-ai-feedback"
            )
          ).toContainText(
            /ordering and connection behavior/i
          );

          const reviewResponsePromise =
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
                    `/api/exams/submissions/${submission.id}/answers/${questionId}/ai-review`
                );
              },
              {
                timeout: 15_000,
              }
            );

          await aiCard
            .getByTestId(
              "teacher-ai-accept"
            )
            .click();

          const reviewResponse =
            await reviewResponsePromise;

          const reviewText =
            await reviewResponse
              .text()
              .catch(() => "");

          expect(
            reviewResponse.ok(),
            `Accepting the AI suggestion failed with ${reviewResponse.status()}: ${reviewText}`
          ).toBeTruthy();

          let reviewBody = null;

          try {
            reviewBody =
              reviewText
                ? JSON.parse(
                    reviewText
                  )
                : null;
          } catch {
            reviewBody = null;
          }

          const updatedSubmission =
            reviewBody?.submission ||
            reviewBody?.data ||
            reviewBody;

          expect(
            Number(
              updatedSubmission?.score
            )
          ).toBe(8);

          expect(
            Number(
              updatedSubmission?.maxScore
            )
          ).toBe(10);

          expect(
            Number(
              updatedSubmission?.percentage
            )
          ).toBe(80);

          await expect(
            page.getByTestId(
              "submission-score"
            )
          ).toHaveText(
            "80%"
          );

          await expect(
            aiCard.getByTestId(
              "teacher-final-points"
            )
          ).toHaveText(
            "8"
          );

          await expect(
            aiCard.getByTestId(
              "teacher-ai-reviewed"
            )
          ).toContainText(
            /accepted/i
          );

          /*
           * Reopen the submission to prove the
           * accepted grade was persisted in
           * PostgreSQL rather than only stored
           * in React state.
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
              "submission-score"
            )
          ).toHaveText(
            "80%"
          );

          await expect(
            page.getByTestId(
              "teacher-final-points"
            )
          ).toHaveText(
            "8"
          );

          await expect(
            page.getByTestId(
              "teacher-ai-reviewed"
            )
          ).toContainText(
            /accepted/i
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
