import {
  test,
  expect,
  request,
} from "@playwright/test";

const backendUrl =
  process.env.E2E_BACKEND_URL ||
  "http://localhost:5000";

async function createTeacherApiContext() {
  return request.newContext({
    baseURL: backendUrl,
    storageState:
      "playwright/.auth/teacher.json",
  });
}

async function createPublishedExam(
  teacherApi,
  examTitle
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

          questions: [
            {
              type:
                "multiple-choice",

              text:
                "What does end-to-end testing verify?",

              options: [
                "The complete application workflow",
                "Only CSS styles",
                "Only SQL queries",
                "Only individual functions",
              ],

              correctAnswer:
                "The complete application workflow",

              points: 10,
            },
          ],
        },
      }
    );

  const createBody =
    await createResponse
      .json()
      .catch(() => ({}));

  expect(
    createResponse.ok(),
    `Exam creation failed with ${createResponse.status()}: ${JSON.stringify(
      createBody
    )}`
  ).toBeTruthy();

  const createdExam =
    createBody.exam ||
    createBody.data ||
    createBody;

  const examId =
    createdExam.id;

  expect(
    examId,
    "Created exam ID is missing."
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
      .catch(() => ({}));

  expect(
    publishResponse.ok(),
    `Exam publishing failed with ${publishResponse.status()}: ${JSON.stringify(
      publishBody
    )}`
  ).toBeTruthy();

  return {
    id: examId,
    title: examTitle,
  };
}

test.describe(
  "Student exam workflow",
  () => {
    test(
      "student finds, completes, and submits a published exam",
      async ({ page }) => {
        const teacherApi =
          await createTeacherApiContext();

        const examTitle =
          `Student Submission Exam ${Date.now()}`;

        let examId = null;

        try {
          const createdExam =
            await createPublishedExam(
              teacherApi,
              examTitle
            );

          examId =
            createdExam.id;

          await page.goto("/");

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

          await expect(
            page.getByTestId(
              "student-exam-id"
            )
          ).toHaveValue(examId);

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
          ).toHaveText(examTitle);

          await page
            .getByTestId(
              "student-start-exam"
            )
            .click();

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
          ).toBeVisible();

          await expect(
            page.getByTestId(
              "student-exam-heading"
            )
          ).toHaveText(examTitle);

          await expect(
            page.getByTestId(
              "student-question-text"
            )
          ).toHaveText(
            "What does end-to-end testing verify?"
          );

          await page
            .getByTestId(
              "student-answer-0-0"
            )
            .click();

          await expect(
            page.getByTestId(
              "student-answer-0-0"
            )
          ).toHaveClass(/active/);

          /*
           * Open the confirmation modal first.
           */
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

          /*
           * Start listening before the confirmation
           * button triggers the network request.
           */
          const submitRequestPromise =
            page.waitForRequest(
              (request) => {
                const url =
                  new URL(
                    request.url()
                  );

                return (
                  request.method() ===
                    "POST" &&
                  url.pathname ===
                    "/api/exams/submit"
                );
              },
              {
                timeout: 15_000,
              }
            );

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

          const [
            submitRequest,
            submitResponse,
          ] = await Promise.all([
            submitRequestPromise,
            submitResponsePromise,
          ]);

          const payload =
            submitRequest.postDataJSON();

          expect(payload).toEqual({
            examId,
            answers:
              expect.any(Object),
          });

          expect(
            payload
          ).not.toHaveProperty(
            "score"
          );

          expect(
            payload
          ).not.toHaveProperty(
            "percentage"
          );

          expect(
            payload
          ).not.toHaveProperty(
            "studentId"
          );

          const submitResponseText =
            await submitResponse
              .text()
              .catch(() => "");

          expect(
            submitResponse.ok(),
            `Exam submission failed with ${submitResponse.status()}: ${submitResponseText}`
          ).toBeTruthy();

          let submittedRecord = null;

          try {
            submittedRecord =
              submitResponseText
                ? JSON.parse(
                    submitResponseText
                  )
                : null;
          } catch {
            submittedRecord = null;
          }

          const submittedExamId =
            submittedRecord?.examId ??
            submittedRecord?.exam_id ??
            submittedRecord
              ?.submission?.examId ??
            submittedRecord
              ?.data?.examId;

          if (submittedExamId) {
            expect(
              String(
                submittedExamId
              )
            ).toBe(
              String(examId)
            );
          }

          await expect(
            page.getByTestId(
              "student-result"
            )
          ).toBeVisible({
            timeout: 15_000,
          });

          await expect(
            page.getByTestId(
              "student-result-exam-title"
            )
          ).toContainText(
            examTitle
          );

          await expect(
            page.getByTestId(
              "student-score"
            )
          ).toHaveText("100%");

          await expect(
            page.getByTestId(
              "student-pass-status"
            )
          ).toHaveText(
            "PASSED"
          );

          await page.reload();

          /*
           * The result view is stored in React state,
           * so after refresh the app may redirect.
           * Verify the submission directly through
           * the authenticated student endpoint.
           */
          const submissionsResponse =
            await page.request.get(
              `${backendUrl}/api/exams/my-submissions`
            );

          const submissionsBody =
            await submissionsResponse
              .json()
              .catch(() => null);

          expect(
            submissionsResponse.ok(),
            `Could not load student submissions. Status: ${
              submissionsResponse.status()
            }, body: ${JSON.stringify(
              submissionsBody
            )}`
          ).toBeTruthy();

          const submissions =
            Array.isArray(
              submissionsBody
            )
              ? submissionsBody
              : Array.isArray(
                  submissionsBody
                    ?.submissions
                )
                ? submissionsBody
                    .submissions
                : Array.isArray(
                    submissionsBody
                      ?.data
                  )
                  ? submissionsBody
                      .data
                  : [];

          expect(
            submissions.length,
            `No submissions were returned. Body: ${JSON.stringify(
              submissionsBody
            )}`
          ).toBeGreaterThan(0);

          const storedSubmission =
            submissions.find(
              (submission) => {
                const storedExamId =
                  submission.examId ??
                  submission.exam_id ??
                  submission.exam
                    ?.id;

                return (
                  String(
                    storedExamId
                  ) ===
                  String(examId)
                );
              }
            );

          expect(
            storedSubmission,
            `Submitted exam ${examId} was not found. Returned submissions: ${JSON.stringify(
              submissions
            )}`
          ).toBeTruthy();

          const storedPercentage =
            storedSubmission
              .percentage ??
            (
              Number(
                storedSubmission
                  .maxScore
              ) > 0
                ? (
                    Number(
                      storedSubmission
                        .score
                    ) /
                    Number(
                      storedSubmission
                        .maxScore
                    )
                  ) * 100
                : 0
            );

          expect(
            Number(
              storedPercentage
            )
          ).toBe(100);
        } finally {
          if (examId) {
            await teacherApi.delete(
              `/api/exams/${encodeURIComponent(
                examId
              )}`
            );
          }

          await teacherApi.dispose();
        }
      }
    );
  }
);
