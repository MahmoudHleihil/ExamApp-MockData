import NotificationRepository from
  "../repositories/NotificationRepository.js";

class NotificationService {
  async getNotifications(user) {
    this.requireUser(user);

    return NotificationRepository
      .findForUser(user);
  }

  async getUnreadNotifications(user) {
    this.requireUser(user);

    return NotificationRepository
      .findUnreadForUser(user);
  }

  async getUnreadCount(user) {
    this.requireUser(user);

    return {
      count:
        await NotificationRepository
          .countUnread(user),
    };
  }

  async createNotification(
    notification,
    actor
  ) {
    this.requireUser(actor);

    if (
      !["Student", "Teacher", "Admin"].includes(
        actor.role
      )
    ) {
      const error = new Error(
        "Only students, teachers and admins can create notifications"
      );

      error.statusCode = 403;
      throw error;
    }

    return NotificationRepository.create({
      userId:
        notification.userId || null,

      targetRole:
        notification.targetRole ||
        notification.role ||
        null,

      title: notification.title,
      message: notification.message,
      type:
        notification.type || "info",

      metadata:
        notification.metadata || {},
    });
  }

  async createForUser(
    userId,
    notification
  ) {
    if (!userId) {
      const error = new Error(
        "userId is required"
      );

      error.statusCode = 400;
      throw error;
    }

    return NotificationRepository
      .createForUser(
        userId,
        notification
      );
  }

  async createForRole(
    role,
    notification
  ) {
    const allowedRoles = [
      "Student",
      "Teacher",
      "Admin",
    ];

    if (!allowedRoles.includes(role)) {
      const error = new Error(
        "Invalid target role"
      );

      error.statusCode = 400;
      throw error;
    }

    return NotificationRepository
      .createForRole(
        role,
        notification
      );
  }

  async markAsRead(
    notificationId,
    user
  ) {
    this.requireUser(user);

    const notification =
      await NotificationRepository
        .markAsRead(
          notificationId,
          user
        );

    if (!notification) {
      const error = new Error(
        "Notification not found"
      );

      error.statusCode = 404;
      throw error;
    }

    return notification;
  }

  async markAllRead(user) {
    this.requireUser(user);

    return NotificationRepository
      .markAllAsRead(user);
  }

  async markAllAsRead(user) {
    return this.markAllRead(user);
  }

  async deleteNotification(
    notificationId,
    user
  ) {
    this.requireUser(user);

    const deleted =
      await NotificationRepository
        .delete(
          notificationId,
          user
        );

    if (!deleted) {
      const error = new Error(
        "Notification not found"
      );

      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      notificationId:
        deleted.id,
    };
  }

  async clearNotifications(user) {
    this.requireUser(user);

    return NotificationRepository
      .deleteAllForUser(user);
  }

  requireUser(user) {
    if (!user?.id || !user?.role) {
      const error = new Error(
        "Authentication required"
      );

      error.statusCode = 401;
      throw error;
    }
  }
}

export default new NotificationService();