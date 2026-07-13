import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import DocumentService from "../../../services/DocumentService.js";

const listCourseMaterials = new MCPTool({
  name: "list_course_materials",
  description:
    "List uploaded course material PDFs with titles, upload dates, and chunk counts.",
  permissions: ["Student", "Teacher", "Admin"],

  schema: z.object({}),

  openAiSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },

  async execute(args, context) {
    return DocumentService.listCourseMaterials(context.user);
  },
});

registry.register(listCourseMaterials);

export default listCourseMaterials;