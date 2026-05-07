import { mkdir, rm, writeFile } from "node:fs/promises";

const distDir = "dist";
const assetsDir = `${distDir}/assets`;
const buildEnv = {
  ...process.env,
  NODE_ENV: "production",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  VITE_DOCUSIGN_CLIENT_ID: process.env.VITE_DOCUSIGN_CLIENT_ID || "",
  VITE_TEAMS_CLIENT_ID: process.env.VITE_TEAMS_CLIENT_ID || "",
  VITE_ZOOM_CLIENT_ID: process.env.VITE_ZOOM_CLIENT_ID || "",
  __FIREBASE_DEFAULTS__: process.env.__FIREBASE_DEFAULTS__ || "",
};

async function run(command: string, args: string[]) {
  const proc = Bun.spawn([command, ...args], {
    env: buildEnv,
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${exitCode}`);
  }
}

await rm(distDir, { recursive: true, force: true });
await mkdir(assetsDir, { recursive: true });

await run("bun", [
  "build",
  "./src/main.tsx",
  "--target=browser",
  `--outdir=${assetsDir}`,
  "--production",
  "--public-path=/assets/",
  "--env=inline",
]);

await run("./node_modules/.bin/tailwindcss", [
  "-i",
  "./src/index.css",
  "-o",
  "./dist/assets/styles.css",
  "--minify",
]);

await writeFile(
  `${distDir}/index.html`,
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ditto</title>
    <link rel="stylesheet" href="/assets/styles.css" />
    <script type="module" src="/assets/main.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
);
