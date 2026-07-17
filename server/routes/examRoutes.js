import express from "express";
import * as ExamController from "../controllers/examController.js";

import {
  authenticate,
  authorize,
} from "../middleware/authMiddleware.js";

import {
  examPasswordLimiter,
} from "../middleware/examPasswordLimiter.js";

import {
  examValidation,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Teacher / Admin exam management
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  authorize("Teacher", "Admin"),
  examValidation,
  ExamController.createExam
);

/*
 * Keep this endpoint because the existing teacher
 * frontend requests GET /api/exams.
 */
router.get(
  "/",
  authenticate,
  authorize("Teacher", "Admin"),
  ExamController.getAllExams
);

router.get(
  "/manage",
  authenticate,
  authorize("Teacher", "Admin"),
  ExamController.getAllExams
);

router.get(
  "/manage/:id",
  authenticate,
  authorize("Teacher", "Admin"),
  ExamController.getExamById
);

router.put(
  "/:id",
  authenticate,
  authorize("Teacher", "Admin"),
  ExamController.updateExam
);

router.delete(
  "/:id",
  authenticate,
  authorize("Teacher", "Admin"),
  ExamController.deleteExam
);

/*
|--------------------------------------------------------------------------
| Student exam access
|--------------------------------------------------------------------------
*/

router.get(
  "/available",
  authenticate,
  authorize("Student"),
  ExamController.getAvailableExams
);

router.post(
  "/take/:id/verify-password",
  authenticate,
  authorize("Student"),
  examPasswordLimiter,
  ExamController.verifyExamPassword
);

router.get(
  "/take/:id",
  authenticate,
  authorize("Student"),
  ExamController.getExamForStudent
);

router.post(
  "/submit",
  authenticate,
  authorize("Student"),
  ExamController.submitScore
);

router.get(
  "/my-submissions",
  authenticate,
  authorize("Student"),
  ExamController.getStudentSubmissions
);

/*
|--------------------------------------------------------------------------
| Teacher / Admin submissions
|--------------------------------------------------------------------------
*/

router.get(
  "/submissions",
  authenticate,
  authorize("Teacher", "Admin"),
  ExamController.getAllSubmissions
);

router.put(
  "/submissions/:submissionId/answers/:questionId/grade",
  authenticate,
  authorize(
    "Teacher",
    "Admin"
  ),
  ExamController.gradeWrittenAnswer
);

router.put(
  "/submissions/:id",
  authenticate,
  authorize("Teacher", "Admin"),
  ExamController.updateSubmissionFeedback
);

/*
|--------------------------------------------------------------------------
| Existing teacher exam-detail endpoint
|--------------------------------------------------------------------------
|
| Your current teacher frontend requests GET /api/exams/:id.
| Restrict this endpoint so students cannot receive correct answers.
*/
router.get(
  "/my-submissions/:submissionId/review",
  authenticate,
  authorize("Student"),
  ExamController.getStudentSubmissionReview
);

router.put(
  "/submissions/:submissionId/answers/:questionId/ai-review",
  authenticate,
  authorize("Teacher", "Admin"),
  ExamController.reviewAiGradingSuggestion
);

router.get(
  "/:id",
  authenticate,
  authorize("Teacher", "Admin"),
  ExamController.getExamById
);

export default router;