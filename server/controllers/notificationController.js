import NotificationService from
  "../services/NotificationService.js";

export const getNotifications = async (
  req,
  res,
  next
) => {
  try {
    const notifications =
      await NotificationService
        .getNotifications(req.user);

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const getUnreadNotifications =
  async (req, res, next) => {
    try {
      const notifications =
        await NotificationService
          .getUnreadNotifications(
            req.user
          );

      res.json(notifications);
    } catch (error) {
      next(error);
    }
  };

export const getUnreadCount = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await NotificationService
        .getUnreadCount(req.user);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (
  req,
  res,
  next
) => {
  try {
    const notification =
      await NotificationService
        .createNotification(
          req.body,
          req.user
        );

    res.status(201).json(
      notification
    );
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req,
  res,
  next
) => {
  try {
    const notification =
      await NotificationService
        .markAsRead(
          req.params.id,
          req.user
        );

    res.json(notification);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await NotificationService
        .markAllAsRead(req.user);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await NotificationService
        .deleteNotification(
          req.params.id,
          req.user
        );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const clearNotifications = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await NotificationService
        .clearNotifications(
          req.user
        );

    res.json(result);
  } catch (error) {
    next(error);
  }
};