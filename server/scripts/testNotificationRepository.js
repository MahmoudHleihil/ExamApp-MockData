import "dotenv/config";

import UserRepository from
  "../repositories/UserRepository.js";

import NotificationRepository from
  "../repositories/NotificationRepository.js";

import { closeDatabase } from
  "../config/database.js";

try {
  const admin =
    await UserRepository.findByEmail(
      "admin@etest.com"
    );

  if (!admin) {
    throw new Error(
      "Admin user not found"
    );
  }

  const notifications =
    await NotificationRepository
      .findForUser(admin);

  console.log(
    "Admin notifications:"
  );

  console.dir(notifications, {
    depth: 5,
  });

  const unreadCount =
    await NotificationRepository
      .countUnread(admin);

  console.log(
    "Unread notifications:",
    unreadCount
  );
} catch (error) {
  console.error(
    "Notification repository test failed:",
    error
  );

  process.exitCode = 1;
} finally {
  await closeDatabase();
}