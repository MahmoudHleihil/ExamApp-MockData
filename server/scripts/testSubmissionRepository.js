import "dotenv/config";

import SubmissionRepository from
  "../repositories/SubmissionRepository.js";

import { closeDatabase } from
  "../config/database.js";

try {
  const submissions =
    await SubmissionRepository.findAll();

  console.dir(submissions, {
    depth: 6,
  });

  const statistics =
    await SubmissionRepository
      .getExamStatistics("1");

  console.log(
    "React exam statistics:",
    statistics
  );
} catch (error) {
  console.error(
    "Submission repository test failed:",
    error
  );

  process.exitCode = 1;
} finally {
  await closeDatabase();
}