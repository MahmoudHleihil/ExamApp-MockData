import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCallback, useEffect,useRef, useState, } from "react";

import { aiService } from "../api/aiService";

const sortConversations = (conversations = []) =>
  [...conversations].sort(
    (a, b) =>
      new Date(b.updatedAt || 0) -
      new Date(a.updatedAt || 0)
  );

const AIChatbot = ({ user, context, initialPrompt = "",}) => {
  const getWelcomeMessage = useCallback((role) => {
    if (role === "Teacher") {
      return "Hello Teacher! I can help you create exams, review submissions, and find exam information.";
    }

    if (role === "Student") {
      return "Hello Student! I can help you find your exams, check submissions, and understand feedback.";
    }

    if (role === "Admin") {
      return "Hello Admin! I can help you view users, approvals, system stats, and platform activity.";
    }

    return "Hello! I am your AI assistant. How can I help?";
  }, []);

  const createWelcomeMessage = useCallback(
    () => ({
      id: crypto.randomUUID(),
      role: "ai",
      content: getWelcomeMessage(user?.role),
    }),
    [getWelcomeMessage, user?.role]
  );

  const [isVisible, setIsVisible] =
    useState(true);

  const [isOpen, setIsOpen] =
    useState(false);

  const [messages, setMessages] =
    useState(() => [
      {
        id: crypto.randomUUID(),
        role: "ai",
        content: getWelcomeMessage(user?.role),
      },
    ]);

  const [input, setInput] =
    useState("");

  const [isTyping, setIsTyping] =
    useState(false);

  const [streamingStatus, setStreamingStatus] =
    useState("");

  const [conversations, setConversations] =
    useState([]);

  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState(null);

  const [
    isLoadingConversation,
    setIsLoadingConversation,
  ] = useState(false);

  const [showConversationMenu, setShowConversationMenu] =
    useState(false);

  const [isManagingConversation, setIsManagingConversation] =
    useState(false);

  const [isRenaming, setIsRenaming] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");

  const [confirmationAction, setConfirmationAction] = useState(null);
  
  const conversationMenuRef = useRef(null);
  
  const abortControllerRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  const bodyRef =
    useRef(null);

  const lastInitialPromptRef =
    useRef("");

  const initializationRef =
    useRef(false);

  const renameActiveConversation = () => {
    if (!activeConversation) return;

    setConversationTitle(activeConversation.title);
    setIsRenaming(true);
    setShowConversationMenu(false);
  };

  const saveConversationTitle = async () => {
    const title = conversationTitle.trim();

    if (!title) return;

    try {
      const updated =
        await aiService.renameConversation(
          activeConversationId,
          title
        );

      setConversations((current) =>
        sortConversations(
          current.map((conversation) =>
            conversation.id === updated.id
              ? {
                  ...conversation,
                  ...updated,
                }
              : conversation
          )
        )
      );

      setIsRenaming(false);
    } catch (error) {
      console.error(error);
    }
  };

  const clearActiveConversation = () => {
    if (!activeConversationId) return;

    setShowConversationMenu(false);

    setConfirmationAction({
      type: "clear",
      title:
        activeConversation?.title ||
        "this conversation",
    });
  };

  const deleteActiveConversation = () => {
    if (!activeConversationId) return;

    setShowConversationMenu(false);

    setConfirmationAction({
      type: "delete",
      title:
        activeConversation?.title ||
        "this conversation",
    });
  };

  const confirmConversationAction = async () => {
    if (
      !confirmationAction ||
      !activeConversationId
    ) {
      return;
    }

    const actionType =
      confirmationAction.type;

    try {
      setIsManagingConversation(true);

      if (actionType === "clear") {
        await aiService.clearConversation(
          activeConversationId
        );

        setMessages([
          createWelcomeMessage(),
        ]);

        setConversations((current) =>
          sortConversations(
            current.map((conversation) =>
              conversation.id ===
              activeConversationId
                ? {
                    ...conversation,
                    messageCount: 0,
                    updatedAt:
                      new Date().toISOString(),
                  }
                : conversation
            )
          )
        );
      }

      if (actionType === "delete") {
        await aiService.deleteConversation(
          activeConversationId
        );

        const remaining =
          sortConversations(
            conversations.filter(
              (conversation) =>
                conversation.id !==
                activeConversationId
            )
          );

        setConversations(remaining);
        localStorage.removeItem(storageKey);

        if (remaining.length > 0) {
          await openConversation(
            remaining[0].id
          );
        } else {
          setActiveConversationId(null);

          setMessages([
            createWelcomeMessage(),
          ]);

          await startNewConversation();
        }
      }

      setConfirmationAction(null);
    } catch (error) {
      console.error(
        `Failed to ${actionType} conversation:`,
        error
      );

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "ai",
          content:
            error.message ||
            `Failed to ${actionType} the conversation.`,
        },
      ]);
    } finally {
      setIsManagingConversation(false);
    }
  };

  const cancelConversationAction = () => {
    if (isManagingConversation) return;

    setConfirmationAction(null);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        conversationMenuRef.current &&
        !conversationMenuRef.current.contains(
          event.target
        )
      ) {
        setShowConversationMenu(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const activeConversation = conversations.find(
    (conversation) =>
      conversation.id === activeConversationId
  );

  const storageKey = `activeAIConversation:${
    user?.id || user?.email || "anonymous"
  }`;

  const scrollToBottom = useCallback(
    (behavior = "smooth") => {
      messagesEndRef.current?.scrollIntoView({
        behavior,
      });
    },
    []
  );

  const shouldAutoScroll = useCallback(() => {
    const element = bodyRef.current;

    if (!element) {
      return true;
    }

    const distanceFromBottom =
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight;

    return distanceFromBottom < 80;
  }, []);

  const refreshConversations =
    useCallback(async () => {
      const list =
        await aiService.listConversations();

      const sortedList =
        sortConversations(list);

      setConversations(sortedList);

      return sortedList;
    }, []);

  const openConversation =
    useCallback(
      async (conversationId) => {
        if (!conversationId) {
          return;
        }

        try {
          setIsLoadingConversation(true);

          const conversation =
            await aiService.getConversation(
              conversationId
            );

          setActiveConversationId(
            conversation.id
          );

          localStorage.setItem(
            storageKey,
            conversation.id
          );

          const loadedMessages =
            Array.isArray(
              conversation.messages
            )
              ? conversation.messages.map(
                  (message) => ({
                    ...message,
                    id:
                      message.id ||
                      crypto.randomUUID(),
                    role:
                      message.role ===
                      "assistant"
                        ? "ai"
                        : message.role,
                    content: String(
                      message.content || ""
                    ),
                  })
                )
              : [];

          setMessages(
            loadedMessages.length > 0
              ? loadedMessages
              : [createWelcomeMessage()]
          );

          requestAnimationFrame(() => {
            scrollToBottom("auto");
          });
        } catch (error) {
          console.error(
            "Failed to open conversation:",
            error
          );

          setMessages([
            createWelcomeMessage(),
            {
              id: crypto.randomUUID(),
              role: "ai",
              content:
                error.message ||
                "Failed to load this conversation.",
            },
          ]);
        } finally {
          setIsLoadingConversation(false);
        }
      },
      [
        createWelcomeMessage,
        scrollToBottom,
        storageKey,
      ]
    );

  const startNewConversation =
    useCallback(async () => {
      if (
        isTyping ||
        isManagingConversation
      ) {
        return;
      }

      const activeIsEmpty =
        activeConversation &&
        Number(
          activeConversation.messageCount || 0
        ) === 0 &&
        activeConversation.title ===
          "New conversation";

      if (activeIsEmpty) {
        setIsOpen(true);
        return;
      }

      try {
        const conversation =
          await aiService.createConversation(
            "New conversation"
          );

        setConversations((current) =>
          sortConversations([
            conversation,
            ...current.filter(
              (item) =>
                item.id !== conversation.id
            ),
          ])
        );

        await openConversation(
          conversation.id
        );

        setIsOpen(true);
      } catch (error) {
        console.error(
          "Failed to create conversation:",
          error
        );
      }
    }, [
      activeConversation,
      isTyping,
      isManagingConversation,
      openConversation,
    ]);

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
  };

  const retryMessage = (messageIndex) => {
    const previousUserMessage = [
      ...messages,
    ]
      .slice(0, messageIndex)
      .reverse()
      .find(
        (message) =>
          message.role === "user"
      );

    if (!previousUserMessage) {
      return;
    }

    setInput(
      String(
        previousUserMessage.content || ""
      )
    );
  };

  const handleSend = async (event) => {
    event.preventDefault();

    const text = input.trim();

    if (!text || isTyping) {
      return;
    }

    let conversationId =
      activeConversationId;

    if (!conversationId) {
      try {
        const conversation =
          await aiService.createConversation(
            "New conversation"
          );

        conversationId =
          conversation.id;

        setActiveConversationId(
          conversation.id
        );

        localStorage.setItem(
          storageKey,
          conversation.id
        );

        setConversations((current) =>
          sortConversations([
            conversation,
            ...current,
          ])
        );
      } catch (error) {
        console.error(
          "Failed to create conversation:",
          error
        );

        return;
      }
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const assistantMessageId =
      crypto.randomUUID();

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantMessageId,
        role: "ai",
        content: "",
        incomplete: false,
      },
    ]);

    setInput("");
    setIsTyping(true);
    setStreamingStatus(
      "Connecting..."
    );

    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    try {
      await aiService.streamMessage(
        text,
        {
          conversationId,
          context,
          signal: controller.signal,

          onConversation(data) {
            if (
              !data?.conversationId
            ) {
              return;
            }

            conversationId =
              data.conversationId;

            setActiveConversationId(
              data.conversationId
            );

            localStorage.setItem(
              storageKey,
              data.conversationId
            );
          },

          onStatus(status) {
            setStreamingStatus(
              status || "Processing..."
            );
          },

          onToken(token) {
            setStreamingStatus("");

            setMessages((current) =>
              current.map((item) =>
                item.id ===
                assistantMessageId
                  ? {
                      ...item,
                      content:
                        String(
                          item.content || ""
                        ) +
                        String(token || ""),
                    }
                  : item
              )
            );
          },

          async onComplete() {
            setStreamingStatus("");

            try {
              await refreshConversations();
            } catch (error) {
              console.error(
                "Failed to refresh conversations:",
                error
              );
            }
          },

          onError(message) {
            throw new Error(
              message ||
                "The AI assistant failed to respond."
            );
          },
        }
      );
    } catch (error) {
      if (error.name === "AbortError") {
        setMessages((current) =>
          current.map((item) =>
            item.id ===
            assistantMessageId
              ? {
                  ...item,
                  incomplete: true,
                  content:
                    item.content ||
                    "The response was stopped before any text was generated.",
                }
              : item
          )
        );

        return;
      }

      console.error(
        "Streaming AI error:",
        error
      );

      setMessages((current) =>
        current.map((item) =>
          item.id ===
          assistantMessageId
            ? {
                ...item,
                incomplete: true,
                content:
                  item.content ||
                  error.message ||
                  "The AI assistant failed to respond.",
              }
            : item
        )
      );
    } finally {
      setIsTyping(false);
      setStreamingStatus("");
      abortControllerRef.current =
        null;
    }
  };

  useEffect(() => {
    if (
      isOpen &&
      shouldAutoScroll()
    ) {
      scrollToBottom();
    }
  }, [
    messages,
    isOpen,
    isTyping,
    streamingStatus,
    scrollToBottom,
    shouldAutoScroll,
  ]);

  useEffect(() => {
    const prompt =
      initialPrompt.trim();

    if (!prompt) {
      return;
    }

    if (
      lastInitialPromptRef.current ===
      prompt
    ) {
      return;
    }

    lastInitialPromptRef.current =
      prompt;

    setInput(prompt);
    setIsOpen(true);
  }, [initialPrompt]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;

    const loadConversations =
      async () => {
        try {
          const list =
            await refreshConversations();

          const savedConversationId =
            localStorage.getItem(
              storageKey
            );

          const savedConversationExists =
            list.some(
              (conversation) =>
                conversation.id ===
                savedConversationId
            );

          if (
            savedConversationId &&
            savedConversationExists
          ) {
            await openConversation(
              savedConversationId
            );

            return;
          }

          if (list.length > 0) {
            await openConversation(
              list[0].id
            );

            return;
          }

          await startNewConversation();
        } catch (error) {
          console.error(
            "Failed to load conversations:",
            error
          );
        }
      };

    loadConversations();
  }, [
    openConversation,
    refreshConversations,
    startNewConversation,
    storageKey,
  ]);

  if (!isVisible) {
    return null;
  }

  const MarkdownMessage = ({ content }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children }) {
            return (
              <h5 className="fw-bold mt-2 mb-2">
                {children}
              </h5>
            );
          },

          h2({ children }) {
            return (
              <h6 className="fw-bold mt-2 mb-2">
                {children}
              </h6>
            );
          },

          h3({ children }) {
            return (
              <div className="fw-bold mt-2 mb-1">
                {children}
              </div>
            );
          },

          p({ children }) {
            return (
              <p className="mb-2">
                {children}
              </p>
            );
          },

          ul({ children }) {
            return (
              <ul className="ps-3 mb-2">
                {children}
              </ul>
            );
          },

          ol({ children }) {
            return (
              <ol className="ps-3 mb-2">
                {children}
              </ol>
            );
          },

          li({ children }) {
            return (
              <li className="mb-1">
                {children}
              </li>
            );
          },

          blockquote({ children }) {
            return (
              <blockquote
                className="border-start border-3 border-primary ps-2 text-muted mb-2"
              >
                {children}
              </blockquote>
            );
          },

          code({
            inline,
            className,
            children,
            ...props
          }) {
            const codeText = String(children).replace(
              /\n$/,
              ""
            );

            if (inline) {
              return (
                <code
                  className="bg-light text-danger border rounded px-1"
                  {...props}
                >
                  {codeText}
                </code>
              );
            }

            return (
              <pre
                className="bg-dark text-light rounded-3 p-3 overflow-auto mb-2"
                style={{
                  fontSize: "0.78rem",
                  maxWidth: "100%",
                }}
              >
                <code
                  className={className}
                  {...props}
                >
                  {codeText}
                </code>
              </pre>
            );
          },

          table({ children }) {
            return (
              <div className="table-responsive mb-2">
                <table className="table table-sm table-bordered align-middle mb-0">
                  {children}
                </table>
              </div>
            );
          },

          th({ children }) {
            return (
              <th className="bg-light fw-bold">
                {children}
              </th>
            );
          },

          td({ children }) {
            return (
              <td>
                {children}
              </td>
            );
          },

          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },

          hr() {
            return <hr className="my-2" />;
          },
        }}
      >
        {String(content || "")}
      </ReactMarkdown>
    );
  };

  const assistantTitle =
    user?.role === "Teacher"
      ? "AI Teaching Assistant"
      : user?.role === "Student"
        ? "AI Student Assistant"
        : user?.role === "Admin"
          ? "AI Admin Assistant"
          : "AI Assistant";

  return (
    <div
      className="position-fixed bottom-0 end-0 m-4 z-3"
      style={{
        maxWidth: "400px",
        position: "relative",
      }}
    >
      <div className="position-relative d-flex justify-content-end">
        {!isOpen && (
          <button
            type="button"
            className="btn btn-sm btn-dark rounded-circle position-absolute top-0 start-0 translate-middle shadow-sm z-3"
            style={{
              width: "22px",
              height: "22px",
              padding: 0,
              fontSize: "0.6rem",
              marginLeft: "5px",
            }}
            onClick={() =>
              setIsVisible(false)
            }
            title="Disable Chatbot"
          >
            <i className="bi bi-x" />
          </button>
        )}

        <button
          type="button"
          className="btn btn-primary rounded-circle shadow-lg p-3 d-flex align-items-center justify-content-center"
          style={{
            width: "60px",
            height: "60px",
          }}
          onClick={() =>
            setIsOpen((current) => !current)
          }
          title={
            isOpen
              ? "Minimize AI Assistant"
              : "Open AI Assistant"
          }
        >
          <i className="bi bi-robot fs-3" />
        </button>
      </div>

      {isOpen && (
        <div
          className="card shadow-lg border-0 mb-3 animate__animated animate__fadeInUp rounded-4"
          style={{
            width: "380px",
            maxHeight: "430px",
          }}
        >
          <div className="card-header bg-primary text-white py-2 px-3 border-0">
            <div className="d-flex justify-content-between align-items-center gap-2">
              <div className="d-flex align-items-center overflow-hidden">
                <i className="bi bi-robot me-2 fs-5 flex-shrink-0" />

                <div className="overflow-hidden">
                  <h6 className="mb-0 fw-bold text-truncate">
                    {assistantTitle}
                  </h6>

                  <small
                    className="opacity-75"
                    style={{
                      fontSize: "0.68rem",
                    }}
                  >
                    {conversations.length}{" "}
                    conversation
                    {conversations.length === 1
                      ? ""
                      : "s"}
                  </small>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-link text-white p-0 flex-shrink-0"
                onClick={() =>
                  setIsOpen(false)
                }
                title="Close Chat"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="d-flex align-items-center gap-2 mt-2">
              {conversations.length > 0 ? (
                isRenaming ? (
                  <input
                    className="form-control form-control-sm"
                    autoFocus
                    value={conversationTitle}
                    onChange={(e) =>
                      setConversationTitle(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        saveConversationTitle();
                      }

                      if (e.key === "Escape") {
                        setIsRenaming(false);
                      }
                    }}
                    onBlur={saveConversationTitle}
                  />
                ) : (
                  <select
                    className="form-select form-select-sm"
                    value={activeConversationId || ""}
                    onChange={(e) =>
                      openConversation(e.target.value)
                    }
                  >
                    {conversations.map((conversation) => (
                      <option
                        key={conversation.id}
                        value={conversation.id}
                      >
                        {conversation.title}
                      </option>
                    ))}
                  </select>
                )
              ) : (
                <div className="form-control form-control-sm text-muted bg-white">
                  No conversations
                </div>
              )}

              <button
                type="button"
                className="btn btn-sm btn-light flex-shrink-0"
                onClick={startNewConversation}
                disabled={
                  isTyping ||
                  isManagingConversation
                }
                title="New conversation"
              >
                <i className="bi bi-plus-lg" />
              </button>

              <div
                className="position-relative"
                ref={conversationMenuRef}
              >
                <button
                  type="button"
                  className="btn btn-sm btn-light flex-shrink-0"
                  onClick={() =>
                    setShowConversationMenu(
                      (current) => !current
                    )
                  }
                  disabled={
                    !activeConversationId ||
                    isTyping ||
                    isManagingConversation
                  }
                  title="Conversation options"
                >
                  {isManagingConversation ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <i className="bi bi-three-dots-vertical" />
                  )}
                </button>

                {showConversationMenu && (
                  <div
                    className="position-absolute end-0 mt-1 bg-white text-dark border rounded-3 shadow-lg"
                    style={{
                      width: "180px",
                      zIndex: 9999,
                    }}
                  >
                    <button
                      type="button"
                      className="dropdown-item px-3 py-2 text-dark bg-white"
                      onClick={renameActiveConversation}
                    >
                      <i className="bi bi-pencil me-2" />
                      Rename
                    </button>

                    <button
                      type="button"
                      className="dropdown-item px-3 py-2 text-dark bg-white"
                      onClick={clearActiveConversation}
                    >
                      <i className="bi bi-eraser me-2" />
                      Clear messages
                    </button>

                    <div className="border-top" />

                    <button
                      type="button"
                      className="dropdown-item px-3 py-2 text-danger bg-white"
                      onClick={deleteActiveConversation}
                    >
                      <i className="bi bi-trash me-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            ref={bodyRef}
            className="card-body overflow-auto p-3"
            style={{
              height: "360px",
              backgroundColor: "#f8f9fa",
            }}
          >
            {isLoadingConversation ? (
              <div className="d-flex h-100 justify-content-center align-items-center">
                <div
                  className="spinner-border text-primary"
                  role="status"
                >
                  <span className="visually-hidden">
                    Loading conversation...
                  </span>
                </div>
              </div>
            ) : (
              <>
                {messages.map(
                  (message, index) => (
                    <div
                      key={
                        message.id ||
                        `${message.role}-${index}`
                      }
                      className={`d-flex mb-3 ${
                        message.role ===
                        "user"
                          ? "justify-content-end"
                          : "justify-content-start"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-4 shadow-sm ${
                          message.role ===
                          "user"
                            ? "bg-primary text-white"
                            : "bg-white text-dark border"
                        }`}
                        style={{
                          maxWidth: "85%",
                          fontSize: "0.9rem",
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        <div
                          className={`chat-message-content ${
                            message.role === "user"
                              ? "text-white"
                              : "text-dark"
                          }`}
                        >
                          {message.role === "user" ? (
                            <div
                              style={{
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {String(message.content || "")}
                            </div>
                          ) : (
                            <MarkdownMessage
                              content={message.content}
                            />
                          )}
                        </div>
                        {message.incomplete && (
                          <div className="mt-2">
                            <div
                              className="text-warning mb-1"
                              style={{
                                fontSize:
                                  "0.7rem",
                              }}
                            >
                              Response interrupted
                            </div>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary rounded-pill"
                              onClick={() =>
                                retryMessage(
                                  index
                                )
                              }
                              disabled={
                                isTyping
                              }
                            >
                              <i className="bi bi-arrow-clockwise me-1" />
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}

                {isTyping &&
                  streamingStatus && (
                    <div className="d-flex mb-3 justify-content-start">
                      <div
                        className="bg-white border p-2 rounded-4 shadow-sm text-muted"
                        style={{
                          fontSize:
                            "0.8rem",
                        }}
                      >
                        <span className="spinner-border spinner-border-sm me-2" />
                        {streamingStatus}
                      </div>
                    </div>
                  )}

                <div
                  ref={messagesEndRef}
                />
              </>
            )}
          </div>

          <div className="card-footer bg-white p-3 border-0">
            <form
              onSubmit={handleSend}
              className="input-group"
            >
              <input
                type="text"
                className="form-control border-light-subtle rounded-start-pill bg-light"
                placeholder="Ask me anything..."
                value={input}
                onChange={(event) =>
                  setInput(
                    event.target.value
                  )
                }
                disabled={
                  isTyping ||
                  isLoadingConversation
                }
                autoComplete="off"
              />

              {isTyping ? (
                <button
                  type="button"
                  className="btn btn-outline-danger rounded-end-pill px-3"
                  onClick={stopStreaming}
                  title="Stop response"
                >
                  <i className="bi bi-stop-fill" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary rounded-end-pill px-3"
                  disabled={
                    !input.trim() ||
                    isLoadingConversation
                  }
                  title="Send message"
                >
                  <i className="bi bi-send-fill" />
                </button>
              )}
            </form>

            <div className="text-center mt-2">
              <small
                className="text-muted"
                style={{
                  fontSize: "0.7rem",
                }}
              >
                <i className="bi bi-shield-check me-1" />
                Secure AI Assistant
              </small>
            </div>
          </div>
        </div>
      )}
      {confirmationAction && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            zIndex: 2000,
            backgroundColor:
              "rgba(0, 0, 0, 0.45)",
            borderRadius: "1rem",
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4 text-dark"
            style={{
              width: "310px",
              maxWidth: "90%",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="conversation-confirm-title"
          >
            <div className="text-center mb-3">
              <div
                className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3 ${
                  confirmationAction.type ===
                  "delete"
                    ? "bg-danger-subtle text-danger"
                    : "bg-warning-subtle text-warning"
                }`}
                style={{
                  width: "52px",
                  height: "52px",
                }}
              >
                <i
                  className={`bi fs-4 ${
                    confirmationAction.type ===
                    "delete"
                      ? "bi-trash"
                      : "bi-eraser"
                  }`}
                />
              </div>

              <h6
                id="conversation-confirm-title"
                className="fw-bold mb-2"
              >
                {confirmationAction.type ===
                "delete"
                  ? "Delete conversation?"
                  : "Clear all messages?"}
              </h6>

              <p className="small text-muted mb-0">
                {confirmationAction.type ===
                "delete" ? (
                  <>
                    The conversation{" "}
                    <strong>
                      “{confirmationAction.title}”
                    </strong>{" "}
                    will be permanently deleted.
                  </>
                ) : (
                  <>
                    All messages in{" "}
                    <strong>
                      “{confirmationAction.title}”
                    </strong>{" "}
                    will be removed, but the
                    conversation will remain.
                  </>
                )}
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-light border flex-fill rounded-pill"
                onClick={
                  cancelConversationAction
                }
                disabled={
                  isManagingConversation
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={`btn flex-fill rounded-pill ${
                  confirmationAction.type ===
                  "delete"
                    ? "btn-danger"
                    : "btn-warning"
                }`}
                onClick={
                  confirmConversationAction
                }
                disabled={
                  isManagingConversation
                }
              >
                {isManagingConversation ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Processing...
                  </>
                ) : confirmationAction.type ===
                  "delete" ? (
                  <>
                    <i className="bi bi-trash me-2" />
                    Delete
                  </>
                ) : (
                  <>
                    <i className="bi bi-eraser me-2" />
                    Clear
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;