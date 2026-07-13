import "dotenv/config";

import pool, {
  closeDatabase,
} from "../config/database.js";

const users = [
  {
    email: "admin@etest.com",
    passwordHash:
      "$2a$10$TtVDG/.tdNP/vIEScg0pBeDwg3ujMCCp2kdmeLurR/YpOeiGEgKwu",
    role: "Admin",
    fullName: "System Admin",
    status: "active",
    isSuperAdmin: true,
  },
  {
    email: "teacher@etest.com",
    passwordHash:
      "$2a$10$TtVDG/.tdNP/vIEScg0pBeDwg3ujMCCp2kdmeLurR/YpOeiGEgKwu",
    role: "Teacher",
    fullName: "Professor Smith",
    status: "active",
    isSuperAdmin: false,
  },
  {
    email: "student@etest.com",
    passwordHash:
      "$2a$10$TtVDG/.tdNP/vIEScg0pBeDwg3ujMCCp2kdmeLurR/YpOeiGEgKwu",
    role: "Student",
    fullName: "John Doe",
    status: "active",
    isSuperAdmin: false,
  },
];

async function seedUsers() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const user of users) {
      await client.query(
        `
          INSERT INTO users (
            email,
            password_hash,
            role,
            full_name,
            status,
            is_super_admin
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (email)
          DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            full_name = EXCLUDED.full_name,
            status = EXCLUDED.status,
            is_super_admin = EXCLUDED.is_super_admin
        `,
        [
          user.email,
          user.passwordHash,
          user.role,
          user.fullName,
          user.status,
          user.isSuperAdmin,
        ]
      );
    }

    await client.query("COMMIT");

    const result = await client.query(`
      SELECT
        id,
        email,
        role,
        full_name,
        status,
        is_super_admin
      FROM users
      ORDER BY role, email
    `);

    console.log("Users seeded successfully:");
    console.table(result.rows);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("User seeding failed:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    process.exitCode = 1;
  } finally {
    client.release();
  }
}

try {
  await seedUsers();
} finally {
  await closeDatabase();
}