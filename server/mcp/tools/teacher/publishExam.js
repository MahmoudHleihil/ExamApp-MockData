import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import ExamService from "../../../services/ExamService.js";
import EntityResolverService from "../../../services/EntityResolverService.js";

const publishExam = new MCPTool({
  name: "publish_exam",
  description:
    "Publish an exam so students can see it. Requires confirmation.",
  permissions: ["Teacher", "Admin"],
  requiresConfirmation: true,

  schema: z.object({
    examId: z.string().optional(),
    examTitle: z.string().optional(),
    confirmationId: z.string().optional(),
  }),

  openAiSchema: {
    type: "object",
    properties: {
      examId: {
        type: "string",
        description: "The ID of the exam to publish",
      },
      confirmationId: {
        type: "string",
        description: "Confirmation ID returned by the first publish_exam call",
      },
      examTitle: {
        type: "string",
        description: "Exam title or partial title, for example React Fundamentals",
      },
    },
    required: ["examId"],
    additionalProperties: false,
  },

  async execute(args, context) {
    const exam = await EntityResolverService.resolveExam(
      {
        examId: args.examId,
        examTitle: args.examTitle,
      },
      context.user
    );

    return ExamService.publishExam(exam.id, context.user);
  },
});

registry.register(publishExam);

export default publishExam;