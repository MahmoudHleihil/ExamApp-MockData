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
    return { ...exam };
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

  submitScore: async (scoreData) => {
    await delay(500);
    mockDb.studentScores.push(scoreData);
    return { success: true };
  }
};
