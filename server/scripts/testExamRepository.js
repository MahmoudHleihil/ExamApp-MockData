import "dotenv/config";

import ExamRepository from "../repositories/ExamRepository.js";
import { closeDatabase } from "../config/database.js";

try {
  const exams =
    await ExamRepository.findAll();

  console.log(
    `Found ${exams.length} exams`
  );

  console.dir(exams, {
    depth: 5,
  });

  const reactExam =
    await ExamRepository.findById("1");

  console.log(
    "React exam:",
    reactExam
  );
} catch (error) {
  console.error(
    "Exam repository test failed:",
    error
  );

  process.exitCode = 1;
} finally {
  await closeDatabase();
}