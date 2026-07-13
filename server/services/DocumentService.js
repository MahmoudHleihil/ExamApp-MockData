import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

import DocumentRepository from
  "../repositories/DocumentRepository.js";

class DocumentService {
  async uploadDocument(
    file,
    user,
    options = {}
  ) {
    if (!file) {
      const error = new Error(
        "PDF file is required"
      );

      error.statusCode = 400;
      throw error;
    }

    if (!user?.id) {
      const error = new Error(
        "Authentication required"
      );

      error.statusCode = 401;
      throw error;
    }

    if (
      !["Teacher", "Admin"].includes(
        user.role
      )
    ) {
      const error = new Error(
        "Only teachers and admins can upload course materials"
      );

      error.statusCode = 403;
      throw error;
    }

    if (
      file.mimetype !==
      "application/pdf"
    ) {
      const error = new Error(
        "Only PDF files are allowed"
      );

      error.statusCode = 400;
      throw error;
    }

    let parsedText = "";
    let pageCount = null;

    try {
      const buffer =
        await fs.readFile(
          file.path
        );

      const parser =
        new PDFParse({
          data: buffer,
        });

      const parsed =
        await parser.getText();

      parsedText =
        parsed?.text || "";

      pageCount =
        parsed?.total ||
        parsed?.pages?.length ||
        null;

      if (
        typeof parser.destroy ===
        "function"
      ) {
        await parser.destroy();
      }
    } catch (error) {
      await fs
        .unlink(file.path)
        .catch(() => {});

      const parseError =
        new Error(
          `Failed to extract PDF text: ${error.message}`
        );

      parseError.statusCode = 422;
      throw parseError;
    }

    const chunks =
      this.chunkText(parsedText).map(
        (text, index) => ({
          chunkIndex: index,
          text,
          tokenCount:
            this.estimateTokenCount(
              text
            ),

          metadata: {
            source:
              file.originalname,
          },
        })
      );

    if (chunks.length === 0) {
      await fs
        .unlink(file.path)
        .catch(() => {});

      const error = new Error(
        "No extractable text was found in the PDF"
      );

      error.statusCode = 422;
      throw error;
    }

    try {
      const result =
        await DocumentRepository
          .createWithChunks(
            {
              title:
                file.originalname,

              originalFilename:
                file.originalname,

              storedFilename:
                file.filename,

              storagePath:
                file.path,

              mimeType:
                file.mimetype,

              uploadedBy:
                user.id,

              uploadedByRole:
                user.role,

              visibility:
                options.visibility ||
                "private",

              courseId:
                options.courseId ||
                null,

              fileSizeBytes:
                file.size,

              pageCount,

              processingStatus:
                "ready",
            },

            chunks
          );

      return {
        document:
          result.document,

        chunksCreated:
          result.chunksCreated,
      };
    } catch (error) {
      await fs
        .unlink(file.path)
        .catch(() => {});

      throw error;
    }
  }

  chunkText(
    text,
    size = 1200,
    overlap = 200
  ) {
    const clean = String(text || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean) {
      return [];
    }

    const chunks = [];
    const step =
      Math.max(
        1,
        size - overlap
      );

    for (
      let start = 0;
      start < clean.length;
      start += step
    ) {
      const chunk =
        clean
          .slice(
            start,
            start + size
          )
          .trim();

      if (chunk) {
        chunks.push(chunk);
      }
    }

    return chunks;
  }

  estimateTokenCount(text) {
    return Math.ceil(
      String(text || "").length /
        4
    );
  }

  async listCourseMaterials(
    user
  ) {
    this.requireUser(user);

    const documents =
      await DocumentRepository
        .findAccessibleForUser(user);

    return documents.map(
      (document) => ({
        documentId:
          document.id,

        title:
          document.title,

        mimeType:
          document.mimeType,

        uploadedBy:
          document.uploadedBy,

        uploadedByRole:
          document.uploadedByRole,

        visibility:
          document.visibility,

        chunksCount:
          document.chunksCount ||
          0,

        pageCount:
          document.pageCount,

        fileSizeBytes:
          document.fileSizeBytes,

        processingStatus:
          document.processingStatus,

        createdAt:
          document.createdAt,
      })
    );
  }

  async searchDocuments(
    query,
    user,
    documentId = null
  ) {
    this.requireUser(user);

    return DocumentRepository
      .searchChunks({
        query,
        user,
        documentId,
        limit: 8,
      });
  }

  async findDocumentByTitle(
    title,
    user
  ) {
    this.requireUser(user);

    const documents =
      await DocumentRepository
        .findByTitle(
          title,
          user
        );

    return documents[0] || null;
  }

  async getDocumentTopics(
    user
  ) {
    this.requireUser(user);

    const documents =
      await DocumentRepository
        .findAccessibleForUser(
          user
        );

    const results = [];

    for (const document of documents) {
      const chunks =
        await DocumentRepository
          .getChunks(
            document.id,
            {
              limit: 5,
            }
          );

      results.push({
        documentTitle:
          document.title,

        documentId:
          document.id,

        chunksCount:
          document.chunksCount ||
          chunks.length,

        preview:
          chunks.map(
            (chunk) =>
              chunk.text.slice(
                0,
                500
              )
          ),
      });
    }

    return results;
  }

  async getCourseMaterialsSummary(
    user
  ) {
    this.requireUser(user);

    const documents =
      await DocumentRepository
        .findAccessibleForUser(
          user
        );

    const summaries = [];

    for (const document of documents) {
      const chunks =
        await DocumentRepository
          .getChunks(
            document.id,
            {
              limit: 3,
            }
          );

      summaries.push({
        documentId:
          document.id,

        title:
          document.title,

        uploadedBy:
          document.uploadedBy,

        uploadedByRole:
          document.uploadedByRole,

        visibility:
          document.visibility,

        chunksCount:
          document.chunksCount ||
          chunks.length,

        preview:
          chunks.map(
            (chunk) =>
              chunk.text.slice(
                0,
                700
              )
          ),

        createdAt:
          document.createdAt,
      });
    }

    return summaries;
  }

  async deleteCourseMaterial(
    documentId,
    user
  ) {
    this.requireUser(user);

    const document =
      await DocumentRepository
        .findById(documentId);

    if (!document) {
      const error = new Error(
        "Course material not found"
      );

      error.statusCode = 404;
      throw error;
    }

    if (
      user.role !== "Admin" &&
      document.uploadedBy !==
        user.id
    ) {
      const error = new Error(
        "Forbidden: You can only delete materials you uploaded"
      );

      error.statusCode = 403;
      throw error;
    }

    const deleted =
      await DocumentRepository
        .delete(documentId);

    if (!deleted) {
      const error = new Error(
        "Course material not found"
      );

      error.statusCode = 404;
      throw error;
    }

    await fs
      .unlink(deleted.path)
      .catch((error) => {
        if (
          error.code !== "ENOENT"
        ) {
          console.error(
            "Failed to remove stored PDF:",
            {
              documentId,
              path:
                deleted.path,

              message:
                error.message,
            }
          );
        }
      });

    return {
      success: true,

      deletedDocument: {
        documentId:
          deleted.id,

        title:
          deleted.title,
      },
    };
  }

  async getDebugInfo() {
    return DocumentRepository
      .getDebugInfo();
  }

  requireUser(user) {
    if (!user?.id || !user?.role) {
      const error = new Error(
        "Authentication required"
      );

      error.statusCode = 401;
      throw error;
    }
  }
}

export default new DocumentService();