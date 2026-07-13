import pool from "../config/database.js";

class UserRepository {
  mapUser(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      password: row.password_hash,
      passwordHash: row.password_hash,
      role: row.role,
      fullName: row.full_name,
      status: row.status,
      isSuperAdmin: row.is_super_admin,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findAll() {
    const result = await pool.query(`
      SELECT
        id,
        email,
        password_hash,
        role,
        full_name,
        status,
        is_super_admin,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    return result.rows.map((row) =>
      this.mapUser(row)
    );
  }

  async findById(id) {
    const result = await pool.query(
      `
        SELECT
          id,
          email,
          password_hash,
          role,
          full_name,
          status,
          is_super_admin,
          created_at,
          updated_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    );

    return this.mapUser(result.rows[0]);
  }

  async findByEmail(email) {
    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const result = await pool.query(
      `
        SELECT
          id,
          email,
          password_hash,
          role,
          full_name,
          status,
          is_super_admin,
          created_at,
          updated_at
        FROM users
        WHERE LOWER(email) = $1
        LIMIT 1
      `,
      [normalizedEmail]
    );

    return this.mapUser(result.rows[0]);
  }

  async create({
    email,
    passwordHash,
    password,
    role,
    fullName,
    status = "active",
    isSuperAdmin = false,
  }) {
    const result = await pool.query(
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
        RETURNING
          id,
          email,
          password_hash,
          role,
          full_name,
          status,
          is_super_admin,
          created_at,
          updated_at
      `,
      [
        String(email).trim().toLowerCase(),
        passwordHash || password,
        role,
        fullName,
        status,
        isSuperAdmin,
      ]
    );

    return this.mapUser(result.rows[0]);
  }

  async update(id, updates = {}) {
    const allowedFields = {
      email: "email",
      passwordHash: "password_hash",
      password: "password_hash",
      role: "role",
      fullName: "full_name",
      status: "status",
      isSuperAdmin: "is_super_admin",
    };

    const assignments = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      const column = allowedFields[key];

      if (!column || value === undefined) {
        continue;
      }

      values.push(
        key === "email"
          ? String(value).trim().toLowerCase()
          : value
      );

      assignments.push(
        `${column} = $${values.length}`
      );
    }

    if (assignments.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await pool.query(
      `
        UPDATE users
        SET ${assignments.join(", ")}
        WHERE id = $${values.length}
        RETURNING
          id,
          email,
          password_hash,
          role,
          full_name,
          status,
          is_super_admin,
          created_at,
          updated_at
      `,
      values
    );

    return this.mapUser(result.rows[0]);
  }

  async delete(id) {
    const result = await pool.query(
      `
        DELETE FROM users
        WHERE id = $1
        RETURNING
          id,
          email,
          role,
          full_name,
          status,
          is_super_admin,
          created_at,
          updated_at
      `,
      [id]
    );

    return this.mapUser(result.rows[0]);
  }

  async count() {
    const result = await pool.query(`
      SELECT COUNT(*)::INTEGER AS count
      FROM users
    `);

    return result.rows[0].count;
  }

  async countByRole() {
    const result = await pool.query(`
      SELECT
        role,
        COUNT(*)::INTEGER AS count
      FROM users
      GROUP BY role
      ORDER BY role
    `);

    return result.rows.reduce(
      (counts, row) => {
        counts[row.role] = row.count;
        return counts;
      },
      {}
    );
  }
}

export default new UserRepository();