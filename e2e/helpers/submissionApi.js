import {
  expect,
  request,
} from "@playwright/test";

const backendUrl =
  process.env.E2E_BACKEND_URL ||
  "http://localhost:5000";

export async function createApiContext(
  storageState
) {
  return request.newContext({
    baseURL: backendUrl,
    storageState,
  });
}

export async function createPublishedExam(
  teacherApi,
  title
) {
  const createResponse =
    await teacherApi.post(
      "/api/exams",
      {
        data: {
          title,
          timeLimit: 30,
          earlyAccessMinutes: 0,
          isAlwaysAvailable: true,
          releaseScoresImmediately: false,
          scheduledDate:
            new Date().toISOString(),
          passingScore: 60,
          published: false,

          questions: [
            {
              type: "multiple-choice",
              text:
                "What does integration testing verify?",
              options: [
                "Interactions between components",
                "Only CSS",
                "Only one function",
                "Only SQL syntax",
              ],
              correctAnswer:
                "Interactions between components",
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

  const exam =
    createBody.exam ||
    createBody.data ||
    createBody;

  expect(
    exam?.id,
    "Created exam ID is missing."
  ).toBeTruthy();

  const publishResponse =
    await teacherApi.put(
      `/api/exams/${encodeURIComponent(
        exam.id
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

  /*
   * Reload the exam so the helper receives the real
   * PostgreSQL question UUID.
   */
  const getResponse =
    await teacherApi.get(
      `/api/exams/${encodeURIComponent(
        exam.id
      )}`
    );

  const loadedExam =
    await getResponse
      .json()
      .catch(() => ({}));

  expect(
    getResponse.ok(),
    `Exam reload failed: ${JSON.stringify(
      loadedExam
    )}`
  ).toBeTruthy();

  expect(
    loadedExam.questions?.[0]?.id,
    "Created question ID is missing."
  ).toBeTruthy();

  return loadedExam;
}

export async function submitExam(
  studentApi,
  exam
) {
  const question =
    exam.questions[0];

  const correctAnswer =
    question.correctAnswer ||
    question.correct_answer;

  const response =
    await studentApi.post(
      "/api/exams/submit",
      {
        data: {
          examId: exam.id,
          examTitle: exam.title,
          score: 100,
          totalPoints: 10,
          earnedPoints: 10,
          passingScore: 60,
          isPassed: true,

          answers: {
            [question.id]:
              correctAnswer,
          },

          feedback: "",
          questionFeedback: {},
          isFeedbackVisible: false,
          releaseScoresImmediately:
            false,
          date:
            new Date().toISOString(),
        },
      }
    );

  const body =
    await response
      .json()
      .catch(() => ({}));

  expect(
    response.ok(),
    `Submission failed with ${response.status()}: ${JSON.stringify(
      body
    )}`
  ).toBeTruthy();

  const submission =
    body.submission ||
    body.data ||
    body;

  expect(
    submission?.id,
    "Created submission ID is missing."
  ).toBeTruthy();

  return submission;
}

export async function deleteExam(
  teacherApi,
  examId
) {
  if (!examId) {
    return;
  }

  const response =
    await teacherApi.delete(
      `/api/exams/${encodeURIComponent(
        examId
      )}`
    );

  expect(
    [200, 204, 404]
  ).toContain(response.status());
}