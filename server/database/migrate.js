import "dotenv/config";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import pool, {
  closeDatabase,
} from "../config/database.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const migrationsDirectory = path.join(
  currentDirectory,
  "migrations"
);

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations(client) {
  const result = await client.query(`
    SELECT migration_name
    FROM schema_migrations
    ORDER BY migration_name
  `);

  return new Set(
    result.rows.map((row) => row.migration_name)
  );
}

async function runMigration(client, filename) {
  const migrationPath = path.join(
    migrationsDirectory,
    filename
  );

  const sql = fs.readFileSync(
    migrationPath,
    "utf-8"
  );

  console.log(`Running migration: ${filename}`);

  await client.query("BEGIN");

  try {
    await client.query(sql);

    await client.query(
      `
        INSERT INTO schema_migrations (
          migration_name
        )
        VALUES ($1)
      `,
      [filename]
    );

    await client.query("COMMIT");

    console.log(`Migration completed: ${filename}`);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      `Migration failed: ${filename}`,
      {
        message: error.message,
        code: error.code,
        detail: error.detail,
      }
    );

    throw error;
  }
}

async function migrate() {
  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);

    const executed =
      await getExecutedMigrations(client);

    const migrationFiles = fs
      .readdirSync(migrationsDirectory)
      .filter((filename) =>
        filename.endsWith(".sql")
      )
      .sort();

    for (const filename of migrationFiles) {
      if (executed.has(filename)) {
        console.log(
          `Skipping completed migration: ${filename}`
        );

        continue;
      }

      await runMigration(client, filename);
    }

    console.log("All migrations completed.");
  } finally {
    client.release();
  }
}

try {
  await migrate();
} catch (error) {
  console.error(
    "Database migration failed:",
    {
      message: error.message,
      code: error.code,
      detail: error.detail,
    }
  );

  process.exitCode = 1;
} finally {
  await closeDatabase();
}