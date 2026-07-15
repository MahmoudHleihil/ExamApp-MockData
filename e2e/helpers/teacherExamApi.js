import {
  expect,
} from "@playwright/test";

const backendUrl =
  process.env.E2E_BACKEND_URL ||
  "http://localhost:5000";

export async function createPublishedExam(
  page,
  overrides = {}
) {
  const title =
    overrides.title ||
    `Student E2E Exam ${Date.now()}`;

  const response =
    await page.request.post(
      `${backendUrl}/api/exams`,
      {
        data: {
          title,
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
                "What does Playwright test?",

              options: [
                "Complete browser workflows",
                "Only SQL",
                "Only CSS",
                "Only unit functions",
              ],

              correctAnswer:
                "Complete browser workflows",

              points: 10,
            },
          ],
        },
      }
    );

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

  const exam =
    body.exam ||
    body.data ||
    body;

  const examId =
    exam.id;

  expect(examId).toBeTruthy();

  const publishResponse =
    await page.request.put(
      `${backendUrl}/api/exams/${encodeURIComponent(
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
    `Exam publishing failed: ${JSON.stringify(
      publishBody
    )}`
  ).toBeTruthy();

  return {
    id: examId,
    title,
  };
}

export async function deleteExam(
  page,
  examId
) {
  if (!examId) return;

  const response =
    await page.request.delete(
      `${backendUrl}/api/exams/${encodeURIComponent(
        examId
      )}`
    );

  expect(
    [200, 204, 404]
  ).toContain(
    response.status()
  );
}