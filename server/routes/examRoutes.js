import express from 'express';
import * as examController from '../controllers/examController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { examValidation } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Publicly authenticated routes (any role)
router.get('/', authenticate, examController.getAllExams);
router.get('/:id', authenticate, examController.getExamById);

// Teacher & Admin only
router.post('/', authenticate, authorize('Teacher', 'Admin'), examValidation, examController.createExam);
router.put('/:id', authenticate, authorize('Teacher', 'Admin'), examController.updateExam);
router.delete('/:id', authenticate, authorize('Teacher', 'Admin'), examController.deleteExam);

// Student only
router.post('/submit', authenticate, authorize('Student'), examController.submitScore);
router.get('/submissions/student/:studentName', authenticate, authorize('Student', 'Admin'), examController.getSubmissionsByStudent);

// Submissions management (Teacher & Admin)
router.get('/submissions/all', authenticate, authorize('Teacher', 'Admin'), examController.getAllSubmissions);
router.put('/submissions/:id', authenticate, authorize('Teacher', 'Admin'), examController.updateSubmissionFeedback);

export default router;
