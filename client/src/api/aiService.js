import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function parseSSEBlock(block) {
  const lines = block.split("\n");

  let event = "message";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    }

    if (line.startsWith("data:")) {
      data += line.slice(5).trim();
    }
  }

  if (!data) return null;

  try {
    return {
      event,
      data: JSON.parse(data),
    };
  } catch {
    return {
      event,
      data: {
        message: data,
      },
    };
  }
}

async function parseResponse(response) {
  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Request failed"
    );
  }

  return data;
}

export const aiService = {
  async listConversations() {
    const response = await fetch(
      `${API_BASE}/chat/conversations`,
      {
        credentials: "include",
      }
    );

    return parseResponse(response);
  },

  async createConversation(
    title = "New conversation"
  ) {
    const response = await fetch(
      `${API_BASE}/chat/conversations`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          title,
        }),
      }
    );

    return parseResponse(response);
  },

  async getConversation(
    conversationId
  ) {
    const response = await fetch(
      `${API_BASE}/chat/conversations/${conversationId}`,
      {
        credentials: "include",
      }
    );

    return parseResponse(response);
  },

  async renameConversation(
    conversationId,
    title
  ) {
    const response = await fetch(
      `${API_BASE}/chat/conversations/${conversationId}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          title,
        }),
      }
    );

    return parseResponse(response);
  },

  async clearConversation(
    conversationId
  ) {
    const response = await fetch(
      `${API_BASE}/chat/conversations/${conversationId}/messages`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    return parseResponse(response);
  },

  async deleteConversation(
    conversationId
  ) {
    const response = await fetch(
      `${API_BASE}/chat/conversations/${conversationId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    return parseResponse(response);
  },

  async streamMessage(
    message,
    {
      conversationId,
      onConversation,
      onToken,
      onStatus,
      onComplete,
      onError,
      signal,
    } = {}
  ) {
    const response = await fetch(
      `${API_BASE}/chat/stream`,
      {
        method: "POST",
        credentials: "include",
        signal,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          message,
          conversationId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        "Failed to start AI stream."
      );
    }

    const reader =
      response.body.getReader();

    const decoder =
      new TextDecoder();

    let buffer = "";

    while (true) {
      const { done, value } =
        await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const blocks =
        buffer.split("\n\n");

      buffer = blocks.pop() || "";

      for (const block of blocks) {
        const lines =
          block.split("\n");

        let event = "message";
        let data = "";

        for (const line of lines) {
          if (
            line.startsWith("event:")
          ) {
            event = line
              .slice(6)
              .trim();
          }

          if (
            line.startsWith("data:")
          ) {
            data += line
              .slice(5)
              .trim();
          }
        }

        if (!data) continue;

        const parsed =
          JSON.parse(data);

        if (event === "conversation") {
          onConversation?.(parsed);
        }

        if (event === "status") {
          onStatus?.(
            parsed.message
          );
        }

        if (event === "token") {
          onToken?.(
            parsed.token || ""
          );
        }

        if (event === "complete") {
          onComplete?.(parsed);
        }

        if (event === "error") {
          onError?.(
            parsed.message
          );
        }
      }
    }
  },
};