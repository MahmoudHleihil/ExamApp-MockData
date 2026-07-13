import "dotenv/config";

import UserRepository from
  "../repositories/UserRepository.js";

import DocumentRepository from
  "../repositories/DocumentRepository.js";

import { closeDatabase } from
  "../config/database.js";

try {
  const teacher =
    await UserRepository
      .findByEmail(
        "teacher@etest.com"
      );

  if (!teacher) {
    throw new Error(
      "Teacher not found"
    );
  }

  const documents =
    await DocumentRepository
      .findAccessibleForUser(
        teacher
      );

  console.log(
    "Accessible documents:"
  );

  console.table(
    documents.map(
      (document) => ({
        id: document.id,
        title:
          document.title,

        chunks:
          document.chunksCount,

        visibility:
          document.visibility,

        status:
          document.processingStatus,
      })
    )
  );

  const search =
    await DocumentRepository
      .searchChunks({
        query:
          "quantum annealing",

        user: teacher,

        limit: 5,
      });

  console.log(
    "Search results:"
  );

  console.dir(search, {
    depth: 5,
  });
} catch (error) {
  console.error(
    "Document repository test failed:",
    {
      message:
        error.message,

      code:
        error.code,

      detail:
        error.detail,
    }
  );

  process.exitCode = 1;
} finally {
  await closeDatabase();
}