/* Markdown extensions shared by the browser and the renderer checks. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory;
  else root.createPaperMarkdown = factory;
})(globalThis, function (marked, katex) {
  const escape = (text) => String(text).replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const prefixes = { note: "note", comment: "comment", reference: "ref", variable: "var" };

  function math(tex, displayMode) {
    try {
      return katex.renderToString(tex.trim(), {
        displayMode,
        throwOnError: true,
        output: "htmlAndMathml",
        strict: (code) => code === "htmlExtension" ? "ignore" : "warn",
        trust: (context) => context.command === "\\htmlData" &&
          Object.keys(context.attributes).every((key) => key === "data-variable") &&
          /^[A-Za-z][\w-]*$/.test(context.attributes["data-variable"] || ""),
        macros: { "\\var": "\\htmlData{variable=#1}{#2}" },
        maxSize: 20,
        maxExpand: 1000,
      });
    } catch (error) {
      return `<span class="math-error" title="${escape(error.message)}">${escape(tex)}</span>`;
    }
  }

  const engine = new marked.Marked({
    gfm: true,
    extensions: [
      {
        name: "paperDirective",
        level: "block",
        start(source) { return source.match(/^:::(?:note|comment|reference|variable|equation)\s/m)?.index; },
        tokenizer(source) {
          const match = /^:::(note|comment|reference|variable|equation)[ \t]+([A-Za-z][\w-]*)(?:[ \t]+([^\n]+))?\r?\n([\s\S]*?)\r?\n:::[ \t]*(?:\r?\n|$)/.exec(source);
          if (match) return { type: "paperDirective", raw: match[0], kind: match[1], id: match[2], title: (match[3] || match[2]).trim(), body: match[4] };
        },
        renderer(token) {
          const { kind, id, title, body } = token;
          if (kind === "equation") {
            return `<figure class="equation" id="eq-${id}"><div class="equation-math">${math(body, true)}</div><figcaption>${escape(title)}</figcaption></figure>\n`;
          }
          return `<details class="annotation-source" id="${prefixes[kind]}-${id}" data-preview-kind="${kind}"><summary><span class="annotation-title">${escape(title)}</span></summary><div class="annotation-body">${engine.parse(body)}</div></details>\n`;
        },
      },
      {
        name: "displayMath",
        level: "block",
        start(source) { return source.indexOf("$$"); },
        tokenizer(source) {
          const match = /^\$\$[ \t]*\r?\n?([\s\S]+?)\r?\n?\$\$[ \t]*(?:\r?\n|$)/.exec(source);
          if (match) return { type: "displayMath", raw: match[0], tex: match[1] };
        },
        renderer(token) { return `<div class="equation">${math(token.tex, true)}</div>\n`; },
      },
      {
        name: "inlineMath",
        level: "inline",
        start(source) { return source.match(/\$(?!\$|\s)/)?.index; },
        tokenizer(source) {
          const match = /^\$(?!\$|\s)((?:\\.|[^$\n\\])+?)\$(?!\$|\d)/.exec(source);
          if (match && !/\s$/.test(match[1])) return { type: "inlineMath", raw: match[0], tex: match[1] };
        },
        renderer(token) { return math(token.tex, false); },
      },
    ],
  });
  return { parse: (source) => engine.parse(source) };
});
