import express from "express";

import {
  authenticate,
  authorize,
} from "../middleware/authMiddleware.js";

import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  getNotifications
);

router.get(
  "/unread",
  getUnreadNotifications
);

router.get(
  "/unread/count",
  getUnreadCount
);

router.post(
  "/",
  authorize("Student", "Teacher", "Admin"),
  createNotification
);

router.patch(
  "/read-all",
  markAllAsRead
);

router.patch(
  "/:id/read",
  markAsRead
);

router.delete(
  "/",
  clearNotifications
);

router.delete(
  "/:id",
  deleteNotification
);

export default router;