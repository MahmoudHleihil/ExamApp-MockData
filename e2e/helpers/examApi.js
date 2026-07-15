import { expect } from "@playwright/test";

const backendUrl =
  process.env.E2E_BACKEND_URL ||
  "http://localhost:5000";

export async function deleteExamById(
  page,
  examId
) {
  if (!examId) return;

  const backendUrl =
    process.env
      .E2E_BACKEND_URL ||
    "http://localhost:5000";

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