import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import ExamGenerationService from "../../../services/ExamGenerationService.js";

const generateExamFromMaterial = new MCPTool({
  name: "generate_exam_from_material",

  description:
    "Generate a draft exam using only the selected uploaded PDF. Infer the subject and topic from the PDF unless the user explicitly supplies matching values. Never reuse subject or topic values from an earlier unrelated request.",

  permissions: ["Teacher", "Admin"],

  schema: z.object({
    documentId: z.string().optional(),
    documentTitle: z.string().optional(),
    title: z.string().optional(),
    subject: z.string().optional(),
    difficulty: z
      .enum(["easy", "medium", "hard"])
      .default("medium"),
    questionCount: z.number().int().min(1).max(20).default(5),
    questionTypes: z
      .array(
        z.enum([
          "multiple-choice",
          "multiple-response",
          "true-false",
          "written",
        ])
      )
      .default(["multiple-choice"]),
    topic: z.string().optional(),
  }),

  openAiSchema: {
    type: "object",
    properties: {
      documentId: {
        type: "string",
        description:
          "Real document ID returned by list_course_materials.",
      },
      documentTitle: {
        type: "string",
        description:
          "Exact or partial uploaded PDF title.",
      },
      title: {
        type: "string",
        description: "Title for the generated exam.",
      },
      subject: {
        type: "string",
        description: "Optional subject that must match the selected PDF. Omit it if uncertain.",
      },
      difficulty: {
        type: "string",
        enum: ["easy", "medium", "hard"],
      },
      questionCount: {
        type: "integer",
        minimum: 1,
        maximum: 20,
      },
      questionTypes: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "multiple-choice",
            "multiple-response",
            "true-false",
            "written",
          ],
        },
      },
      topic: {
        type: "string",
        description:
          "Optional topic found inside the selected PDF. Never invent or reuse an unrelated topic.",
      },
    },
    additionalProperties: false,
  },

  async execute(args, context) {
    return ExamGenerationService.generateFromMaterial(
      args,
      context.user
    );
  },
});

registry.register(generateExamFromMaterial);

export default generateExamFromMaterial;