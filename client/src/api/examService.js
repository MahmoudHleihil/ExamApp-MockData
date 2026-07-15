import { mockDb } from './mockDb';
import logger from '../utils/logger';
import { API_CONFIG, getFetchConfig } from './config';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function parseApiResponse(
  response,
  fallbackMessage
) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let data = null;

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    data = await response
      .json()
      .catch(() => null);
  } else {
    data = await response
      .text()
      .catch(() => "");
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (
        typeof data === "string" &&
        data
      ) ||
      fallbackMessage;

    const error =
      new Error(message);

    error.status =
      response.status;

    error.data = data;

    throw error;
  }

  return data;
}

export const examService = {
  getAllExams: async () => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(`${API_CONFIG.baseUrl}/exams`, getFetchConfig());
      if (!response.ok) throw new Error('Failed to fetch exams');
      return await response.json();
    }
    await delay(500);
    return [...mockDb.exams];
  },

  getExamById: async (id) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/exams/${encodeURIComponent(id)}`,
        getFetchConfig()
      );

      const rawBody = await response.text();

      let data;

      try {
        data = rawBody
          ? JSON.parse(rawBody)
          : null;
      } catch {
        data = rawBody;
      }

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          (typeof data === "string"
            ? data
            : null) ||
          `Exam could not be loaded (${response.status})`;

        const error = new Error(message);
        error.status = response.status;
        error.data = data;

        throw error;
      }

      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        throw new Error(
          "The server returned an invalid exam response."
        );
      }

      return data;
    }

    await delay(500);

    const exam =
      mockDb.exams.find(
        (item) => item.id === id
      );

    if (!exam) {
      throw new Error("Exam not found");
    }

    return JSON.parse(
      JSON.stringify(exam)
    );
  },

  getExamForStudent: async (id) => {
    if (!API_CONFIG.useMock) {
      console.log(
        "Loading student exam:",
        `${API_CONFIG.baseUrl}/exams/take/${encodeURIComponent(
          id
        )}`
      );
      const response = await fetch(
        `${API_CONFIG.baseUrl}/exams/take/${encodeURIComponent(
          id
        )}`,
        getFetchConfig()
      );

      return parseApiResponse(
        response,
        "Exam not found"
      );
    }

    await delay(500);

    const exam = mockDb.exams.find(
      (item) => item.id === id
    );

    if (!exam) {
      throw new Error("Exam not found");
    }

    if (
      !exam.published &&
      !exam.isPublished
    ) {
      throw new Error(
        "Exam is not published"
      );
    }

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      timeLimit: exam.timeLimit,
      earlyAccessMinutes:
        exam.earlyAccessMinutes,
      isAlwaysAvailable:
        exam.isAlwaysAvailable,
      scheduledDate:
        exam.scheduledDate,
      passingScore:
        exam.passingScore,
      passwordRequired:
        Boolean(exam.password),

      questions: (
        exam.questions || []
      ).map(
        ({
          correctAnswer,
          sourceEvidence,
          ...question
        }) => question
      ),
    };
  },

  verifyExamPassword: async (
    examId,
    password
  ) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/exams/take/${encodeURIComponent(
          examId
        )}/verify-password`,
        getFetchConfig("POST", {
          password,
        })
      );

      return parseApiResponse(
        response,
        "Failed to verify exam password"
      );
    }

    const exam = mockDb.exams.find(
      (item) => item.id === examId
    );

    if (!exam) {
      throw new Error(
        "Exam not found"
      );
    }

    if (!exam.password) {
      return {
        success: true,
        passwordRequired: false,
      };
    }

    if (
      String(password || "") !==
      String(exam.password)
    ) {
      const error = new Error(
        "Incorrect exam password"
      );

      error.status = 403;
      throw error;
    }

    return {
      success: true,
      passwordRequired: true,
    };
  },

  createExam: async (exam) => {
    if (!API_CONFIG.useMock) {
        const response =
          await fetch(
            `${API_CONFIG.baseUrl}/exams`,
            getFetchConfig(
              "POST",
              exam
            )
          );

        return await parseApiResponse(
          response,
          "Failed to create exam"
        );
    }
    logger.debug('Creating new exam', { title: exam.title, teacherId: exam.teacherId });
    await delay(800);
    const newExam = {
      ...exam,
      id: Math.random().toString(36).substr(2, 9),
      questions: exam.questions || []
    };
    mockDb.exams.push(newExam);
    logger.info('Exam created successfully', { examId: newExam.id, title: newExam.title });
    return newExam;
  },

  updateExam: async (
    id,
    updatedExam
  ) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/exams/${encodeURIComponent(
          id
        )}`,
        getFetchConfig(
          "PUT",
          updatedExam
        )
      );

      return parseApiResponse(
        response,
        "Failed to update exam"
      );
    }

    // mock implementation...
  },

  deleteExam: async (id) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/exams/${encodeURIComponent(
          id
        )}`,
        getFetchConfig("DELETE")
      );

      return parseApiResponse(
        response,
        "Failed to delete exam"
      );
    }

    // mock implementation...
  },

  publishExam: async (id) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/exams/${encodeURIComponent(
          id
        )}`,
        getFetchConfig("PUT", {
          published: true,
        })
      );

      return parseApiResponse(
        response,
        "Failed to publish exam"
      );
    }

    const exam = mockDb.exams.find(
      (item) => item.id === id
    );

    if (!exam) {
      throw new Error("Exam not found");
    }

    exam.published = true;
    exam.isPublished = true;

    return exam;
  },

  submitScore: async ({
    examId,
    answers,
  }) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/exams/submit`,
        getFetchConfig("POST", {
          examId,
          answers,
        })
      );

      return parseApiResponse(
        response,
        "Failed to submit exam"
      );
    }

    throw new Error(
      "Secure server-side grading is unavailable in mock mode."
    );
  },

  // מחזירה את כל ההגשוש
  getAllSubmissions: async () => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(`${API_CONFIG.baseUrl}/exams/submissions`, getFetchConfig());
      if (!response.ok) throw new Error('Failed to fetch submissions');
      return await response.json();
    }
    await delay(500);
    return [...mockDb.studentScores];
  },

  // פונקציה אסינכרונית לעדכון משוב ההגשה
  updateSubmissionFeedback: async (
    submissionId,
    feedback,
    questionFeedback,
    isFeedbackVisible
  ) => {
    const response = await fetch(
      `${API_CONFIG.baseUrl}/exams/submissions/${encodeURIComponent(
        submissionId
      )}`,
      getFetchConfig("PUT", {
        feedback,
        questionFeedback,
        isFeedbackVisible,
      })
    );

    return parseApiResponse(
      response,
      "Failed to update submission feedback"
    );
  },

  // פונקציה אסינכרונית שמחזירה את ההגשות של הסטודנט
  getMySubmissions: async () => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/exams/my-submissions`,
        getFetchConfig()
      );

      const body =
        await parseApiResponse(
          response,
          "Failed to fetch student submissions"
        );

      return Array.isArray(body)
        ? body
        : Array.isArray(
            body?.submissions
          )
          ? body.submissions
          : Array.isArray(
              body?.data
            )
            ? body.data
            : [];
    }

    await delay(500);

    return [...mockDb.studentScores];
  },

  getStudentSubmissionReview: async (submissionId) => {
      if (!API_CONFIG.useMock) {
        const response =
          await fetch(
            `${API_CONFIG.baseUrl}/exams/my-submissions/${encodeURIComponent(
              submissionId
            )}/review`,
            getFetchConfig()
          );

        const body =
          await parseApiResponse(
            response,
            "Failed to load submission review"
          );

        return (
          body?.review ||
          body?.data ||
          body
        );
      }

      throw new Error(
        "Submission review is unavailable in mock mode."
      );
  },

  reviewAiGradingSuggestion: async (
      submissionId,
      questionId,
      reviewData
    ) => {
      if (!API_CONFIG.useMock) {
        const response = await fetch(
          `${API_CONFIG.baseUrl}/exams/submissions/${encodeURIComponent(
            submissionId
          )}/answers/${encodeURIComponent(
            questionId
          )}/ai-review`,
          getFetchConfig(
            "PUT",
            reviewData
          )
        );

        const body =
          await parseApiResponse(
            response,
            "Failed to review AI grading suggestion"
          );

        return (
          body?.submission ||
          body?.data ||
          body
        );
      }

      throw new Error(
        "AI grading review is unavailable in mock mode."
      );
  },
};
