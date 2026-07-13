import "./tools/exam/getMyExams.js";
import "./tools/exam/getExam.js";
import "./tools/notification/getNotifications.js";

import "./tools/student/getMySubmissions.js";
import "./tools/student/getMyScores.js";

import "./tools/teacher/getAllSubmissions.js";
// import "./tools/teacher/createExam.js";
import "./tools/teacher/deleteExam.js";
import "./tools/teacher/generateExam.js";
import "./tools/teacher/publishExam.js";
import "./tools/teacher/getExamStatistics.js";
import "./tools/teacher/generateExamFromMaterial.js";

import "./tools/admin/getSystemStats.js";
import "./tools/admin/getAllUsers.js";
import "./tools/admin/getAuditLogs.js";

import "./tools/document/searchCourseMaterials.js";
import "./tools/document/getCourseMaterialsSummary.js";
import "./tools/document/listCourseMaterials.js";
import "./tools/document/deleteCourseMaterial.js";
import "./tools/document/getMaterialForExam.js";

import registry from "./registry.js";

console.log(
  "Registered MCP tools:",
  registry.getAll().map((t) => `${t.name} [${t.permissions.join(", ")}]`)
);

export default registry;