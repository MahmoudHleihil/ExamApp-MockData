import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import ExamService from "../../../services/ExamService.js";

const getAllSubmissions = new MCPTool({
  name: "get_all_submissions",
  description: "Get all student exam submissions for teachers and admins",
  permissions: ["Teacher", "Admin"],
  schema: z.object({}),

  async execute(args, context) {
    return ExamService.getAllSubmissions(context.user);
  },
});

registry.register(getAllSubmissions);

export default getAllSubmissions;