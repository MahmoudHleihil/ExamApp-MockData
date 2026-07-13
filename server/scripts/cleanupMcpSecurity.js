import "dotenv/config";

import ConfirmationRepository from
  "../repositories/ConfirmationRepository.js";

import MCPAuditRepository from
  "../repositories/MCPAuditRepository.js";

import { closeDatabase } from
  "../config/database.js";

try {
  const expired =
    await ConfirmationRepository
      .expirePending();

  const deletedLogs =
    await MCPAuditRepository
      .deleteOlderThan(
        Number(
          process.env
            .MCP_AUDIT_RETENTION_DAYS ||
            90
        )
      );

  console.log(
    "MCP security cleanup completed:",
    {
      expiredConfirmations:
        expired.expiredCount,

      deletedAuditLogs:
        deletedLogs.deletedCount,
    }
  );
} catch (error) {
  console.error(
    "MCP security cleanup failed:",
    error
  );

  process.exitCode = 1;
} finally {
  await closeDatabase();
}