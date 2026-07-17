import express from "express";

import {
  authenticate,
  authorize,
} from "../middleware/authMiddleware.js";

import SubmissionRepository from "../repositories/SubmissionRepository.js";

const router = express.Router();

router.put(
  "/submissions/:submissionId/answers/:questionId/ai-suggestion",
  authenticate,
  authorize("Teacher", "Admin"),
  async (req, res, next) => {
    try {
      const answer =
        await SubmissionRepository.updateAiGradingSuggestion(
          req.params.submissionId,
          req.params.questionId,
          req.body
        );

      res.json({
        success: true,
        answer,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;