import { mockDb } from './mockDb';

// איתחול delay כ- Arrow Function שמייצרת אובייקט promise שמייצג את התוצאה מפעולה אסינכרונית והערך שלה.
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ייצור אובייקט חדש examService עם מתודות שעוזרות בטיפול בכל בקשות המבחנים.
export const examService = {
  // מתודה אסינכרונית שמחזירה את כל המבחנים מהשרת.
  getAllExams: async () => {
    await delay(500);
    return [...mockDb.exams];
  },

  // מתודה אסינכרונית שמבקשת ומחזירה את המבחן לפי Id.
  getExamById: async (id) => {
    await delay(500);
    const exam = mockDb.exams.find(e => e.id === id);
    if (!exam) throw new Error('Exam not found');
    return { ...exam };
  },

  // מתודה אסינכרונית לייצור מבחן חדש.
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

  // מתודה אסינכרונית לשליחת הציון המתקבל במבחן.
  submitScore: async (scoreData) => {
    await delay(500);
    mockDb.studentScores.push(scoreData);
    return { success: true };
  }
};
