import { mkdir, rm } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const devDir = ".bun-dev";
const assetsDir = `${devDir}/assets`;
const port = Number(process.env.PORT || 3000);
const root = process.cwd();
const absoluteDevDir = resolve(root, devDir);
const devEnv = {
  ...process.env,
  NODE_ENV: "development",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  VITE_DOCUSIGN_CLIENT_ID: process.env.VITE_DOCUSIGN_CLIENT_ID || "",
  VITE_TEAMS_CLIENT_ID: process.env.VITE_TEAMS_CLIENT_ID || "",
  VITE_ZOOM_CLIENT_ID: process.env.VITE_ZOOM_CLIENT_ID || "",
  __FIREBASE_DEFAULTS__: process.env.__FIREBASE_DEFAULTS__ || "",
};

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function indexHtml() {
  return new Response(
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
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

function spawnWatcher(command: string, args: string[]) {
  const proc = Bun.spawn([command, ...args], {
    env: devEnv,
    stdout: "inherit",
    stderr: "inherit",
  });
  return proc;
}

await rm(devDir, { recursive: true, force: true });
await mkdir(assetsDir, { recursive: true });

const watchers = [
  spawnWatcher("bun", [
    "build",
    "./src/main.tsx",
    "--target=browser",
    `--outdir=${assetsDir}`,
    "--public-path=/assets/",
    "--env=inline",
    "--sourcemap=inline",
    "--watch",
  ]),
  spawnWatcher("./node_modules/.bin/tailwindcss", [
    "-i",
    "./src/index.css",
    "-o",
    "./.bun-dev/assets/styles.css",
    "--watch=always",
  ]),
];

const server = Bun.serve({
  hostname: "0.0.0.0",
  port,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return indexHtml();
    }

    const filePath = resolve(join(absoluteDevDir, url.pathname));
    if (!filePath.startsWith(absoluteDevDir)) {
      return new Response("Not found", { status: 404 });
    }

    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(file, {
      headers: {
        "content-type": mimeTypes[extname(filePath)] || "application/octet-stream",
      },
    });
  },
});

console.log(`Ditto Bun dev server ready at http://localhost:${server.port}`);

function shutdown() {
  for (const watcher of watchers) {
    watcher.kill();
  }
  server.stop(true);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
