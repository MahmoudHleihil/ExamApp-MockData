import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",
  override: false,
});

if (process.env.NODE_ENV !== "test") {
  throw new Error(
    "NODE_ENV must be test before running test migrations."
  );
}

const databaseUrl =
  process.env.DATABASE_URL || "";

let databaseName = "";

try {
  databaseName =
    new URL(databaseUrl)
      .pathname
      .replace(/^\//, "");
} catch {
  throw new Error(
    "DATABASE_URL is missing or invalid."
  );
}

if (
  !databaseName.toLowerCase().includes("test")
) {
  throw new Error(
    `Refusing to migrate non-test database "${databaseName}".`
  );
}

console.log(
  `Migrating test database: ${databaseName}`
);

await import("./migrate.js");