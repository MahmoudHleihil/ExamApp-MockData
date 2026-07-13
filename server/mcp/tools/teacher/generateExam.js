import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import ExamService from "../../../services/ExamService.js";

const questionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["multiple-choice", "multiple-response", "true-false", "written"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.any(),
  points: z.number().min(1).default(1),
});

const generateExam = new MCPTool({
  name: "generate_exam",
  description:
    "Generate and save a general draft exam from the user's topic and requirements. Use this when the exam is NOT based on an uploaded PDF or course material.",
  permissions: ["Teacher", "Admin"],

  schema: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    subject: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
    questions: z.array(
      z.object({
        type: z.enum([
          "multiple-choice",
          "multiple-response",
          "true-false",
          "written",
        ]),
        question: z.string().min(1),
        options: z.array(z.string()).optional(),
        correctAnswer: z.union([
          z.string(),
          z.array(z.string()),
        ]),
        points: z.number().min(1),
      })
    ).min(1),
  }),

  openAiSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
      },
      description: {
        type: "string",
      },
      subject: {
        type: "string",
      },
      difficulty: {
        type: "string",
        enum: ["easy", "medium", "hard"],
      },
      questions: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "multiple-choice",
                "multiple-response",
                "true-false",
                "written",
              ],
            },
            question: {
              type: "string",
            },
            options: {
              type: "array",
              items: {
                type: "string",
              },
            },
            correctAnswer: {
              oneOf: [
                { type: "string" },
                {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              ],
            },
            points: {
              type: "number",
              minimum: 1,
            },
          },
          required: [
            "type",
            "question",
            "correctAnswer",
            "points",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["title", "questions"],
    additionalProperties: false,
  },

  async execute(args, context) {
    const exam = {
      title: args.title,
      description: args.description || "",
      subject: args.subject || "",
      difficulty: args.difficulty || "medium",

      sourceDocumentId: args.sourceDocumentId || null,
      sourceDocumentTitle: args.sourceDocumentTitle || null,

      questions: args.questions.map((question, index) => ({
        id: question.id || `q${index + 1}`,
        ...question,
        text: question.text || question.question,
        question: question.question || question.text,
        options:
          question.type === "true-false"
            ? question.options?.length
              ? question.options
              : ["True", "False"]
            : question.options || [],
      })),

      published: false,
      isPublished: false,
      releaseScoresImmediately: false,
    };

    return ExamService.createExam(exam, context.user);
  },
});

registry.register(generateExam);

export default generateExam;