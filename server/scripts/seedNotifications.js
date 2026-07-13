import "dotenv/config";

import pool, {
  closeDatabase,
} from "../config/database.js";

async function seedNotifications() {
  try {
    const adminResult =
      await pool.query(
        `
          SELECT id
          FROM users
          WHERE email = $1
          LIMIT 1
        `,
        ["admin@etest.com"]
      );

    const admin =
      adminResult.rows[0];

    if (!admin) {
      throw new Error(
        "Admin user not found. Seed users first."
      );
    }

    await pool.query(
      `
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          is_read,
          metadata
        )
        SELECT
          $1::UUID,
          $2::VARCHAR(255),
          $3::TEXT,
          $4::VARCHAR(50),
          $5::BOOLEAN,
          $6::JSONB
        WHERE NOT EXISTS (
          SELECT 1
          FROM notifications
          WHERE
            user_id = $1::UUID
            AND title = $2::VARCHAR(255)
            AND type = $4::VARCHAR(50)
        )
      `,
      [
        admin.id,
        "New Teacher Registration",
        "A new teacher has registered and is awaiting approval.",
        "approval",
        false,
        JSON.stringify({
          source: "seed",
        }),
      ]
    );

    const result =
      await pool.query(`
        SELECT
          id,
          user_id,
          target_role,
          title,
          type,
          is_read,
          created_at
        FROM notifications
        ORDER BY created_at DESC
      `);

    console.log(
      "Notifications seeded successfully:"
    );

    console.table(result.rows);
  } catch (error) {
    console.error(
      "Notification seeding failed:",
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
}

await seedNotifications();