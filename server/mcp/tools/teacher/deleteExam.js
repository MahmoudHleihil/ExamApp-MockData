import { z } from "zod";

import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import ExamService from "../../../services/ExamService.js";
import EntityResolverService from "../../../services/EntityResolverService.js";

const deleteExam = new MCPTool({
  name: "delete_exam",

  description:
    "Delete an exam. Provide either a real examId or an exact examTitle. If confirmation is required, call the tool again using exactly the confirmationId returned by the server. Never invent exam IDs or confirmation IDs.",

  permissions: [
    "Teacher",
    "Admin",
  ],

  requiresConfirmation: true,

  schema: z
    .object({
      examId: z
        .string()
        .trim()
        .min(1)
        .optional(),

      examTitle: z
        .string()
        .trim()
        .min(1)
        .optional(),

      confirmationId: z
        .string()
        .trim()
        .uuid()
        .optional(),
    })
    .refine(
      (args) =>
        Boolean(
          args.examId ||
          args.examTitle
        ),
      {
        message:
          "examId or examTitle is required",
      }
    ),

  openAiSchema: {
    type: "object",

    properties: {
      examId: {
        type: "string",
        description:
          "A real exam ID returned by get_my_exams. Provide either examId or examTitle. Never invent this value.",
      },

      examTitle: {
        type: "string",
        description:
          "The exact exam title returned by get_my_exams. Provide either examTitle or examId.",
      },

      confirmationId: {
        type: "string",
        description:
          "The exact confirmation ID returned by the first delete_exam call. Include it only when confirming deletion. Never invent it.",
      },
    },

    required: [],

    additionalProperties: false,
  },

  async execute(
    args,
    context
  ) {
    const exam =
      await EntityResolverService
        .resolveExam(
          {
            examId:
              args.examId,

            examTitle:
              args.examTitle,
          },

          context.user
        );

    const deleted =
      await ExamService
        .deleteExam(
          exam.id,
          context.user
        );

    return {
      success: true,
      deleted: true,

      examId:
        deleted.id,

      title:
        deleted.title,

      message:
        `Exam "${deleted.title}" was deleted successfully.`,
    };
  },
});

registry.register(
  deleteExam
);

export default deleteExam;