import { mockDb } from './mockDb';
import logger from '../utils/logger';

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

  submitScore: async (scoreData) => {
    logger.debug('Submitting exam score', { examId: scoreData.examId, studentName: scoreData.studentName });
    await delay(500);
    mockDb.studentScores.push(scoreData);
    logger.info('Score submitted successfully', { examId: scoreData.examId, studentName: scoreData.studentName, score: scoreData.score });
    return { success: true };
  },
  // מחזירה את כל ההגשוש
  getAllSubmissions: async () => {
    await delay(500);
    return [...mockDb.studentScores];
  },

  // פונקציה אסינכרונית לעדכון משוב ההגשה
  updateSubmissionFeedback: async (submissionId, feedback, questionFeedback, isFeedbackVisible) => {
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
      isFeedbackVisible 
    };
    logger.info('Submission feedback updated successfully', { submissionId, isFeedbackVisible });
    return mockDb.studentScores[index];
  },

  // פונקציה אסינכרונית שמחזירה את ההגשות של הסטודנט
  getSubmissionsByStudent: async (studentName) => {
    await delay(500);
    return mockDb.studentScores.filter(s => s.studentName === studentName);
  }
};
