import { createHash, randomBytes } from "node:crypto";
import { chmod, open } from "node:fs/promises";
import { resolve } from "node:path";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const outputFlag = process.argv.indexOf("--output");
const outputValue = outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined;
if (!outputValue || outputValue.startsWith("--")) {
  fail("Usage: bun run mcp:token --output /secure/path/ditto-agent-token");
}

const outputPath = resolve(outputValue);
const token = randomBytes(32).toString("base64url");
const handle = await open(outputPath, "wx", 0o600).catch((error: NodeJS.ErrnoException) => {
  if (error.code === "EEXIST") fail(`Refusing to overwrite existing file: ${outputPath}`);
  fail(`Unable to create token file: ${error.message}`);
});

await handle.writeFile(`${token}\n`, { encoding: "utf8" });
await handle.close();
await chmod(outputPath, 0o600);

const digest = createHash("sha256").update(token).digest("hex");
console.log(`Token written with mode 0600: ${outputPath}`);
console.log(`DITTO_MCP_TOKEN_SHA256=${digest}`);
