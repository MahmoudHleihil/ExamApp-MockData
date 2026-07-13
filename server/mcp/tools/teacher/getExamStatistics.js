import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import ExamService from "../../../services/ExamService.js";
import EntityResolverService from "../../../services/EntityResolverService.js";

const getExamStatistics = new MCPTool({
  name: "get_exam_statistics",
  description:
    "Get score statistics for an exam. Use examId if known, otherwise use exact examTitle from get_my_exams.",
  permissions: ["Teacher", "Admin"],

  schema: z.object({
    examId: z.string().optional(),
    examTitle: z.string().optional(),
  }),

  openAiSchema: {
    type: "object",
    properties: {
      examId: {
        type: "string",
        description: "Real exam ID returned by get_my_exams",
      },
      examTitle: {
        type: "string",
        description: "Exact exam title returned by get_my_exams",
      },
    },
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

    return ExamService.getExamStatistics(exam.id, context.user);
  },
});

registry.register(getExamStatistics);

export default getExamStatistics;