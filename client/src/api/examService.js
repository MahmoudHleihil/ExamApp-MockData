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

  updateExam: async (id, updatedExam) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(`${API_CONFIG.baseUrl}/exams/${id}`, getFetchConfig('PUT', updatedExam));
      
      return await parseApiResponse(response, "Failed to update exam");
    }
    logger.debug('Updating exam', { examId: id });
    await delay(800);
    const index = mockDb.exams.findIndex(e => e.id === id);
    if (index === -1) {
      logger.error('Update failed: Exam not found', { examId: id });
      throw new Error('Exam not found');
    }
    mockDb.exams[index] = { ...updatedExam, id };
    logger.info('Exam updated successfully', { examId: id });
    return mockDb.exams[index];
  },

  deleteExam: async (id) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(`${API_CONFIG.baseUrl}/exams/${id}`, getFetchConfig('DELETE'));
      
      return await parseApiResponse(response, "Failed to delete exam");
    }
    logger.debug('Deleting exam', { examId: id });
    await delay(500);
    const index = mockDb.exams.findIndex(e => e.id === id);
    if (index === -1) {
      logger.error('Delete failed: Exam not found', { examId: id });
      throw new Error('Exam not found');
    }
    mockDb.exams.splice(index, 1);
    logger.info('Exam deleted successfully', { examId: id });
    return { success: true };
  },

  publishExam: async (id) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/exams/${encodeURIComponent(id)}`,
        getFetchConfig("PUT", {
          published: true,
        })
      );

      const body = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          body?.message ||
          body?.error ||
          "Failed to publish exam"
        );
      }

      return body;
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

  submitScore: async (scoreData) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(`${API_CONFIG.baseUrl}/exams/submit`, getFetchConfig('POST', scoreData));
      if (!response.ok) throw new Error('Failed to submit score');
      return await response.json();
    }
    logger.debug('Submitting exam score', { examId: scoreData.examId, studentName: scoreData.studentName });
    await delay(500);
    mockDb.studentScores.push(scoreData);
    logger.info('Score submitted successfully', { examId: scoreData.examId, studentName: scoreData.studentName, score: scoreData.score });
    return { success: true };
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
  updateSubmissionFeedback: async (submissionId, feedback, questionFeedback, isFeedbackVisible, score) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(`${API_CONFIG.baseUrl}/exams/submissions/${submissionId}`, getFetchConfig('PUT', { feedback, questionFeedback, isFeedbackVisible, score }));
      if (!response.ok) throw new Error('Failed to update submission feedback');
      return await response.json();
    }
    logger.debug('Updating submission feedback', { submissionId });
    await delay(500);
    const index = mockDb.studentScores.findIndex(s => s.id === submissionId);
    if (index === -1) {
      logger.error('Feedback update failed: Submission not found', { submissionId });
      throw new Error('Submission not found');
    }
    mockDb.studentScores[index] = { 
      ...mockDb.studentScores[index], 
      feedback, 
      questionFeedback,
      isFeedbackVisible,
      score: score !== undefined ? score : mockDb.studentScores[index].score
    };
    logger.info('Submission feedback updated successfully', { submissionId, isFeedbackVisible, score });
    return mockDb.studentScores[index];
  },

  // פונקציה אסינכרונית שמחזירה את ההגשות של הסטודנט
  getSubmissionsByStudent: async (studentName) => {
    if (!API_CONFIG.useMock) {
      const response = await fetch(`${API_CONFIG.baseUrl}/exams/submissions/student/${encodeURIComponent(studentName)}`, getFetchConfig());
      return await parseApiResponse( response.json(),
      "Failed to fetch student submissions");
    }
    await delay(500);
    return mockDb.studentScores.filter(s => s.studentName === studentName);
  }
};
