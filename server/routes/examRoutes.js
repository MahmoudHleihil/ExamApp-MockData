import express from 'express';
import * as examController from '../controllers/examController.js';

const router = express.Router();

router.get('/', examController.getAllExams);
router.get('/:id', examController.getExamById);
router.post('/', examController.createExam);
router.put('/:id', examController.updateExam);
router.delete('/:id', examController.deleteExam);
router.post('/submit', examController.submitScore);
router.get('/submissions/all', examController.getAllSubmissions);
router.put('/submissions/:id', examController.updateSubmissionFeedback);
router.get('/submissions/student/:studentName', examController.getSubmissionsByStudent);

export default router;
