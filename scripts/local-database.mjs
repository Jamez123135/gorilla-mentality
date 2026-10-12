import EmbeddedPostgres from "embedded-postgres";
import dotenv from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

dotenv.config({ path: ".env.local", quiet: true });
const databaseUrl =
  "postgresql://gorilla:gorilla-local-only@127.0.0.1:54329/gorilla_mentality";
const configuredUrl = process.env.DATABASE_URL || "";
if (
  configuredUrl &&
  configuredUrl !== databaseUrl &&
  !configuredUrl.includes("your-neon-hostname")
) {
  throw new Error(
    "A different database is already configured. Local setup will not replace it.",
  );
}
const directory = resolve(".local/postgres");
mkdirSync(resolve(".local"), { recursive: true });
const postgres = new EmbeddedPostgres({
  databaseDir: directory,
  user: "gorilla",
  password: "gorilla-local-only",
  port: 54329,
  persistent: true,
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {},
  onError: (message) => console.error(String(message)),
});
if (!existsSync(resolve(directory, "PG_VERSION"))) await postgres.initialise();
await postgres.start();
const client = postgres.getPgClient("postgres", "127.0.0.1");
await client.connect();
const result = await client.query(
  "SELECT 1 FROM pg_database WHERE datname = $1",
  ["gorilla_mentality"],
);
await client.end();
if (!result.rowCount) await postgres.createDatabase("gorilla_mentality");
const envFile = existsSync(".env.local")
  ? readFileSync(".env.local", "utf8")
  : "";
const envLine = `DATABASE_URL="${databaseUrl}"`;
writeFileSync(
  ".env.local",
  /^DATABASE_URL\s*=.*$/m.test(envFile)
    ? envFile.replace(/^DATABASE_URL\s*=.*$/m, envLine)
    : `${envFile}\n${envLine}\n`,
);
console.log(
  "Local PostgreSQL ready on 127.0.0.1:54329. Data is retained in .local/postgres.",
);
process.on("SIGINT", async () => {
  await postgres.stop();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await postgres.stop();
  process.exit(0);
});
setInterval(() => {}, 60000);
