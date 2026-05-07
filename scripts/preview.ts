import { extname, join, resolve } from "node:path";

const distDir = "dist";
const port = Number(process.env.PORT || 4173);
const absoluteDistDir = resolve(process.cwd(), distDir);

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const server = Bun.serve({
  hostname: "0.0.0.0",
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = resolve(join(absoluteDistDir, pathname));

    if (!filePath.startsWith(absoluteDistDir)) {
      return new Response("Not found", { status: 404 });
    }

    let file = Bun.file(filePath);
    if (!(await file.exists()) && !pathname.includes(".")) {
      file = Bun.file(join(absoluteDistDir, "index.html"));
    }

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

console.log(`Ditto preview server ready at http://localhost:${server.port}`);
