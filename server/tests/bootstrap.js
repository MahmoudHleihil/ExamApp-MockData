import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",

  // Local .env.test values are used only when the
  // variable was not already supplied by CI.
  override: false,
});

if (process.env.NODE_ENV !== "test") {
  throw new Error(
    "Integration tests require NODE_ENV=test."
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
  !databaseName ||
  !databaseName.toLowerCase().includes("test")
) {
  throw new Error(
    `Refusing to run integration tests against non-test database "${databaseName}".`
  );
}