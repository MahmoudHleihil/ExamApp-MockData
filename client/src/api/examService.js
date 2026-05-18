import { mockDb } from './mockDb';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const examService = {
  getAllExams: async () => {
    await delay(500);
    return [...mockDb.exams];
  },

  getExamById: async (id) => {
    await delay(500);
    const exam = mockDb.exams.find(e => e.id === id);
    if (!exam) throw new Error('Exam not found');
    return JSON.parse(JSON.stringify(exam)); // Deep copy to prevent accidental mutations
  },

  createExam: async (exam) => {
    await delay(800);
    const newExam = {
      ...exam,
      id: Math.random().toString(36).substr(2, 9),
      questions: exam.questions || []
    };
    mockDb.exams.push(newExam);
    return newExam;
  },

  updateExam: async (id, updatedExam) => {
    await delay(800);
    const index = mockDb.exams.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Exam not found');
    mockDb.exams[index] = { ...updatedExam, id };
    return mockDb.exams[index];
  },

  deleteExam: async (id) => {
    await delay(500);
    const index = mockDb.exams.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Exam not found');
    mockDb.exams.splice(index, 1);
    return { success: true };
  },

  submitScore: async (scoreData) => {
    await delay(500);
    mockDb.studentScores.push(scoreData);
    return { success: true };
  },
  // מחזירה את כל ההגשוש
  getAllSubmissions: async () => {
    await delay(500);
    return [...mockDb.studentScores];
  },

  // פונקציה אסינכרונית לעדכון משוב ההגשה
  updateSubmissionFeedback: async (submissionId, feedback, questionFeedback, isFeedbackVisible) => {
    await delay(500);
    const index = mockDb.studentScores.findIndex(s => s.id === submissionId);
    if (index === -1) throw new Error('Submission not found');
    mockDb.studentScores[index] = { 
      ...mockDb.studentScores[index], 
      feedback, 
      questionFeedback,
      isFeedbackVisible 
    };
    return mockDb.studentScores[index];
  },

  // פונקציה אסינכרונית שמחזירה את ההגשות של הסטודנט
  getSubmissionsByStudent: async (studentName) => {
    await delay(500);
    return mockDb.studentScores.filter(s => s.studentName === studentName);
  }
};
