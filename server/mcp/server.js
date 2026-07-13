import registry from "./registry.js";
import { checkPermission } from "./auth.js";
import AuditService from "../services/AuditService.js";
import ConfirmationService from "../services/ConfirmationService.js";
import MCPAuditService from "../services/MCPAuditService.js";

import ConfirmationManager from "./ConfirmationManager.js";

function isRealConfirmationId(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 10 &&
    !value.includes("confirmation_id") &&
    !value.includes("returned_by_first_call")
  );
}

function cleanFakeValues(args = {}) {
  const fakeValues = [
    "get_my_exams",
    "documentID-returned-by-list_course_materials",
    "confirmation_id_returned_by_first_call",
    "do_delete",
    "none",
    "null",
    "undefined",
  ];

  const cleaned = { ...args };

  for (const key of Object.keys(cleaned)) {
    const value = String(cleaned[key]).trim();

    if (
      fakeValues.includes(value) ||
      value.includes("returned_by") ||
      value.includes("confirmation_id")
    ) {
      delete cleaned[key];
    }
  }

  return cleaned;
}

class MCPServer {
  async execute(toolName, rawArgs, context) {
    const startedAt = Date.now();
    const user = context?.user;

    let args =
      rawArgs &&
      typeof rawArgs === "object" &&
      !Array.isArray(rawArgs)
        ? { ...rawArgs }
        : {};

    let result = null;
    let success = false;
    let executionError = null;

    try {
      const tool = registry.get(toolName);

      if (!tool) {
        const error = new Error(
          `Unknown MCP tool: ${toolName}`
        );

        error.statusCode = 404;
        throw error;
      }

      args = tool.validate(args);

      /*
      * Resolve titles to real database IDs before
      * creating or validating confirmations.
      */
      if (typeof tool.resolveArgs === "function") {
        args = await tool.resolveArgs(
          args,
          context
        );
      }

      if (tool.requiresConfirmation) {
        const confirmationId =
          typeof args.confirmationId === "string"
            ? args.confirmationId.trim()
            : null;

        const actionArgs =
          ConfirmationManager.cleanArgs(args);

        if (!confirmationId) {
          const confirmation =
            await ConfirmationManager.create({
              user,
              toolName,
              args: actionArgs,
            });

          result = {
            success: true,
            requiresConfirmation: true,
            confirmationId:
              confirmation.id,
            expiresAt:
              confirmation.expiresAt,
            toolName,
            action: actionArgs,
            message:
              "Confirmation is required before this action can be completed.",
          };

          success = true;

          return result;
        }

        await ConfirmationManager.verifyAndConsume({
          id: confirmationId,
          userId: user.id,
          toolName,
          args: actionArgs,
        });
      }

      result = await tool.execute(
        args,
        context
      );

      success = true;

      return result;
    } catch (error) {
      executionError = error;
      throw error;
    } finally {
      const audit = await MCPAuditService.log({
        user,
        toolName,
        args,
        result,
        success,
        error: executionError,
        durationMs:
          Date.now() - startedAt,
      });

      console.log("MCP Audit:", audit);
    }
  }
}

export default new MCPServer();