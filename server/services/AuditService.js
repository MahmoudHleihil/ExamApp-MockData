import { mockDb } from "../data/mockDb.js";
import { randomUUID } from "crypto";

class AuditService {
  async logToolCall({ user, toolName, args, success, error, durationMs }) {
    if (!mockDb.auditLogs) {
      mockDb.auditLogs = [];
    }

    const safeArgs = { ...args };

    delete safeArgs.password;
    delete safeArgs.token;
    delete safeArgs.jwt;
    delete safeArgs.apiKey;

    const log = {
      id: randomUUID(),
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      toolName,
      args: safeArgs,
      success,
      error: error || null,
      durationMs,
      createdAt: new Date().toISOString(),
    };

    mockDb.auditLogs.push(log);

    // console.log("MCP Audit:", log);

    return log;
  }

  async getLogs() {
    return mockDb.auditLogs || [];
  }
}

export default new AuditService();