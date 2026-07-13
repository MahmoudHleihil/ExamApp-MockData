import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import ExamService from "../../../services/ExamService.js";

const createExam = new MCPTool({
  name: "create_exam",
  description: "Create a new exam. Only teachers and admins can use this.",
  permissions: ["Teacher", "Admin"],
  schema: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    questions: z.array(z.any()).default([]),
  }),

  async execute(args, context) {
    return ExamService.createExam(args, context.user);
  },
});

registry.register(createExam);

export default createExam;