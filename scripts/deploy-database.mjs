import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

dotenv.config({ path: ".env.local", quiet: true });
if (
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes("your-neon-hostname")
) {
  console.error(
    "Set DATABASE_URL to a real PostgreSQL database before deploying member tools.",
  );
  process.exit(1);
}
const result = spawnSync(
  process.execPath,
  [
    resolve("node_modules/prisma/build/index.js"),
    "db",
    "execute",
    "--file",
    resolve("prisma/bootstrap.sql"),
    "--schema",
    resolve("prisma/schema.prisma"),
  ],
  { stdio: "inherit", env: process.env },
);
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
