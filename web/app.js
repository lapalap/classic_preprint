const article = document.getElementById("paper-content");
const bibtexText = document.getElementById("bibtex-text");
const copyButton = document.getElementById("copy-bibtex");
const downloadLink = document.getElementById("download-bibtex");
const copyStatus = document.getElementById("copy-status");

function parsePaper(source) {
  const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontMatter) throw new Error("paper.md needs JSON metadata between --- lines.");
  return {
    meta: JSON.parse(frontMatter[1]),
    markdown: source.slice(frontMatter[0].length),
  };
}

function slug(text) {
  return text.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
}

function decorateHeading(heading) {
  const match = heading.textContent.trim().match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
  if (!match) return heading.textContent.trim();
  heading.replaceChildren();
  const number = document.createElement("span");
  number.className = "section-number";
  number.textContent = match[1];
  heading.append(number, document.createTextNode(match[2]));
  return match[2];
}

function addOpeningInitial(section) {
  const paragraph = section?.querySelector("p");
  const firstText = paragraph?.firstChild;
  if (!firstText || firstText.nodeType !== Node.TEXT_NODE) return;
  const match = firstText.textContent.match(/^(\s*)(T)([\s\S]*)$/);
  if (!match) return;
  firstText.textContent = match[1] + match[3];
  const initial = document.createElement("img");
  initial.className = "initial";
  initial.src = "./goudy-initial-t.svg";
  initial.alt = "";
  initial.setAttribute("aria-hidden", "true");
  const accessibleLetter = document.createElement("span");
  accessibleLetter.className = "visually-hidden";
  accessibleLetter.textContent = "T";
  paragraph.prepend(initial, accessibleLetter);
  paragraph.classList.add("with-initial");
}

function renderBody(markdown, keywords) {
  const parsed = document.createElement("div");
  parsed.innerHTML = marked.parse(markdown, { gfm: true });
  article.replaceChildren();
  let currentSection = null;
  let firstNumberedSection = null;

  for (const node of [...parsed.childNodes]) {
    if (node.nodeName === "H2") {
      const isNumbered = /^\d+\s/.test(node.textContent.trim());
      const title = decorateHeading(node);
      currentSection = document.createElement("section");
      currentSection.id = slug(title);
      node.id = `${currentSection.id}-title`;
      currentSection.setAttribute("aria-labelledby", node.id);
      if (/^abstract$/i.test(title)) currentSection.classList.add("abstract");
      if (/^bibliography$/i.test(title)) currentSection.classList.add("bibliography");
      if (/^notes$/i.test(title)) currentSection.classList.add("footnotes");
      if (isNumbered && !firstNumberedSection) firstNumberedSection = currentSection;
      currentSection.append(node);
      article.append(currentSection);
    } else if (node.nodeName === "H3") {
      node.id = slug(decorateHeading(node));
      (currentSection || article).append(node);
    } else {
      (currentSection || article).append(node);
    }
  }

  addOpeningInitial(firstNumberedSection);
  const abstract = article.querySelector(".abstract");
  if (abstract && keywords.length) {
    const line = document.createElement("p");
    line.className = "keywords";
    const label = document.createElement("strong");
    label.textContent = "Keywords: ";
    line.append(label, document.createTextNode(keywords.join(" • ")));
    abstract.after(line);
  }
  const reference = article.querySelector(".bibliography ol li");
  if (reference) reference.id = "ref-1";
  for (const caption of article.querySelectorAll("p")) {
    if (/^Table \d+:/.test(caption.textContent.trim())) caption.classList.add("table-caption");
  }
}

