import express from "express";
import multer from "multer";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { uploadDocument, listDocuments, deleteDocument } from "../controllers/documentController.js";

import fs from "fs";
import path from "path";

const router = express.Router();

const uploadDirectory =
  path.resolve(
    process.cwd(),
    "uploads",
    "course-materials"
  );

fs.mkdirSync(
  uploadDirectory,
  {
    recursive: true,
  }
);

const storage =
  multer.diskStorage({
    destination(
      req,
      file,
      callback
    ) {
      callback(
        null,
        uploadDirectory
      );
    },

    filename(
      req,
      file,
      callback
    ) {
      const safeName =
        file.originalname
          .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );

      callback(
        null,
        `${Date.now()}-${safeName}`
      );
    },
  });

const upload = multer({
  storage,

  limits: {
    fileSize:
      10 * 1024 * 1024,
  },

  fileFilter(
    req,
    file,
    callback
  ) {
    if (
      file.mimetype !==
      "application/pdf"
    ) {
      const error = new Error(
        "Only PDF files are allowed"
      );

      error.statusCode = 400;

      return callback(
        error
      );
    }

    callback(null, true);
  },
});

router.get(
  "/",
  authenticate,
  authorize("Teacher", "Admin"),
  listDocuments
);

router.post(
  "/upload",
  authenticate,
  authorize("Teacher", "Admin"),
  upload.single("file"),
  uploadDocument
);

router.delete(
  "/:id",
  authenticate,
  authorize("Teacher", "Admin"),
  deleteDocument
);

export default router;