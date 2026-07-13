import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import ExamService from "../../../services/ExamService.js";

const getExam = new MCPTool({
  name: "get_exam",

  description:
    "Return one exam by real examId. Do not call this with guessed IDs. If the examId is unknown, first call get_my_exams.",

  permissions: ["Student", "Teacher", "Admin"],

  schema: z.object({
    examId: z.string(),
  }),

  openAiSchema: {
    type: "object",
    properties: {
      examId: {
        type: "string",
        description: "Real exam ID returned by get_my_exams",
      },
    },
    required: ["examId"],
    additionalProperties: false,
  },

  async execute(args, context) {
    return ExamService.getExam(args.examId);
  },
});

registry.register(getExam);

export default getExam;