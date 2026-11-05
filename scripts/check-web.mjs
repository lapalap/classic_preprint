import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const createMarkdown = require("../web/markdown.js");
const markdown = createMarkdown(require("../web/vendor/marked.umd.js"), require("../web/vendor/katex/katex.min.js"));
const render = (source) => markdown.parse(source);

// Code examples, prices, and escaped delimiters must remain ordinary text.
assert.doesNotMatch(render("`$x$` and `$y$`"), /class="katex/);
assert.doesNotMatch(render("A costs $5 and B costs $10."), /class="katex/);
assert.doesNotMatch(render("\\$x\\$"), /class="katex/);
assert.doesNotMatch(render("```markdown\n:::note demo Title\nA note.\n:::\n```"), /<details/);

const note = render(":::note scaling Why scale?\n**A note**, $d_k$, and [a link](https://example.com).\n\n![Matrix](./images/attention.svg)\n:::\n");
assert.match(note, /id="note-scaling"/);
assert.match(note, /data-preview-kind="note"/);
assert.match(note, /<strong>A note<\/strong>/);
assert.match(note, /class="katex"/);
assert.match(note, /<img src="\.\/images\/attention.svg" alt="Matrix"/);
assert.doesNotMatch(note, /math-error/);

for (const [kind, prefix] of [["reference", "ref"], ["comment", "comment"], ["variable", "var"]]) {
  assert.match(render(`:::${kind} demo A title\nContent\n:::\n`), new RegExp(`id="${prefix}-demo"`));
}
const equation = render(":::equation attention A caption\n\\var{Q}{Q} + \\var{Q}{Q} + \\var{theta}{\\theta}\n:::\n");
assert.match(equation, /id="eq-attention"/);
assert.equal([...equation.matchAll(/data-variable="Q"/g)].length, 2);
assert.match(equation, /data-variable="theta"/);
assert.match(equation, /katex-mathml/);
assert.doesNotMatch(equation, /math-error/);
assert.match(render("$$\nx^2\n$$\n"), /katex-display/);
assert.match(render("$\\notACommand{x}$"), /math-error/);
// Math may attach variable metadata, but cannot inject arbitrary HTML attributes.
assert.doesNotMatch(render("$\\htmlData{onclick=alert(1)}{x}$"), /data-onclick=/);

const paper = await readFile(new URL("../web/paper.md", import.meta.url), "utf8");
const match = paper.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
assert.ok(match, "paper.md needs JSON front matter");
const meta = JSON.parse(match[1]);
assert.ok(meta.title && meta.citation_key && meta.authors?.length, "The sample metadata must be usable");
const sample = render(paper.slice(match[0].length));
assert.doesNotMatch(sample, /math-error/);
const ids = [...sample.matchAll(/\bid="([^"]+)"/g)].map((entry) => entry[1]);
assert.equal(ids.length, new Set(ids).size, "Explicit Markdown IDs must be unique");
for (const entry of sample.matchAll(/data-variable="([^"]+)"/g)) {
  assert.ok(ids.includes(`var-${entry[1]}`), `Missing definition for variable ${entry[1]}`);
}
for (const entry of sample.matchAll(/href="#((?:note|ref|comment|var|eq)-[^"]+)"/g)) {
  // ref-1 is the original bibliography list; the browser assigns its legacy ID.
  assert.ok(entry[1] === "ref-1" || ids.includes(entry[1]), `Missing annotation target ${entry[1]}`);
}
console.log("Markdown checks passed: notes, images, references, math, variable definitions, and sample links.");
