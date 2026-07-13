import "../mcp/index.js";

import LLMProvider from "../ai/LLMProvider.js";
import systemPrompt from "../ai/systemPrompt.js";
import { getOpenAIToolsForUser } from "../ai/toolExecutor.js";
import MCPServer from "../mcp/server.js";

import ConversationService from "./ConversationService.js";
import confirmationManager from "../mcp/confirmationManager.js";

class AIService {
  async chat(message, context) {
    const tools = getOpenAIToolsForUser(context.user);

    console.log("Tools sent to OpenRouter:");
    console.dir(tools, { depth: null });

    const previousMessages = await ConversationService.getMessages(context.user).filter((m) => ["user", "assistant"].includes(m.role))
    .map((m) => ({
      role: m.role,
      content: String(m.content || ""),
    }));

   const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...previousMessages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    {
      role: "user",
      content: message,
    },
  ];

    const firstResponse = await LLMProvider.createChatCompletion({
      messages,
      tools,
      tool_choice: "auto",
    });

    const answer = await this.handleResponse(firstResponse, messages, context, tools);

    await ConversationService.addMessage(context.user, context.conversationId, {
      role: "user",
      content: message,
    });

    await ConversationService.addMessage(context.user,context.conversationId, {
      role: "assistant",
      content: answer || "",
    });

