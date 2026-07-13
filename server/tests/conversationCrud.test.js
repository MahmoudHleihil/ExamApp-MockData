import "./bootstrap.js";

import test, {
  after,
} from "node:test";

import assert from "node:assert/strict";

const {
  default: ConversationService,
} = await import(
  "../services/ConversationService.js"
);

const {
  default: pool,
} = await import(
  "../config/database.js"
);

const {
  createTestTeacher,
  cleanupTestUser,
} = await import(
  "./helpers/databaseTestUtils.js"
);

test(
  "conversation CRUD persists correctly",
  async () => {
    const teacher =
      await createTestTeacher();

    try {
      const created =
        await ConversationService
          .createConversation(
            teacher,
            {
              title:
                "PostgreSQL Test Chat",
            }
          );

      assert.ok(created.id);

      assert.equal(
        created.userId,
        teacher.id
      );

      assert.equal(
        created.title,
        "PostgreSQL Test Chat"
      );

      const listed =
        await ConversationService
          .listConversations(
            teacher
          );

      assert.equal(
        listed.length,
        1
      );

      assert.equal(
        listed[0].id,
        created.id
      );

      assert.equal(
        listed[0].messageCount,
        0
      );

      const userMessage =
        await ConversationService
          .addMessage(
            teacher,
            created.id,
            {
              role: "user",
              content:
                "Show me my exams",
            }
          );

      assert.equal(
        userMessage.role,
        "user"
      );

      const assistantMessage =
        await ConversationService
          .addMessage(
            teacher,
            created.id,
            {
              role: "assistant",
              content:
                "Here are your exams.",
            }
          );

      assert.equal(
        assistantMessage.role,
        "assistant"
      );

      await ConversationService
        .saveToolResult(
          teacher,
          created.id,
          "get_my_exams",
          {
            success: true,
            exams: [],
          }
        );

      const loaded =
        await ConversationService
          .getConversation(
            created.id,
            teacher
          );

      assert.equal(
        loaded.messages.length,
        2
      );

      assert.equal(
        loaded.messages[0]
          .content,
        "Show me my exams"
      );

      assert.equal(
        loaded.messages[1]
          .content,
        "Here are your exams."
      );

      assert.equal(
        loaded.lastToolResults
          .length,
        1
      );

      assert.equal(
        loaded.lastToolResults[0]
          .toolName,
        "get_my_exams"
      );

      const renamed =
        await ConversationService
          .renameConversation(
            teacher,
            created.id,
            "Renamed Test Chat"
          );

      assert.equal(
        renamed.title,
        "Renamed Test Chat"
      );

      const afterRename =
        await ConversationService
          .getConversation(
            created.id,
            teacher
          );

      assert.equal(
        afterRename.title,
        "Renamed Test Chat"
      );

      const cleared =
        await ConversationService
          .clearConversation(
            teacher,
            created.id
          );

      assert.equal(
        cleared.success,
        true
      );

      const afterClear =
        await ConversationService
          .getConversation(
            created.id,
            teacher
          );

      assert.equal(
        afterClear.messages.length,
        0
      );

      assert.equal(
        afterClear.lastToolResults
          .length,
        0
      );

      const deleted =
        await ConversationService
          .deleteConversation(
            teacher,
            created.id
          );

      assert.equal(
        deleted.success,
        true
      );

      const afterDelete =
        await ConversationService
          .listConversations(
            teacher
          );

      assert.equal(
        afterDelete.length,
        0
      );

      await assert.rejects(
        () =>
          ConversationService
            .getConversation(
              created.id,
              teacher
            ),
        (error) => {
          assert.equal(
            error.statusCode,
            404
          );

          assert.match(
            error.message,
            /conversation not found/i
          );

          return true;
        }
      );
    } finally {
      await cleanupTestUser(
        teacher.id
      );
    }
  }
);

test(
  "a user cannot access another user's conversation",
  async () => {
    const owner =
      await createTestTeacher();

    const otherUser =
      await createTestTeacher();

    try {
      const conversation =
        await ConversationService
          .createConversation(
            owner,
            {
              title:
                "Private Conversation",
            }
          );

      await assert.rejects(
        () =>
          ConversationService
            .getConversation(
              conversation.id,
              otherUser
            ),
        (error) => {
          assert.equal(
            error.statusCode,
            404
          );

          return true;
        }
      );

      await assert.rejects(
        () =>
          ConversationService
            .renameConversation(
              otherUser,
              conversation.id,
              "Unauthorized Rename"
            ),
        (error) => {
          assert.equal(
            error.statusCode,
            404
          );

          return true;
        }
      );

      await assert.rejects(
        () =>
          ConversationService
            .deleteConversation(
              otherUser,
              conversation.id
            ),
        (error) => {
          assert.equal(
            error.statusCode,
            404
          );

          return true;
        }
      );

      const ownerConversation =
        await ConversationService
          .getConversation(
            conversation.id,
            owner
          );

      assert.equal(
        ownerConversation.title,
        "Private Conversation"
      );
    } finally {
      await cleanupTestUser(
        owner.id
      );

      await cleanupTestUser(
        otherUser.id
      );
    }
  }
);

test(
  "new conversation title updates from first user message",
  async () => {
    const teacher =
      await createTestTeacher();

    try {
      const conversation =
        await ConversationService
          .createConversation(
            teacher
          );

      assert.equal(
        conversation.title,
        "New conversation"
      );

      await ConversationService
        .addMessage(
          teacher,
          conversation.id,
          {
            role: "user",
            content:
              "Generate a React hooks exam from my uploaded material",
          }
        );

      const updated =
        await ConversationService
          .getConversation(
            conversation.id,
            teacher
          );
      const firstMessage = "Generate a React hooks exam from my uploaded material";

      assert.equal(
        updated.title,
        firstMessage.slice(0, 50)
      );
    } finally {
      await cleanupTestUser(
        teacher.id
      );
    }
  }
);

test(
  "conversation message history is limited for AI context",
  async () => {
    const teacher =
      await createTestTeacher();

    try {
      const conversation =
        await ConversationService
          .createConversation(
            teacher,
            {
              title:
                "History Limit Test",
            }
          );

      for (
        let index = 0;
        index < 40;
        index += 1
      ) {
        await ConversationService
          .addMessage(
            teacher,
            conversation.id,
            {
              role:
                index % 2 === 0
                  ? "user"
                  : "assistant",

              content:
                `Message ${index}`,
            }
          );
      }

      const contextMessages =
        await ConversationService
          .getMessages(
            teacher,
            conversation.id
          );

      assert.equal(
        contextMessages.length,
        30
      );

      assert.equal(
        contextMessages[0]
          .content,
        "Message 10"
      );

      assert.equal(
        contextMessages[29]
          .content,
        "Message 39"
      );
    } finally {
      await cleanupTestUser(
        teacher.id
      );
    }
  }
);

after(async () => {
  await pool.end();
});