import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = join(root, "web");
const output = join(root, "_site");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, {
  recursive: true,
  filter: (path) => basename(path) !== ".DS_Store",
});

async function fingerprint(path, content = null) {
  const bytes = content ?? await readFile(join(source, path));
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  const extension = extname(path);
  const filename = `${basename(path, extension)}.${hash}${extension}`;
  const versioned = join(dirname(path), filename);
  await writeFile(join(output, versioned), bytes);
  return `./${versioned}`;
}

// The script must load the paper from the same release as the HTML and CSS.
const paper = await fingerprint("paper.md");
const app = (await readFile(join(source, "app.js"), "utf8"))
  .replace('"./paper.md"', JSON.stringify(paper));
const assets = new Map([
  ["style.css", await fingerprint("style.css")],
  ["vendor/marked.umd.js", await fingerprint("vendor/marked.umd.js")],
  ["vendor/katex/katex.min.css", await fingerprint("vendor/katex/katex.min.css")],
  ["vendor/katex/katex.min.js", await fingerprint("vendor/katex/katex.min.js")],
  ["markdown.js", await fingerprint("markdown.js")],
  ["reader.js", await fingerprint("reader.js")],
  ["app.js", await fingerprint("app.js", app)],
]);
let html = await readFile(join(source, "index.html"), "utf8");
html = html.replace('href="./paper.md" as="fetch"', `href="${paper}" as="fetch"`);
html = html.replace(/\.\/(style\.css|app\.js|markdown\.js|reader\.js|vendor\/marked\.umd\.js|vendor\/katex\/katex\.min\.(?:css|js))(?:\?[^"\s]*)?/g,
  (_, path) => assets.get(path));
await writeFile(join(output, "index.html"), html);
console.log("Built _site with content-versioned paper, scripts, and stylesheet.");
