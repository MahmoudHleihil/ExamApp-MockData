import {
  verifyDatabase,
  closeDatabase,
} from "./database.js";

import {
  createAiWorker,
} from "./worker.js";

const database =
  await verifyDatabase();

console.log(
  "AI worker database connected",
  database
);

const worker =
  createAiWorker();

await worker.waitUntilReady();

console.log(
  "AI grading worker is ready"
);

let shuttingDown =
  false;

async function shutdown(
  signal
) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(
    `${signal} received`
  );

  await worker.close();
  await closeDatabase();

  process.exit(0);
}

process.on(
  "SIGTERM",
  () =>
    shutdown(
      "SIGTERM"
    )
);

process.on(
  "SIGINT",
  () =>
    shutdown(
      "SIGINT"
    )
);