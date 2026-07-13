import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import DocumentService from "../../../services/DocumentService.js";
import EntityResolverService from "../../../services/EntityResolverService.js";

const deleteCourseMaterial = new MCPTool({
  name: "delete_course_material",
  description:
    "Delete a course material by title or ID. Prefer documentTitle when the user gives a name. Requires confirmation.",
  permissions: ["Teacher", "Admin"],
  requiresConfirmation: true,

  schema: z.object({
    documentId: z.string().optional(),
    documentTitle: z.string().optional(),
    confirmationId: z.string().optional(),
  }),

  openAiSchema: {
    type: "object",
    properties: {
      documentId: {
        type: "string",
        description: "Document ID returned by list_course_materials",
      },
      documentTitle: {
        type: "string",
        description: "Document title or partial title, for example Lecture 7",
      },
      confirmationId: {
        type: "string",
        description:
          "Only use the exact confirmation ID returned by the server.",
      },
    },
    additionalProperties: false,
  },

  async execute(args, context) {
    const document = await EntityResolverService.resolveDocument(
      {
        documentId: args.documentId,
        documentTitle: args.documentTitle,
      },
      context.user
    );

    return DocumentService.deleteCourseMaterial(
      document.documentId,
      context.user
    );
  },
});

registry.register(deleteCourseMaterial);

export default deleteCourseMaterial;