import MCPAuditRepository from
  "../repositories/MCPAuditRepository.js";

class MCPAuditService {
  async log({
    user,
    toolName,
    args,
    result = null,
    success,
    error = null,
    durationMs = 0,
  }) {
    try {
      return await MCPAuditRepository.create({
        userId: user?.id || null,
        email: user?.email || null,
        role: user?.role || null,
        toolName,
        args: this.redactArgs(args),
        result: this.redactResult(result),
        success,
        error:
          error instanceof Error
            ? error.message
            : error || null,
        durationMs,
      });
    } catch (auditError) {
      console.error(
        "Failed to persist MCP audit log:",
        {
          toolName,
          message: auditError.message,
        }
      );

      return null;
    }
  }

  redactArgs(args = {}) {
    const sensitiveFields = new Set([
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
      "apiKey",
      "secret",
      "confirmationId",
    ]);

    return this.redactObject(
      args,
      sensitiveFields
    );
  }

  redactResult(result) {
    const sensitiveFields = new Set([
      "password",
      "passwordHash",
      "correctAnswer",
      "sourceEvidence",
      "token",
      "accessToken",
      "refreshToken",
      "apiKey",
      "secret",
    ]);

    return this.redactObject(
      result,
      sensitiveFields
    );
  }

  redactObject(value, sensitiveFields) {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((item) =>
        this.redactObject(
          item,
          sensitiveFields
        )
      );
    }

    if (
      value === null ||
      typeof value !== "object"
    ) {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value).map(
        ([key, nestedValue]) => [
          key,
          sensitiveFields.has(key)
            ? "[REDACTED]"
            : this.redactObject(
                nestedValue,
                sensitiveFields
              ),
        ]
      )
    );
  }

  async getLogs(filters = {}) {
    return MCPAuditRepository.findAll(
      filters
    );
  }
}

export default new MCPAuditService();