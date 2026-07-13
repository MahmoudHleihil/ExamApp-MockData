import express from "express";
import {
  streamChat,
  createConversation,
  listConversations,
  getConversation,
  renameConversation,
  clearConversation,
  deleteConversation,
} from "../controllers/chatController.js";

import {
  authenticate,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/conversations",
  listConversations
);

router.post(
  "/conversations",
  createConversation
);

router.get(
  "/conversations/:id",
  getConversation
);

router.patch(
  "/conversations/:id",
  renameConversation
);

router.delete(
  "/conversations/:id/messages",
  clearConversation
);

router.delete(
  "/conversations/:id",
  deleteConversation
);

router.post(
  "/stream",
  streamChat
);

export default router;