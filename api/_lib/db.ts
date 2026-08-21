import postgres, { type Sql } from "postgres";

let client: Sql | undefined;

export function db() {
  if (client) return client;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  client = postgres(connectionString, {
    connect_timeout: 15,
    idle_timeout: 20,
    max: 1,
    prepare: false,
    ssl: "verify-full",
  });

  return client;
}
