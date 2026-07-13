import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import ExamService from "../../../services/ExamService.js";

const getMyScores = new MCPTool({
  name: "get_my_scores",
  description: "Get visible scores for the current logged-in student",
  permissions: ["Student"],
  schema: z.object({}),

  async execute(args, context) {
    const submissions = await ExamService.getStudentSubmissions(context.user);

    return submissions
      .filter((s) => s.isFeedbackVisible === true)
      .map((s) => ({
        examTitle: s.examTitle,
        score: s.score,
        feedback: s.feedback,
        date: s.date,
      }));
  },
});

registry.register(getMyScores);

export default getMyScores;