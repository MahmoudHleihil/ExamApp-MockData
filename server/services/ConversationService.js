import pool from "../config/database.js";

const MAX_MESSAGES = 30;
const MAX_TOOL_RESULTS = 10;

class ConversationService {
  mapConversation(row, messages = [], toolResults = []) {
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      messages,
      lastToolResults: toolResults,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async createConversation(user, data = {}) {
    const result = await pool.query(
      `
        INSERT INTO conversations (
          user_id,
          title
        )
        VALUES ($1, $2)
        RETURNING *
      `,
      [
        user.id,
        data.title?.trim() || "New conversation",
      ]
    );

    return this.mapConversation(result.rows[0]);
  }

  async listConversations(user) {
    const result = await pool.query(
      `
        SELECT
          c.id,
          c.user_id,
          c.title,
          c.created_at,
          c.updated_at,
          COUNT(m.id)::INTEGER AS message_count
        FROM conversations c
        LEFT JOIN conversation_messages m
          ON m.conversation_id = c.id
        WHERE c.user_id = $1
        GROUP BY c.id
        ORDER BY c.updated_at DESC
      `,
      [user.id]
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      messageCount: row.message_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getConversation(conversationId, user) {
    const result = await pool.query(
      `
        SELECT *
        FROM conversations
        WHERE id = $1
          AND user_id = $2
        LIMIT 1
      `,
      [conversationId, user.id]
    );

    const row = result.rows[0];

    if (!row) {
      const error = new Error("Conversation not found");
      error.statusCode = 404;
      throw error;
    }

    const messagesResult = await pool.query(
      `
        SELECT
          id,
          role,
          content,
          incomplete,
          created_at
        FROM conversation_messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC
      `,
      [conversationId]
    );

    const toolResultsResult = await pool.query(
      `
        SELECT
          id,
          tool_name,
          result,
          created_at
        FROM conversation_tool_results
        WHERE conversation_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [conversationId, MAX_TOOL_RESULTS]
    );

    const messages = messagesResult.rows.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      incomplete: message.incomplete,
      createdAt: message.created_at,
    }));

    const toolResults = toolResultsResult.rows.map((item) => ({
      id: item.id,
      toolName: item.tool_name,
      result: item.result,
      createdAt: item.created_at,
    }));

    return this.mapConversation(
      row,
      messages,
      toolResults
    );
  }

  async getOrCreateConversation(user, conversationId) {
    if (conversationId) {
      return this.getConversation(conversationId, user);
    }

    return this.createConversation(user);
  }

  async getMessages(user, conversationId) {
    const conversation =
      await this.getConversation(conversationId, user);

    return conversation.messages.slice(-MAX_MESSAGES);
  }

  async addMessage(user, conversationId, message) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const ownerResult = await client.query(
        `
          SELECT id, title
          FROM conversations
          WHERE id = $1
            AND user_id = $2
          FOR UPDATE
        `,
        [conversationId, user.id]
      );

      const conversation = ownerResult.rows[0];

      if (!conversation) {
        const error = new Error("Conversation not found");
        error.statusCode = 404;
        throw error;
      }

      const messageResult = await client.query(
        `
          INSERT INTO conversation_messages (
            conversation_id,
            role,
            content,
            incomplete
          )
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `,
        [
          conversationId,
          message.role,
          String(message.content || ""),
          message.incomplete === true,
        ]
      );

      let nextTitle = conversation.title;

      if (
        conversation.title === "New conversation" &&
        message.role === "user" &&
        String(message.content || "").trim()
      ) {
        nextTitle = String(message.content)
          .trim()
          .slice(0, 50);
      }

      await client.query(
        `
          UPDATE conversations
          SET
            title = $1,
            updated_at = NOW()
          WHERE id = $2
        `,
        [nextTitle, conversationId]
      );

      await client.query("COMMIT");

      return {
        id: messageResult.rows[0].id,
        role: messageResult.rows[0].role,
        content: messageResult.rows[0].content,
        incomplete: messageResult.rows[0].incomplete,
        createdAt: messageResult.rows[0].created_at,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async saveToolResult(
    user,
    conversationId,
    toolName,
    result
  ) {
    const owner = await pool.query(
      `
        SELECT id
        FROM conversations
        WHERE id = $1
          AND user_id = $2
        LIMIT 1
      `,
      [conversationId, user.id]
    );

    if (!owner.rows[0]) {
      const error = new Error("Conversation not found");
      error.statusCode = 404;
      throw error;
    }

    const insertResult = await pool.query(
      `
        INSERT INTO conversation_tool_results (
          conversation_id,
          tool_name,
          result
        )
        VALUES ($1, $2, $3::JSONB)
        RETURNING *
      `,
      [
        conversationId,
        toolName,
        JSON.stringify(result ?? {}),
      ]
    );

    await pool.query(
      `
        UPDATE conversations
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [conversationId]
    );

    return {
      id: insertResult.rows[0].id,
      toolName: insertResult.rows[0].tool_name,
      result: insertResult.rows[0].result,
      createdAt: insertResult.rows[0].created_at,
    };
  }

  async renameConversation(user, conversationId, title) {
    const cleanTitle = title?.trim();

    if (!cleanTitle) {
      const error = new Error("Conversation title is required");
      error.statusCode = 400;
      throw error;
    }

    const result = await pool.query(
      `
        UPDATE conversations
        SET
          title = $1,
          updated_at = NOW()
        WHERE id = $2
          AND user_id = $3
        RETURNING *
      `,
      [
        cleanTitle.slice(0, 80),
        conversationId,
        user.id,
      ]
    );

    if (!result.rows[0]) {
      const error = new Error("Conversation not found");
      error.statusCode = 404;
      throw error;
    }

    return this.mapConversation(result.rows[0]);
  }

  async clearConversation(user, conversationId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const owner = await client.query(
        `
          SELECT id
          FROM conversations
          WHERE id = $1
            AND user_id = $2
          FOR UPDATE
        `,
        [conversationId, user.id]
      );

      if (!owner.rows[0]) {
        const error = new Error("Conversation not found");
        error.statusCode = 404;
        throw error;
      }

      await client.query(
        `
          DELETE FROM conversation_messages
          WHERE conversation_id = $1
        `,
        [conversationId]
      );

      await client.query(
        `
          DELETE FROM conversation_tool_results
          WHERE conversation_id = $1
        `,
        [conversationId]
      );

      await client.query(
        `
          UPDATE conversations
          SET updated_at = NOW()
          WHERE id = $1
        `,
        [conversationId]
      );

      await client.query("COMMIT");

      return {
        success: true,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteConversation(user, conversationId) {
    const result = await pool.query(
      `
        DELETE FROM conversations
        WHERE id = $1
          AND user_id = $2
        RETURNING id
      `,
      [conversationId, user.id]
    );

    if (!result.rows[0]) {
      const error = new Error("Conversation not found");
      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      conversationId: result.rows[0].id,
    };
  }
}

export default new ConversationService();