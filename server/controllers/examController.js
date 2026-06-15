import { mockDb } from '../data/mockDb.js';

export const getAllExams = async (req, res) => {
  try {
    res.json(mockDb.exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExamById = async (req, res) => {
  try {
    const exam = mockDb.exams.find(e => e.id === req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createExam = async (req, res) => {
  try {
    const exam = req.body;
    const newExam = {
      ...exam,
      id: Math.random().toString(36).substr(2, 9),
      questions: exam.questions || []
    };
    mockDb.exams.push(newExam);
    res.status(201).json(newExam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const index = mockDb.exams.findIndex(e => e.id === id);
    if (index === -1) return res.status(404).json({ message: 'Exam not found' });
    
    mockDb.exams[index] = { ...req.body, id };
    res.json(mockDb.exams[index]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const index = mockDb.exams.findIndex(e => e.id === id);
    if (index === -1) return res.status(404).json({ message: 'Exam not found' });
    
    mockDb.exams.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitScore = async (req, res) => {
  try {
    const { examId, studentName, answers } = req.body;
    
    // Find the exam to get correct answers
    const exam = mockDb.exams.find(e => e.id === examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Calculate score on the backend
    let totalPoints = 0;
    let earnedPoints = 0;

    exam.questions.forEach(q => {
      totalPoints += q.points;
      const studentAnswer = answers[q.id];
      const correctAnswer = q.correctAnswer;

      if (q.type === 'multiple-response') {
        // For multiple response, check if arrays match (order independent)
        if (Array.isArray(studentAnswer) && Array.isArray(correctAnswer)) {
          const isCorrect = studentAnswer.length === correctAnswer.length && 
                            studentAnswer.every(val => correctAnswer.includes(val));
          if (isCorrect) earnedPoints += q.points;
        }
      } else if (q.type === 'written') {
        // Written answers are usually graded manually, but we can do a simple case-insensitive match for auto-grading
        if (studentAnswer && studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
          earnedPoints += q.points;
        }
      } else {
        // Standard multiple choice or true/false
        if (studentAnswer === correctAnswer) {
          earnedPoints += q.points;
        }
      }
    });

    const finalScore = Math.round((earnedPoints / totalPoints) * 100);

    const scoreData = {
      id: `s${mockDb.studentScores.length + 1}`,
      examId,
      examTitle: exam.title,
      score: finalScore,
      studentName,
      date: new Date().toISOString(),
      answers,
      feedback: '',
      questionFeedback: {},
      isFeedbackVisible: exam.releaseScoresImmediately
    };

    mockDb.studentScores.push(scoreData);
    res.json({ success: true, score: finalScore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllSubmissions = async (req, res) => {
  try {
    res.json(mockDb.studentScores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSubmissionFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, questionFeedback, isFeedbackVisible, score } = req.body;
    const index = mockDb.studentScores.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ message: 'Submission not found' });
    
    mockDb.studentScores[index] = { 
      ...mockDb.studentScores[index], 
      feedback, 
      questionFeedback,
      isFeedbackVisible,
      score: score !== undefined ? score : mockDb.studentScores[index].score
    };
    res.json(mockDb.studentScores[index]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubmissionsByStudent = async (req, res) => {
  try {
    const { studentName } = req.params;
    const submissions = mockDb.studentScores.filter(s => s.studentName === studentName);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
