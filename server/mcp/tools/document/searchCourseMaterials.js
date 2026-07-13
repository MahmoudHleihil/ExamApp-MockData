import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import DocumentService from "../../../services/DocumentService.js";
import EntityResolverService from "../../../services/EntityResolverService.js";

const searchCourseMaterials = new MCPTool({
  name: "search_course_materials",

  description:
    "Search uploaded course materials. When a document title is provided, resolve it and search only that document. Use returned text as the factual source.",

  permissions: ["Student", "Teacher", "Admin"],

  schema: z.object({
    query: z.string().min(1),
    documentId: z.string().optional(),
    documentTitle: z.string().optional(),
  }),

  openAiSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "The topic or information to search for in the course material.",
      },
      documentId: {
        type: "string",
        description:
          "A real document ID returned by list_course_materials.",
      },
      documentTitle: {
        type: "string",
        description:
          "The exact or partial uploaded PDF title.",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },

  async execute(args, context) {
    let documentId = args.documentId;

    if (!documentId && args.documentTitle) {
      const document =
        await EntityResolverService.resolveDocument(
          {
            documentTitle: args.documentTitle,
          },
          context.user
        );

      documentId = document.documentId;
    }

    return DocumentService.searchDocuments(
      args.query,
      context.user,
      documentId
    );
  },
});

registry.register(searchCourseMaterials);

export default searchCourseMaterials;