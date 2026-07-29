import { copyFileSync, cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, ".output", "public");
const serverDir = join(root, ".output", "server");

if (!existsSync(publicDir)) {
  console.log("⚠️  .output/public not found — skipping postbuild");
  process.exit(0);
}

if (!existsSync(serverDir)) {
  console.log("⚠️  .output/server not found — skipping postbuild");
  process.exit(0);
}

const destServerDir = join(publicDir, "server");
if (!existsSync(destServerDir)) {
  mkdirSync(destServerDir, { recursive: true });
}

cpSync(serverDir, destServerDir, { recursive: true, force: true });
console.log("✅ Copied server/ to public/server/ for Cloudflare Pages");

const workerPath = join(publicDir, "_worker.js");
writeFileSync(
  workerPath,
  `import server from "./server/index.mjs";
export default server;
`,
  "utf-8",
);
console.log("✅ Created _worker.js at public/_worker.js");
