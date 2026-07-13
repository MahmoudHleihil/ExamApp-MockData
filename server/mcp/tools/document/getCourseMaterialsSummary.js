import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import DocumentService from "../../../services/DocumentService.js";

const getCourseMaterialsSummary = new MCPTool({
  name: "get_course_materials_summary",
  description:
    "List uploaded course materials and show previews of their content. Use this when the user asks what topics or documents are uploaded.",
  permissions: ["Student", "Teacher", "Admin"],
  schema: z.object({}),
  openAiSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },

  async execute(args, context) {
    return DocumentService.getCourseMaterialsSummary(context.user);
  },
});

registry.register(getCourseMaterialsSummary);

export default getCourseMaterialsSummary;