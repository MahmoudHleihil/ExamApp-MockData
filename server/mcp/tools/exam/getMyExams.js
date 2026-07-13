import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import ExamService from "../../../services/ExamService.js";

const getMyExams = new MCPTool({
  name: "get_my_exams",
  description: "Get exams available to the current user",
  permissions: ["Student", "Teacher", "Admin"],
  schema: z.object({}),

  async execute(args, context) {
    const exams = await ExamService.getUserExams(context.user);
    return exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      subject: exam.subject,
      difficulty: exam.difficulty,
      published: exam.published,
      questionCount:
        exam.questions?.length || 0,
    }));
  },
});

registry.register(getMyExams);

export default getMyExams;