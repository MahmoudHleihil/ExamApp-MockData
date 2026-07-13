import AIService from "../services/AIService.js";
import ConversationService from "../services/ConversationService.js";
import { createContext } from "../mcp/context.js";
import {
  initializeSSE,
  sendSSE,
} from "../utils/sse.js";

export const createConversation = async (
  req,
  res,
  next
) => {
  try {
    const conversation =
      await ConversationService.createConversation(
        req.user,
        req.body
      );

    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

export const listConversations = async (
  req,
  res,
  next
) => {
  try {
    const conversations =
      await ConversationService.listConversations(
        req.user
      );

    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (
  req,
  res,
  next
) => {
  try {
    const conversation =
      await ConversationService.getConversation(
        req.params.id,
        req.user
      );

    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

export const renameConversation = async (
  req,
  res,
  next
) => {
  try {
    const conversation =
      await ConversationService.renameConversation(
        req.user,
        req.params.id,
        req.body.title
      );

    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

export const clearConversation = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await ConversationService.clearConversation(
        req.user,
        req.params.id
      );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await ConversationService.deleteConversation(
        req.user,
        req.params.id
      );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const streamChat = async (
  req,
  res
) => {
  initializeSSE(res);

  const message =
    req.body?.message?.trim();

  if (!message) {
    sendSSE(res, "error", {
      message: "Message is required.",
    });

    return res.end();
  }

  const context = createContext(req);

  let conversation;

  try {
    conversation =
      await ConversationService.getOrCreateConversation(
        req.user,
        req.body?.conversationId
      );

    sendSSE(res, "conversation", {
      conversationId: conversation.id,
      title: conversation.title,
    });
  } catch (error) {
    sendSSE(res, "error", {
      message: error.message,
    });

    return res.end();
  }

  let connectionClosed = false;

  req.on("close", () => {
    connectionClosed = true;
  });

  try {
    await AIService.streamChat(
      message,
      {
        ...context,
        conversationId: conversation.id,
      },
      {
        onStatus(data) {
          if (!connectionClosed) {
            sendSSE(
              res,
              "status",
              data
            );
          }
        },

        onToken(token) {
          if (!connectionClosed) {
            sendSSE(res, "token", {
              token,
            });
          }
        },

        onComplete(data) {
          if (!connectionClosed) {
            sendSSE(
              res,
              "complete",
              data
            );
          }
        },
      }
    );

    if (!connectionClosed) {
      res.end();
    }
  } catch (error) {
    console.error(
      "Streaming chat error:",
      error
    );

    if (!connectionClosed) {
      sendSSE(res, "error", {
        message:
          error.message ||
          "The AI assistant failed.",
      });

      res.end();
    }
  }
};