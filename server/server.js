import "dotenv/config";

import path from "path";

console.log("ENV loaded:", process.env.OPENROUTER_API_KEY ? "YES" : "NO");

await import("./app.js");