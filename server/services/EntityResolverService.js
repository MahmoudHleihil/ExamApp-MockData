import ExamRepository from "../repositories/ExamRepository.js";
import DocumentRepository from "../repositories/DocumentRepository.js";
import DocumentService from "./DocumentService.js";
import { mockDb } from "../data/mockDb.js";

class EntityResolverService {
  normalize(text = "") {
    return String(text)
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[_\-()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  scoreMatch(query, target) {
    const q = this.normalize(query);
    const t = this.normalize(target);

    if (!q || !t) return 0;
    if (q === t) return 100;
    if (t.includes(q)) return 80;
    if (q.includes(t)) return 70;

    const qWords = q.split(" ").filter(Boolean);
    const tWords = t.split(" ").filter(Boolean);

    const matches = qWords.filter((word) => tWords.includes(word)).length;

    return matches > 0 ? Math.round((matches / qWords.length) * 60) : 0;
  }

  bestMatch(query, items, getName) {
    const ranked = items
      .map((item) => ({
        item,
        score: this.scoreMatch(query, getName(item)),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    return ranked[0] || null;
  }

  async resolveExam({ examId, examTitle }, user) {
    if (examId) {
      const exam =
        await ExamRepository.findById(examId);

      if (!exam) {
        const error = new Error(
          `Exam not found: ${examId}. Use get_my_exams to obtain a real exam ID.`
        );

        error.statusCode = 404;
        throw error;
      }

      return exam;
    }

    if (!examTitle) {
      const error = new Error(
        "examId or examTitle is required"
      );

      error.statusCode = 400;
      throw error;
    }

    const exams =
      user.role === "Admin"
        ? await ExamRepository.findAll()
        : user.role === "Teacher"
          ? await ExamRepository.findByCreator(user.id)
          : await ExamRepository.findPublished();

    const normalizedTitle =
      this.normalize(examTitle);

    const exactMatches = exams.filter(
      (exam) =>
        this.normalize(exam.title) ===
        normalizedTitle
    );

    if (exactMatches.length === 1) {
      return exactMatches[0];
    }

    if (exactMatches.length > 1) {
      const error = new Error(
        `Multiple exams have the title "${examTitle}". Use an exact exam ID.`
      );

      error.statusCode = 409;
      throw error;
    }

    const partialMatches = exams.filter(
      (exam) =>
        this.normalize(exam.title).includes(
          normalizedTitle
        )
    );

    if (partialMatches.length === 1) {
      return partialMatches[0];
    }

    const error = new Error(
      `Could not uniquely resolve exam "${examTitle}".`
    );

    error.statusCode = 404;
    throw error;
  }

  async resolveDocument(
    {
      documentId,
      documentTitle,
      query,
    },
    user
  ) {
    if (documentId) {
      const document =
        await DocumentRepository
          .findById(documentId);

      if (
        document &&
        (
          user.role === "Admin" ||
          document.uploadedBy ===
            user.id ||
          document.visibility ===
            "public" ||
          (
            document.visibility ===
              "students" &&
            user.role === "Student"
          ) ||
          (
            document.visibility ===
              "teachers" &&
            ["Teacher", "Admin"]
              .includes(user.role)
          )
        )
      ) {
        return {
          ...document,
          documentId:
            document.id,
        };
      }
    }

    const searchText =
      documentTitle || query;

    if (!searchText) {
      const error = new Error(
        "documentId or documentTitle is required"
      );

      error.statusCode = 400;
      throw error;
    }

    const documents =
      await DocumentRepository
        .findByTitle(
          searchText,
          user
        );

    if (documents.length === 0) {
      const error = new Error(
        `Could not resolve document: ${searchText}`
      );

      error.statusCode = 404;
      throw error;
    }

    if (documents.length > 1) {
      const exactMatch =
        documents.find(
          (document) =>
            this.normalize(
              document.title
            ) ===
            this.normalize(
              searchText
            )
        );

      if (exactMatch) {
        return {
          ...exactMatch,
          documentId:
            exactMatch.id,
        };
      }
    }

    return {
      ...documents[0],
      documentId:
        documents[0].id,
    };
  }

  async resolveUser({ userId, fullName, email, query }) {
    const users = mockDb.users || [];

    if (userId) {
      const user = users.find((u) => u.id === userId);
      if (user) return user;
    }

    if (email) {
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (user) return user;
    }

    const searchText = fullName || query;

    if (!searchText) {
      const error = new Error("userId, email, or fullName is required");
      error.statusCode = 400;
      throw error;
    }

    const match = this.bestMatch(searchText, users, (user) => user.fullName);

    if (!match || match.score < 40) {
      const error = new Error(`Could not resolve user: ${searchText}`);
      error.statusCode = 404;
      throw error;
    }

    return match.item;
  }
}

export default new EntityResolverService();