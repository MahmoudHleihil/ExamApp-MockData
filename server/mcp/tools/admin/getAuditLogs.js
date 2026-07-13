import { z } from "zod";

import MCPTool from "../../tool.js";
import registry from "../../registry.js";

import MCPAuditService from
  "../../../services/MCPAuditService.js";

const getAuditLogs = new MCPTool({
  name: "get_audit_logs",

  description:
    "Get recent MCP AI tool audit logs. Admin only.",

  permissions: ["Admin"],

  schema: z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(200)
      .default(50),

    toolName: z.string().optional(),

    success: z
      .preprocess(
        (value) => {
          if (value === "true") return true;
          if (value === "false") return false;
          return value;
        },
        z.boolean().optional()
      ),
  }),

  openAiSchema: {
    type: "object",
    properties: {
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 200,
      },

      toolName: {
        type: "string",
      },

      success: {
        type: "boolean",
      },
    },

    additionalProperties: false,
  },

  async execute(args) {
    return MCPAuditService.getLogs({
      limit: args.limit,
      toolName: args.toolName,
      success: args.success,
    });
  },
});

registry.register(getAuditLogs);

export default getAuditLogs;