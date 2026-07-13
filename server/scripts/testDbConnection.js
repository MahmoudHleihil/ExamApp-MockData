import "dotenv/config";

import {
  testDatabaseConnection,
  closeDatabase,
} from "../config/database.js";

try {
  const result = await testDatabaseConnection();

  console.log("Database connection successful:");
  console.table([result]);
} catch (error) {
  console.error("Database connection failed:", {
    message: error.message,
    code: error.code,
    detail: error.detail,
  });

  process.exitCode = 1;
} finally {
  await closeDatabase();
}