function arxivUrl(value) {
  const input = String(value || "").trim();
  if (/^\d{4}\.\d{4,5}(v\d+)?$/.test(input)) return `https://arxiv.org/abs/${input}`;
  try {
    const url = new URL(input);
    if (url.protocol === "https:" && ["arxiv.org", "www.arxiv.org"].includes(url.hostname) && /^\/(abs|pdf)\//.test(url.pathname)) return url.href;
  } catch { /* An empty or incomplete template field leaves the action inactive. */ }
  return null;
}

function renderAuthors(authors, institutions) {
  const authorLine = document.getElementById("authors");
  const affiliations = document.getElementById("affiliations");
  authorLine.replaceChildren();
  affiliations.replaceChildren();
  for (const author of authors) {
    const item = document.createElement("span");
    item.textContent = author.name;
    const mark = document.createElement("sup");
    mark.textContent = `${author.equal_contribution ? "*, " : ""}${author.affiliations || ""}`;
    item.append(mark);
    authorLine.append(item);
  }
  for (const institution of institutions) {
    const item = document.createElement("span");
    const mark = document.createElement("sup");
    mark.textContent = institution.mark;
    item.append(mark, document.createTextNode(institution.name));
    affiliations.append(item);
  }
}

function makeBibtex(meta, paperUrl) {
  const title = [meta.title, meta.subtitle].filter(Boolean).join(": ");
  const lines = [
    `@misc{${meta.citation_key},`,
    `  title = {${title}},`,
    `  author = {${meta.authors.map((author) => author.name).join(" and ")}},`,
    `  year = {${meta.year}},`,
  ];
  if (paperUrl) {
    const id = new URL(paperUrl).pathname.replace(/^\/(abs|pdf)\//, "").replace(/\.pdf$/, "");
    lines.push(`  eprint = {${id}},`, "  archivePrefix = {arXiv},", `  url = {https://arxiv.org/abs/${id}},`);
  } else if (meta.sample) {
    lines.push("  note = {Template example},");
  }
  lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, "");
  lines.push("}");
  return lines.join("\n");
}

function renderCitation(meta, paperUrl) {
  const bibtex = makeBibtex(meta, paperUrl);
  bibtexText.textContent = bibtex;
  copyButton.disabled = false;
  const blobUrl = URL.createObjectURL(new Blob([bibtex + "\n"], { type: "text/x-bibtex;charset=utf-8" }));
  downloadLink.href = blobUrl;
  downloadLink.download = `${meta.citation_key}.bib`;
  window.addEventListener("pagehide", () => URL.revokeObjectURL(blobUrl), { once: true });
  document.getElementById("citation-kind").textContent = meta.sample ? "Example" : "Paper";
  document.getElementById("citation-note").textContent = meta.sample
    ? "This citation uses the template’s sample title and authors. Replace them in paper.md before publishing."
    : "Copy or download the citation for this paper.";
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(bibtex);
      copyStatus.textContent = "BibTeX copied to clipboard.";
      copyButton.textContent = "Copied";
      setTimeout(() => { copyButton.textContent = "Copy"; }, 2000);
    } catch {
      copyStatus.textContent = "Clipboard access is unavailable. Select the BibTeX text above to copy it.";
    }
  });
}

function renderPage(meta, markdown) {
  const projectName = meta.project_name || "Project";
  document.title = `${meta.title} · ${projectName}`;
  document.getElementById("project-name").textContent = projectName;
  document.getElementById("footer-project").textContent = projectName;
  document.getElementById("paper-status").textContent = meta.status || "Preprint";
  const title = document.getElementById("paper-title");
  title.replaceChildren(document.createTextNode(meta.title));
  if (meta.subtitle) {
    title.append(document.createElement("br"), document.createTextNode(meta.subtitle));
  }
  renderAuthors(meta.authors || [], meta.institutions || []);
  renderBody(markdown, meta.keywords || []);

  const pdf = document.getElementById("pdf-link");
  pdf.href = meta.pdf || "./classic-preprint.pdf";
  const repository = document.getElementById("repository-link");
  if (meta.repository) repository.href = meta.repository;
  else repository.hidden = true;
  const paperUrl = arxivUrl(meta.arxiv);
  if (paperUrl) {
    const link = document.getElementById("arxiv-link");
    link.href = paperUrl;
    link.hidden = false;
    document.getElementById("arxiv-pending").hidden = true;
  }
  renderCitation(meta, paperUrl);
}

fetch("./paper.md")
  .then((response) => {
    if (!response.ok) throw new Error(`Could not load paper.md (${response.status}).`);
    return response.text();
  })
  .then((source) => {
    const { meta, markdown } = parsePaper(source);
    renderPage(meta, markdown);
  })
  .catch((error) => {
    document.getElementById("paper-title").textContent = "Paper unavailable";
    article.textContent = `${error.message} Serve the web directory over local HTTP to preview this page.`;
    console.error(error);
  });
