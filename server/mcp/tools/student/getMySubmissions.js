import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import ExamService from "../../../services/ExamService.js";

const getMySubmissions = new MCPTool({
  name: "get_my_submissions",
  description: "Get exam submissions for the current logged-in student",
  permissions: ["Student"],
  schema: z.object({}),

  async execute(args, context) {
    return ExamService.getStudentSubmissions(context.user);
  },
});

registry.register(getMySubmissions);

export default getMySubmissions;