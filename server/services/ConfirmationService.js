import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DB_FILE = path.resolve(process.cwd(), "data/confirmations.json");

function readConfirmations() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, "[]");
  }

  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function writeConfirmations(confirmations) {
  fs.writeFileSync(DB_FILE, JSON.stringify(confirmations, null, 2));
}

class ConfirmationService {
  create({ user, toolName, args }) {
    const confirmations = readConfirmations();

    const confirmation = {
      id: randomUUID(),
      userId: user.id,
      toolName,
      args,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };

    confirmations.push(confirmation);
    writeConfirmations(confirmations);

    return confirmation;
  }

  findValid(id, user, toolName) {
    const confirmations = readConfirmations();

    console.log("Looking for confirmation:", {
      id,
      userId: user.id,
      toolName,
    });

    console.log("Existing confirmations:", confirmations);

    return (
      confirmations.find(
        (c) =>
          c.id === id &&
          c.userId === user.id &&
          c.toolName === toolName &&
          c.status === "pending" &&
          new Date(c.expiresAt).getTime() > Date.now()
      ) || null
    );
  }

  approve(id) {
    const confirmations = readConfirmations();

    const confirmation = confirmations.find((c) => c.id === id);

    if (confirmation) {
      confirmation.status = "approved";
      confirmation.approvedAt = new Date().toISOString();
    }

    writeConfirmations(confirmations);

    return confirmation;
  }
}

export default new ConfirmationService();