import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

function resolvePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const target =
    pathname === "/" ? "index.html" :
    pathname === "/admin" || pathname === "/admin/" ? "admin/index.html" :
    pathname;
  const candidate = normalize(join(root, target));
  return candidate.startsWith(root) ? candidate : join(root, "index.html");
}

createServer(async (req, res) => {
  let filePath = resolvePath(req.url || "/");

  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": types[extname(filePath)] || "text/plain; charset=utf-8" });
    res.end(body);
  } catch {
    filePath = (req.url || "").startsWith("/admin") ? join(root, "admin/index.html") : join(root, "index.html");
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": types[".html"] });
    res.end(body);
  }
}).listen(port, () => {
  console.log(`Blog frontend running at http://localhost:${port}`);
});
