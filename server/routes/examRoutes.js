import express from "express";
import * as ExamController from "../controllers/examController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { examValidation } from "../middleware/validationMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Teacher / Admin
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authenticate,
    authorize("Teacher", "Admin"),
    examValidation,
    ExamController.createExam
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
| Student
|--------------------------------------------------------------------------
*/

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

router.get(
  "/submissions/student/:studentName",
  authenticate,
  authorize("Student", "Admin"),
  ExamController.getSubmissionsByStudent
);

/*
|--------------------------------------------------------------------------
| Teacher / Admin
|--------------------------------------------------------------------------
*/

router.get(
    "/submissions",
    authenticate,
    authorize("Teacher", "Admin"),
    ExamController.getAllSubmissions
);

router.put(
    "/submissions/:id",
    authenticate,
    authorize("Teacher", "Admin"),
    ExamController.updateSubmissionFeedback
);

/*
|--------------------------------------------------------------------------
| Public Authenticated Routes
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    authenticate,
    ExamController.getAllExams
);

router.get(
    "/:id",
    authenticate,
    ExamController.getExamById
);

export default router;