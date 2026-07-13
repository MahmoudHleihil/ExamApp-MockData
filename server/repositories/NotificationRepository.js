import pool from "../config/database.js";

class NotificationRepository {
  mapNotification(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,

      userId: row.user_id,
      role: row.target_role,

      title: row.title,
      message: row.message,
      type: row.type,

      read: row.is_read,
      isRead: row.is_read,
      readAt: row.read_at,

      metadata: row.metadata || {},

      // Compatibility with the existing frontend.
      time: row.created_at,

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id) {
    const result = await pool.query(
      `
        SELECT
          id,
          user_id,
          target_role,
          title,
          message,
          type,
          is_read,
          read_at,
          metadata,
          created_at,
          updated_at
        FROM notifications
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    );

    return this.mapNotification(
      result.rows[0]
    );
  }

  async findForUser(user) {
    const result = await pool.query(
      `
        SELECT
          id,
          user_id,
          target_role,
          title,
          message,
          type,
          is_read,
          read_at,
          metadata,
          created_at,
          updated_at
        FROM notifications
        WHERE
          user_id = $1
          OR (
            user_id IS NULL
            AND target_role = $2
          )
        ORDER BY
          is_read ASC,
          created_at DESC
      `,
      [user.id, user.role]
    );

    return result.rows.map((row) =>
      this.mapNotification(row)
    );
  }

  async findUnreadForUser(user) {
    const result = await pool.query(
      `
        SELECT
          id,
          user_id,
          target_role,
          title,
          message,
          type,
          is_read,
          read_at,
          metadata,
          created_at,
          updated_at
        FROM notifications
        WHERE
          is_read = FALSE
          AND (
            user_id = $1
            OR (
              user_id IS NULL
              AND target_role = $2
            )
          )
        ORDER BY created_at DESC
      `,
      [user.id, user.role]
    );

    return result.rows.map((row) =>
      this.mapNotification(row)
    );
  }

  async create({
    userId = null,
    targetRole = null,
    role = null,
    title,
    message,
    type = "info",
    metadata = {},
  }) {
    const resolvedRole =
      targetRole || role || null;

    if (!userId && !resolvedRole) {
      const error = new Error(
        "Notification requires userId or targetRole"
      );

      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `
        INSERT INTO notifications (
          user_id,
          target_role,
          title,
          message,
          type,
          metadata
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6::JSONB
        )
        RETURNING
          id,
          user_id,
          target_role,
          title,
          message,
          type,
          is_read,
          read_at,
          metadata,
          created_at,
          updated_at
      `,
      [
        userId,
        resolvedRole,
        title,
        message,
        type,
        JSON.stringify(metadata || {}),
      ]
    );

    return this.mapNotification(
      result.rows[0]
    );
  }

  async createForUser(
    userId,
    notification
  ) {
    return this.create({
      ...notification,
      userId,
      targetRole: null,
    });
  }

  async createForRole(
    role,
    notification
  ) {
    return this.create({
      ...notification,
      userId: null,
      targetRole: role,
    });
  }

  async markAsRead(id, user) {
    const result = await pool.query(
      `
        UPDATE notifications
        SET
          is_read = TRUE,
          read_at = COALESCE(
            read_at,
            NOW()
          )
        WHERE
          id = $1
          AND (
            user_id = $2
            OR (
              user_id IS NULL
              AND target_role = $3
            )
          )
        RETURNING
          id,
          user_id,
          target_role,
          title,
          message,
          type,
          is_read,
          read_at,
          metadata,
          created_at,
          updated_at
      `,
      [id, user.id, user.role]
    );

    return this.mapNotification(
      result.rows[0]
    );
  }

  async markAllAsRead(user) {
    const result = await pool.query(
      `
        UPDATE notifications
        SET
          is_read = TRUE,
          read_at = COALESCE(
            read_at,
            NOW()
          )
        WHERE
          is_read = FALSE
          AND (
            user_id = $1
            OR (
              user_id IS NULL
              AND target_role = $2
            )
          )
        RETURNING id
      `,
      [user.id, user.role]
    );

    return {
      success: true,
      updatedCount: result.rowCount,
    };
  }

  async delete(id, user) {
    const result = await pool.query(
      `
        DELETE FROM notifications
        WHERE
          id = $1
          AND (
            user_id = $2
            OR (
              user_id IS NULL
              AND target_role = $3
            )
          )
        RETURNING id
      `,
      [id, user.id, user.role]
    );

    return result.rows[0] || null;
  }

  async deleteAllForUser(user) {
    const result = await pool.query(
      `
        DELETE FROM notifications
        WHERE
          user_id = $1
          OR (
            user_id IS NULL
            AND target_role = $2
          )
      `,
      [user.id, user.role]
    );

    return {
      success: true,
      deletedCount: result.rowCount,
    };
  }

  async countUnread(user) {
    const result = await pool.query(
      `
        SELECT
          COUNT(*)::INTEGER AS count
        FROM notifications
        WHERE
          is_read = FALSE
          AND (
            user_id = $1
            OR (
              user_id IS NULL
              AND target_role = $2
            )
          )
      `,
      [user.id, user.role]
    );

    return result.rows[0].count;
  }

  async countAll() {
    const result = await pool.query(`
      SELECT COUNT(*)::INTEGER AS count
      FROM notifications
    `);

    return result.rows[0].count;
  }

  // Compatibility aliases.
  async getNotifications(user) {
    return this.findForUser(user);
  }

  async add(notification) {
    return this.create(notification);
  }

  async remove(id, user) {
    return this.delete(id, user);
  }
}

export default new NotificationRepository();