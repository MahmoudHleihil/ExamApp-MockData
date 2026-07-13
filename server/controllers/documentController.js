import DocumentService from "../services/DocumentService.js";

export const uploadDocument =
  async (req, res, next) => {
    try {
      const result =
        await DocumentService
          .uploadDocument(
            req.file,
            req.user,
            {
              visibility:
                req.body.visibility ||
                "private",

              courseId:
                req.body.courseId ||
                null,
            }
          );

      res.status(201).json(
        result
      );
    } catch (error) {
      next(error);
    }
  };

export const listDocuments =
  async (req, res, next) => {
    try {
      const documents =
        await DocumentService
          .listCourseMaterials(
            req.user
          );

      res.json(documents);
    } catch (error) {
      next(error);
    }
  };

export const deleteDocument =
  async (req, res, next) => {
    try {
      const result =
        await DocumentService
          .deleteCourseMaterial(
            req.params.id,
            req.user
          );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };