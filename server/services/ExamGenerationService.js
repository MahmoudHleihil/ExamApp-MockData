import LLMProvider from "../ai/LLMProvider.js";
import ExamService from "./ExamService.js";
import DocumentService from "./DocumentService.js";
import EntityResolverService from "./EntityResolverService.js";

class ExamGenerationService {
  async generateFromMaterial(
    {
      documentId,
      documentTitle,
      title,
      subject,
      difficulty = "medium",
      questionCount = 5,
      questionTypes = ["multiple-choice"],
      topic = "main concepts definitions examples",
    },
    user
  ) {
    const document = await EntityResolverService.resolveDocument(
      {
        documentId,
        documentTitle,
      },
      user
    );

    const searchResults = await DocumentService.searchDocuments(
      topic,
      user,
      document.documentId
    );

    let sourceChunks = searchResults.map((result) => result.text);

    if (sourceChunks.length === 0) {
      const summaries =
        await DocumentService.getCourseMaterialsSummary(user);

      const selectedDocument = summaries.find(
        (item) => item.documentId === document.documentId
      );

      sourceChunks = selectedDocument?.preview || [];
    }

    if (sourceChunks.length === 0) {
      const error = new Error(
        "No extractable text was found in the selected document."
      );
      error.statusCode = 422;
      throw error;
    }

    const sourceText = sourceChunks
      .slice(0, 8)
      .map(
        (chunk, index) =>
          `SOURCE CHUNK ${index + 1}\n${chunk}`
      )
      .join("\n\n");

    const requestedContext = [
      title,
      subject,
      topic,
    ]
      .filter(Boolean)
      .join(" ");

    const relevance = this.calculateRelevance(
      requestedContext,
      sourceChunks.join(" ")
    );

    if (relevance === 0 && topic) {
      const error = new Error(
        `The requested topic "${topic}" does not appear to match the selected document "${document.title}".`
      );

      error.statusCode = 422;
      throw error;
    }

    const generatedExam = await this.generateStructuredExam({
      sourceText,
      title:
        title ||
        `Exam from ${document.title.replace(/\.pdf$/i, "")}`,
      subject: subject || "Course Material",
      difficulty,
      questionCount,
      questionTypes,
    });

    const validatedQuestions =
      this.validateQuestionsAgainstSource(
        generatedExam.questions,
        sourceText
      );

    if (validatedQuestions.length === 0) {
      const error = new Error(
        "The AI could not generate grounded questions from the selected material."
      );
      error.statusCode = 422;
      throw error;
    }

    return ExamService.createExam(
      {
        title: generatedExam.title,
        description:
          generatedExam.description ||
          `Generated from ${document.title}`,
        subject: generatedExam.subject || subject || "",
        difficulty,
        sourceDocumentId: document.documentId,
        sourceDocumentTitle: document.title,
        published: false,
        isPublished: false,
        releaseScoresImmediately: false,
        questions: validatedQuestions.map((question) => ({
          type: question.type,
          text: question.question,
          question: question.question,
          options:
            question.type === "true-false"
              ? question.options?.length
                ? question.options
                : ["True", "False"]
              : question.options || [],
          correctAnswer: question.correctAnswer,
          points: question.points || 1,
          sourceEvidence: question.sourceEvidence,
        })),
      },
      user
    );
  }

  calculateRelevance(query = "", source = "") {
    const stopWords = new Set([
      "the",
      "and",
      "from",
      "with",
      "exam",
      "quiz",
      "medium",
      "easy",
      "hard",
      "general",
    ]);

    const queryWords = this.normalize(query)
      .split(" ")
      .filter(
        (word) =>
          word.length > 3 &&
          !stopWords.has(word)
      );

    const normalizedSource = this.normalize(source);

    return queryWords.filter((word) =>
      normalizedSource.includes(word)
    ).length;
  }

  async generateStructuredExam({
    sourceText,
    title,
    subject,
    difficulty,
    questionCount,
    questionTypes,
  }) {
    const response = await LLMProvider.createChatCompletion({
      response_format: {
        type: "json_object",
      },

      messages: [
        {
          role: "system",
          content: `
You generate exams using only supplied source text.

Rules:
1. Do not use outside knowledge.
2. Every question must be directly supported by the source.
3. Every answer must be explicitly supported by the source.
4. Include a short sourceEvidence quotation or close paraphrase for every question.
5. Do not create generic questions unrelated to the source.
6. If there is insufficient material, generate fewer questions.
7. Return valid JSON only.
          `.trim(),
        },
        {
          role: "user",
          content: `
Generate a grounded exam.

Title: ${title}
Subject: ${subject}
Difficulty: ${difficulty}
Maximum questions: ${questionCount}
Allowed question types: ${questionTypes.join(", ")}

Required JSON format:

{
  "title": "string",
  "description": "string",
  "subject": "string",
  "questions": [
    {
      "type": "multiple-choice | multiple-response | true-false | written",
      "question": "string",
      "options": ["string"],
      "correctAnswer": "string or array",
      "points": 1,
      "sourceEvidence": "text from the source supporting this question"
    }
  ]
}

SOURCE MATERIAL:

${sourceText}
          `.trim(),
        },
      ],
    });

    const content =
      response?.choices?.[0]?.message?.content;

    if (!content) {
      const error = new Error(
        "The AI provider returned an empty exam response."
      );
      error.statusCode = 502;
      throw error;
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      console.error("Invalid generated exam JSON:", content);

      const parseError = new Error(
        "The AI provider returned invalid exam JSON."
      );
      parseError.statusCode = 502;
      throw parseError;
    }
  }

  validateQuestionsAgainstSource(questions, sourceText) {
    if (!Array.isArray(questions)) {
      return [];
    }

    const normalizedSource = this.normalize(sourceText);

    return questions.filter((question) => {
      if (
        !question?.question ||
        !question?.correctAnswer ||
        !question?.sourceEvidence
      ) {
        return false;
      }

      const evidenceWords = this.normalize(
        question.sourceEvidence
      )
        .split(" ")
        .filter((word) => word.length > 3);

      if (evidenceWords.length === 0) {
        return false;
      }

      const matchingWords = evidenceWords.filter((word) =>
        normalizedSource.includes(word)
      );

      const evidenceScore =
        matchingWords.length / evidenceWords.length;

      return evidenceScore >= 0.5;
    });
  }

  normalize(value = "") {
    return String(value)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

export default new ExamGenerationService();