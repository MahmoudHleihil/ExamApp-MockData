import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import DocumentService from "../../../services/DocumentService.js";
import EntityResolverService from "../../../services/EntityResolverService.js";

const getMaterialForExam = new MCPTool({
  name: "get_material_for_exam",

  description:
    "Retrieve relevant source content from one uploaded PDF before generating an exam. Teacher/Admin only. Always call this before generate_exam when the exam must be based on course material.",

  permissions: ["Teacher", "Admin"],

  schema: z.object({
    documentId: z.string().optional(),
    documentTitle: z.string().optional(),
    topic: z.string().default("main concepts definitions examples"),
  }),

  openAiSchema: {
    type: "object",
    properties: {
      documentId: {
        type: "string",
        description:
          "A real document ID returned by list_course_materials.",
      },
      documentTitle: {
        type: "string",
        description:
          "The exact or partial title of the uploaded PDF.",
      },
      topic: {
        type: "string",
        description:
          "Topics to retrieve for exam generation. Use 'main concepts definitions examples' when the entire document is requested.",
      },
    },
    additionalProperties: false,
  },

  async execute(args, context) {
    const document =
      await EntityResolverService.resolveDocument(
        {
          documentId: args.documentId,
          documentTitle: args.documentTitle,
        },
        context.user
      );

    const chunks = await DocumentService.searchDocuments(
      args.topic,
      context.user,
      document.documentId
    );

    if (chunks.length === 0) {
      // Return initial chunks when keyword scoring finds nothing.
      const summary =
        await DocumentService.getCourseMaterialsSummary(
          context.user
        );

      const selected = summary.find(
        (item) =>
          item.documentId === document.documentId
      );

      return {
        documentId: document.documentId,
        documentTitle: document.title,
        sourceChunks: selected?.preview || [],
      };
    }

    return {
      documentId: document.documentId,
      documentTitle: document.title,
      sourceChunks: chunks.map((chunk) => ({
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
      })),
    };
  },
});

registry.register(getMaterialForExam);

export default getMaterialForExam;