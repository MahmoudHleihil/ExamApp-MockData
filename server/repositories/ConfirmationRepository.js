import pool from "../config/database.js";

class ConfirmationRepository {
  mapConfirmation(row) {
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      toolName: row.tool_name,
      args: row.args || {},
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      confirmedAt: row.confirmed_at,
      consumedAt: row.consumed_at,
    };
  }

  async create({
    userId,
    toolName,
    args = {},
    expiresInSeconds = 300,
  }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
          UPDATE mcp_confirmations
          SET status = 'expired'
          WHERE
            user_id = $1
            AND tool_name = $2
            AND status = 'pending'
            AND expires_at <= NOW()
        `,
        [userId, toolName]
      );

      const existing = await client.query(
        `
          SELECT *
          FROM mcp_confirmations
          WHERE
            user_id = $1
            AND tool_name = $2
            AND args = $3::JSONB
            AND status = 'pending'
            AND expires_at > NOW()
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [
          userId,
          toolName,
          JSON.stringify(args || {}),
        ]
      );

      if (existing.rows[0]) {
        await client.query("COMMIT");

        return this.mapConfirmation(
          existing.rows[0]
        );
      }

      const result = await client.query(
        `
          INSERT INTO mcp_confirmations (
            user_id,
            tool_name,
            args,
            expires_at
          )
          VALUES (
            $1,
            $2,
            $3::JSONB,
            NOW() + ($4 * INTERVAL '1 second')
          )
          RETURNING *
        `,
        [
          userId,
          toolName,
          JSON.stringify(args || {}),
          Math.max(
            Number(expiresInSeconds || 300),
            30
          ),
        ]
      );

      await client.query("COMMIT");

      return this.mapConfirmation(
        result.rows[0]
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findLatestPendingForUser(userId) {
    const result = await pool.query(
      `
        SELECT *
        FROM mcp_confirmations
        WHERE
          user_id = $1
          AND status = 'pending'
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId]
    );

    return this.mapConfirmation(result.rows[0]);
  }

  async findValid({
    id,
    userId,
    toolName,
  }) {
    const result = await pool.query(
      `
        SELECT *
        FROM mcp_confirmations
        WHERE
          id = $1
          AND user_id = $2
          AND tool_name = $3
          AND status = 'pending'
          AND expires_at > NOW()
        LIMIT 1
      `,
      [id, userId, toolName]
    );

    return this.mapConfirmation(
      result.rows[0]
    );
  }

  async consume({
    id,
    userId,
    toolName,
  }) {
    const result = await pool.query(
      `
        UPDATE mcp_confirmations
        SET
          status = 'consumed',
          confirmed_at = COALESCE(
            confirmed_at,
            NOW()
          ),
          consumed_at = NOW()
        WHERE
          id = $1
          AND user_id = $2
          AND tool_name = $3
          AND status = 'pending'
          AND expires_at > NOW()
        RETURNING *
      `,
      [id, userId, toolName]
    );

    return this.mapConfirmation(
      result.rows[0]
    );
  }

  async cancel({
    id,
    userId,
  }) {
    const result = await pool.query(
      `
        UPDATE mcp_confirmations
        SET status = 'cancelled'
        WHERE
          id = $1
          AND user_id = $2
          AND status = 'pending'
        RETURNING *
      `,
      [id, userId]
    );

    return this.mapConfirmation(
      result.rows[0]
    );
  }

  async expirePending() {
    const result = await pool.query(`
      UPDATE mcp_confirmations
      SET status = 'expired'
      WHERE
        status = 'pending'
        AND expires_at <= NOW()
      RETURNING id
    `);

    return {
      success: true,
      expiredCount: result.rowCount,
    };
  }

  async listForUser(
    userId,
    limit = 50
  ) {
    const result = await pool.query(
      `
        SELECT *
        FROM mcp_confirmations
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [
        userId,
        Math.min(
          Math.max(Number(limit || 50), 1),
          200
        ),
      ]
    );

    return result.rows.map((row) =>
      this.mapConfirmation(row)
    );
  }
}

export default new ConfirmationRepository();