    return answer;
  }

  isConfirmationMessage(message) {
    return /^(yes|confirm|confirmed|continue|proceed|do it|delete it)$/i.test(
      String(message || "").trim()
    );
  }

  safeParseToolArgs(raw) {
    if (!raw) return {};

    if (typeof raw === "object") return raw;

    try {
      return JSON.parse(raw);
    } catch {}

    // Extract first valid JSON object
    const start = raw.indexOf("{");

    if (start === -1) return {};

    let depth = 0;

    for (let i = start; i < raw.length; i++) {
      if (raw[i] === "{") depth++;
      if (raw[i] === "}") depth--;

      if (depth === 0) {
        try {
          return JSON.parse(raw.slice(start, i + 1));
        } catch {
          break;
        }
      }
    }

    console.error("Invalid tool arguments:", raw);
    return {};
  }

  async handleResponse(
    initialResponse,
    messages,
    context,
    tools
  ) {
    const MAX_TOOL_ROUNDS = 4;

    let response = initialResponse;

    for (
      let round = 0;
      round < MAX_TOOL_ROUNDS;
      round += 1
    ) {
      const assistantMessage =
        response?.choices?.[0]?.message;

      if (!assistantMessage) {
        console.error(
          "Invalid OpenRouter response:",
          JSON.stringify(response, null, 2)
        );

        const error = new Error(
          "AI provider returned an invalid response."
        );

        error.statusCode = 502;
        throw error;
      }

      const toolCalls =
        assistantMessage.tool_calls || [];

      if (toolCalls.length === 0) {
        return assistantMessage.content || "";
      }

      messages.push({
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: toolCalls.map((call) => ({
          id: call.id,
          type: "function",
          function: {
            name: call.function.name,
            arguments:
              typeof call.function.arguments === "string"
                ? call.function.arguments
                : JSON.stringify(
                    call.function.arguments || {}
                  ),
          },
        })),
      });

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;

        const args = this.safeParseToolArgs(
          toolCall.function.arguments
        );

        const result = await MCPServer.execute(
          toolName,
          args,
          context
        );

        await ConversationService.saveToolResult(
          context.user,
          context.conversationId,
          toolName,
          result
        );

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      response =
        await LLMProvider.createChatCompletion({
          messages,
          tools,
          tool_choice: "auto",
        });
    }

    const error = new Error(
      "The AI exceeded the maximum number of tool rounds."
    );

    error.statusCode = 508;
    throw error;
  }

  async streamChat(message, context, callbacks = {}) {
    const {
      onToken = () => {},
      onStatus = () => {},
      onComplete = () => {},
    } = callbacks;
    
    if (this.isConfirmationMessage(message)) {
      const pending =
        await confirmationManager.findLatestPending(
          context.user.id
        );

      if (!pending) {
        const text =
          "There is no pending action to confirm, or it has expired.";

        onToken(text);

        onComplete({
          type: "complete",
          message: text,
        });

        return text;
      }

      const confirmationId = String(
        pending.id || ""
      ).trim();

      if (!confirmationId) {
        const error = new Error(
          "The pending confirmation has no valid ID."
        );

        error.statusCode = 500;
        throw error;
      }

      onStatus({
        type: "status",
        message: "Confirming the action...",
      });

      console.log("Executing stored confirmation:", {
        toolName: pending.toolName,
        confirmationId,
        confirmationIdLength:
          confirmationId.length,
        args: pending.args,
      });

      const result = await MCPServer.execute(
        pending.toolName,
        {
          ...(pending.args || {}),
          confirmationId,
        },
        context
      );

      const text =
        result?.message ||
        "The action was completed successfully.";

      onToken(text);

      await ConversationService.addMessage(
        context.user,
        context.conversationId,
        {
          role: "user",
          content: message,
        }
      );

      await ConversationService.addMessage(
        context.user,
        context.conversationId,
        {
          role: "assistant",
          content: text,
        }
      );

      onComplete({
        type: "complete",
        message: text,
        result,
      });

      return text;
    }

    const tools = getOpenAIToolsForUser(context.user);

    const conversationId = context.conversationId;

    const storedMessages = await ConversationService.getMessages(context.user, conversationId);
    const previousMessages = storedMessages
      .filter((message) =>
        ["user", "assistant"].includes(message.role)
      )
      .map((message) => ({
        role: message.role,
        content: String(message.content || ""),
      }));

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...previousMessages,
      {
        role: "user",
        content: message,
      },
    ];

    onStatus({
      type: "status",
      message: "Processing your request...",
    });

    const toolRoundResult = await this.executeToolRounds(
        messages,
        context,
        tools,
        onStatus
      );

    if ( toolRoundResult?.requiresConfirmation) {
      const confirmation = toolRoundResult.confirmation;

      const confirmationText =
        `This action has not been completed yet. ` +
        `Please confirm that you want to continue. ` +
        `The confirmation expires at ${new Date(
          confirmation.expiresAt
        ).toLocaleTimeString()}.`;

      onToken(confirmationText);

      await ConversationService.addMessage(
        context.user,
        context.conversationId,
        {
          role: "user",
          content: message,
        }
      );

      await ConversationService.addMessage(
        context.user,
        context.conversationId,
        {
          role: "assistant",
          content: confirmationText,
        }
      );

      messages.push({
        role: "system",
        content: `
    Explain that the action requires confirmation.

    Do not call any more tools.
    Do not invent an exam ID or confirmation ID.
    Tell the user to explicitly confirm the requested action.
        `.trim(),
      });

      onComplete({
        type: "complete",
        message: confirmationText,
        requiresConfirmation: true,
      });

      return confirmationText;
    }

    onStatus({
      type: "status",
      message: "Generating answer...",
    });

    const { stream, model } =
      await LLMProvider.createChatCompletionStream({
        messages,
        tool_choice: "none",
      });

    let completeText = "";
    let completed = false;

    try {
      for await (const chunk of stream) {
        const token = chunk?.choices?.[0]?.delta?.content;

        if (!token) continue;

        completeText += token;
        onToken(token);
      }

      completed = true;

      onComplete({
        type: "complete",
        message: completeText,
        model,
      });

      return completeText;
    } finally {
      await ConversationService.addMessage(context.user, context.conversationId, {
        role: "user",
        content: message,
      });

      if (completeText.trim()) {
        await ConversationService.addMessage(context.user, context.conversationId, {
          role: "assistant",
          content: completeText,
          incomplete: !completed,
        });
      }
    }

    // await ConversationService.addMessage(context.user, context.conversationId, {
    //   role: "user",
    //   content: message,
    // });

    // await ConversationService.addMessage(context.user, context.conversationId, {
    //   role: "assistant",
    //   content: completeText,
    // });

    // onComplete({
    //   type: "complete",
    //   message: completeText,
    //   model,
    // });

    // return completeText;
  }


  async executeToolRounds(
    messages,
    context,
    tools,
    onStatus = () => {}
  ) {
    const MAX_TOOL_ROUNDS = 4;
    const TOOL_TIMEOUT_MS = 30_000;

    const failedCalls = new Map();
    const successfulResults = new Map();

    const runWithTimeout = async (
      toolName,
      args
    ) => {
      let timeoutId;

      try {
        return await Promise.race([
          MCPServer.execute(
            toolName,
            args,
            context
          ),

          new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              const error = new Error(
                `Tool "${toolName}" timed out after ${TOOL_TIMEOUT_MS / 1000} seconds.`
              );

              error.statusCode = 504;
              reject(error);
            }, TOOL_TIMEOUT_MS);
          }),
        ]);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    for (
      let round = 0;
      round < MAX_TOOL_ROUNDS;
      round += 1
    ) {
      const response =
        await LLMProvider.createChatCompletion({
          messages,
          tools,
          tool_choice: "auto",
        });

      const assistantMessage =
        response?.choices?.[0]?.message;

      if (!assistantMessage) {
        const error = new Error(
          "AI provider returned no assistant message."
        );

        error.statusCode = 502;
        throw error;
      }

      const toolCalls =
        Array.isArray(
          assistantMessage.tool_calls
        )
          ? assistantMessage.tool_calls
          : [];

      if (toolCalls.length === 0) {
        return;
      }

      messages.push({
        role: "assistant",
        content:
          assistantMessage.content || "",
        tool_calls: toolCalls.map(
          (call) => ({
            id: call.id,
            type: "function",
            function: {
              name:
                call.function.name,

              arguments:
                typeof call.function
                  .arguments === "string"
                  ? call.function
                      .arguments
                  : JSON.stringify(
                      call.function
                        .arguments || {}
                    ),
            },
          })
        ),
      });

      const executedThisRound =
        new Set();

      // let confirmationRequested =
      //   false;

      for (const toolCall of toolCalls) {
        const toolName =
          toolCall?.function?.name;

        if (!toolName) {
          messages.push({
            role: "tool",
            tool_call_id:
              toolCall.id,
            content: JSON.stringify({
              success: false,
              error:
                "Tool name is missing.",
            }),
          });

          continue;
        }

        let args;

        try {
          args =
            this.safeParseToolArgs(
              toolCall.function
                .arguments
            );
        } catch (error) {
          const result = {
            success: false,
            error:
              error.message ||
              "Invalid tool arguments.",
            statusCode:
              error.statusCode ||
              400,
          };

          messages.push({
            role: "tool",
            tool_call_id:
              toolCall.id,
            content:
              JSON.stringify(result),
          });

          continue;
        }

        const callKey =
          JSON.stringify({
            toolName,
            args,
          });

        /*
        * Do not execute an identical tool call more
        * than once inside the same provider round.
        */
        if (
          executedThisRound.has(
            callKey
          )
        ) {
          const duplicateResult = {
            success: false,
            error:
              "Duplicate tool call skipped.",
            duplicate: true,
          };

          messages.push({
            role: "tool",
            tool_call_id:
              toolCall.id,
            content:
              JSON.stringify(
                duplicateResult
              ),
          });

          continue;
        }

        executedThisRound.add(
          callKey
        );

        onStatus({
          type: "tool",
          toolName,
          message:
            this.getToolStatusMessage(
              toolName
            ),
        });

        let result;

        /*
        * Reuse a successful identical result instead
        * of executing a read-only tool repeatedly.
        */
        if (
          successfulResults.has(
            callKey
          )
        ) {
          result =
            successfulResults.get(
              callKey
            );
        } else {
          try {
            result =
              await runWithTimeout(
                toolName,
                args
              );

            successfulResults.set(
              callKey,
              result
            );

            failedCalls.delete(
              callKey
            );
          } catch (error) {
            const failureCount =
              (failedCalls.get(
                callKey
              ) || 0) + 1;

            failedCalls.set(
              callKey,
              failureCount
            );

            result = {
              success: false,
              error:
                error.message ||
                "Tool execution failed",
              statusCode:
                error.statusCode ||
                500,
            };

            /*
            * Stop repeated identical failures instead
            * of allowing the model to loop forever.
            */
            if (
              failureCount >= 2
            ) {
              await ConversationService
                .saveToolResult(
                  context.user,
                  context.conversationId,
                  toolName,
                  result
                );

              messages.push({
                role: "tool",
                tool_call_id:
                  toolCall.id,
                content:
                  JSON.stringify(
                    result
                  ),
              });

              const repeatedError =
                new Error(
                  `Tool "${toolName}" failed repeatedly: ${result.error}`
                );

              repeatedError.statusCode =
                result.statusCode;

              throw repeatedError;
            }
          }
        }

        await ConversationService
          .saveToolResult(
            context.user,
            context.conversationId,
            toolName,
            result
          );

        messages.push({
          role: "tool",
          tool_call_id:
            toolCall.id,
          content:
            JSON.stringify(result),
        });

        /*
        * A confirmation response must be shown to the
        * user. Do not let the model immediately invent
        * a confirmation ID and call the tool again.
        */
        if (
          result?.requiresConfirmation
        ) {
          return {
              requiresConfirmation: true,
              confirmation: result,
            };
        }
      }

      // if (
      //   confirmationRequested
      // ) {
      //   return;
      // }
    }

    // const error = new Error(
    //   "Maximum number of tool rounds exceeded."
    // );

    // error.statusCode = 508;
    // throw error;
  }

  getToolStatusMessage(toolName) {
    const messages = {
      get_my_exams: "Loading your exams...",
      get_exam: "Loading exam details...",
      get_notifications: "Loading notifications...",
      get_my_submissions: "Loading your submissions...",
      get_my_scores: "Loading your scores...",
      get_all_submissions: "Loading submissions...",
      generate_exam: "Creating the exam draft...",
      generate_exam_from_material:
        "Generating an exam from the course material...",
      publish_exam: "Preparing the exam for publication...",
      delete_exam: "Preparing the deletion request...",
      get_exam_statistics:
        "Calculating exam statistics...",
      search_course_materials:
        "Searching course materials...",
      list_course_materials:
        "Loading course materials...",
      get_course_materials_summary:
        "Reviewing uploaded materials...",
      delete_course_material:
        "Preparing the document deletion...",
      get_system_stats:
        "Loading system statistics...",
      get_all_users: "Loading users...",
      get_audit_logs: "Loading audit logs...",
    };

    return (
      messages[toolName] ||
      "Using application data..."
    );
  }
}

export default new AIService();