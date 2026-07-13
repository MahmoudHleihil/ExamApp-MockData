import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from server/.env");
}

const useSsl = process.env.DB_SSL === "true";

const pool = new Pool({
  connectionString: databaseUrl,

  max: Number(process.env.DB_POOL_MAX || 10),

  idleTimeoutMillis: Number(
    process.env.DB_IDLE_TIMEOUT_MS || 30000
  ),

  connectionTimeoutMillis: Number(
    process.env.DB_CONNECTION_TIMEOUT_MS || 5000
  ),

  ssl: useSsl
    ? {
        rejectUnauthorized: true,
      }
    : false,
});

pool.on("connect", () => {
  console.log("PostgreSQL client connected");
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", {
    message: error.message,
    code: error.code,
  });
});

export async function testDatabaseConnection() {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        NOW() AS connected_at
    `);

    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function closeDatabase() {
  await pool.end();
}

export default pool;