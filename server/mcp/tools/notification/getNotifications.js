import { z } from "zod";

import MCPTool from "../../tool.js";
import registry from "../../registry.js";

import NotificationService from
  "../../../services/NotificationService.js";

const getNotifications = new MCPTool({
  name: "get_notifications",

  description:
    "Get notifications for the current logged-in user.",

  permissions: [
    "Student",
    "Teacher",
    "Admin",
  ],

  schema: z.object({}),

  openAiSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },

  async execute(args, context) {
    const notifications =
      await NotificationService
        .getNotifications(
          context.user
        );

    return notifications.map(
      (notification) => ({
        id: notification.id,
        title:
          notification.title,
        message:
          notification.message,
        type: notification.type,
        read: notification.read,
        time: notification.time,
      })
    );
  },
});

registry.register(getNotifications);

export default getNotifications;