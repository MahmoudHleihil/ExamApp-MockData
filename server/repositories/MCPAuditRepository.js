import pool from "../config/database.js";

class MCPAuditRepository {
  mapAudit(row) {
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      email: row.email,
      role: row.role,
      toolName: row.tool_name,
      args: row.args || {},
      result: row.result,
      success: row.success,
      error: row.error,
      durationMs: row.duration_ms,
      createdAt: row.created_at,
    };
  }

  async create({
    userId = null,
    email = null,
    role = null,
    toolName,
    args = {},
    result = null,
    success,
    error = null,
    durationMs = 0,
  }) {
    const queryResult = await pool.query(
      `
        INSERT INTO mcp_audit_logs (
          user_id,
          email,
          role,
          tool_name,
          args,
          result,
          success,
          error,
          duration_ms
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5::JSONB,
          $6::JSONB,
          $7,
          $8,
          $9
        )
        RETURNING *
      `,
      [
        userId,
        email,
        role,
        toolName,
        JSON.stringify(args || {}),
        result === undefined
          ? null
          : JSON.stringify(result),
        success === true,
        error,
        Math.max(0, Number(durationMs || 0)),
      ]
    );

    return this.mapAudit(queryResult.rows[0]);
  }

  async findAll({
    limit = 100,
    offset = 0,
    toolName,
    userId,
    success,
  } = {}) {
    const conditions = [];
    const values = [];

    if (toolName) {
      values.push(toolName);
      conditions.push(
        `tool_name = $${values.length}`
      );
    }

    if (userId) {
      values.push(userId);
      conditions.push(
        `user_id = $${values.length}`
      );
    }

    if (typeof success === "boolean") {
      values.push(success);
      conditions.push(
        `success = $${values.length}`
      );
    }

    values.push(
      Math.min(
        Math.max(Number(limit || 100), 1),
        500
      )
    );

    const limitParameter =
      `$${values.length}`;

    values.push(
      Math.max(Number(offset || 0), 0)
    );

    const offsetParameter =
      `$${values.length}`;

    const result = await pool.query(
      `
        SELECT *
        FROM mcp_audit_logs
        ${
          conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : ""
        }
        ORDER BY created_at DESC
        LIMIT ${limitParameter}
        OFFSET ${offsetParameter}
      `,
      values
    );

    return result.rows.map((row) =>
      this.mapAudit(row)
    );
  }

  async count() {
    const result = await pool.query(`
      SELECT COUNT(*)::INTEGER AS count
      FROM mcp_audit_logs
    `);

    return result.rows[0].count;
  }

  async deleteOlderThan(days = 90) {
    const safeDays = Math.max(
      Number(days || 90),
      1
    );

    const result = await pool.query(
      `
        DELETE FROM mcp_audit_logs
        WHERE created_at <
          NOW() - ($1 * INTERVAL '1 day')
      `,
      [safeDays]
    );

    return {
      success: true,
      deletedCount: result.rowCount,
    };
  }
}

export default new MCPAuditRepository();