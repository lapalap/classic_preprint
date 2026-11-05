const article = document.getElementById("paper-content");
const main = article.closest("main");
const page = main.closest(".page");
const bibtexText = document.getElementById("bibtex-text");
const copyButton = document.getElementById("copy-bibtex");
const downloadLink = document.getElementById("download-bibtex");
const copyStatus = document.getElementById("copy-status");
const paperSource = "./paper.md";

function parsePaper(source) {
  const frontMatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontMatter) throw new Error("paper.md needs JSON metadata between --- lines.");
  return {
    meta: JSON.parse(frontMatter[1]),
    markdown: source.slice(frontMatter[0].length),
  };
}

function slug(text) {
  return text.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s_-]/gu, "").trim().replace(/\s+/g, "-");
}

function decorateHeading(heading) {
  const match = heading.textContent.trim().match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
  if (!match) return heading.textContent.trim();
  heading.replaceChildren();
  const number = document.createElement("span");
  number.className = "section-number";
  number.textContent = match[1];
  heading.append(number, document.createTextNode(" " + match[2]));
  return match[2];
}

function renderBody(markdown, keywords) {
  const parsed = document.createElement("div");
  parsed.innerHTML = createPaperMarkdown(marked, katex).parse(markdown);
  article.replaceChildren();
  const usedIds = new Set([...document.querySelectorAll("[id]")].map((node) => node.id));
  for (const node of parsed.querySelectorAll("[id]")) {
    if (usedIds.has(node.id)) throw new Error(`Duplicate document ID: ${node.id}`);
    usedIds.add(node.id);
  }
  const headingId = (heading, title, section = false) => {
    const explicit = title.match(/\s+\{#([A-Za-z][\w-]*)\}\s*$/);
    if (explicit) {
      if (usedIds.has(explicit[1])) throw new Error(`Duplicate heading ID: ${explicit[1]}`);
      heading.lastChild.textContent = heading.lastChild.textContent.replace(explicit[0], "");
    }
    const base = explicit?.[1] || slug(heading.textContent.replace(/^\d+(?:\.\d+)*\s+/, "")) || "section";
    let id = base;
    let count = 2;
    while (usedIds.has(id) || (section && usedIds.has(`${id}-title`))) id = `${base}-${count++}`;
    usedIds.add(id);
    if (section) usedIds.add(`${id}-title`);
    return id;
  };
  let currentSection = null;
  let firstNumberedSection = null;

  for (const node of [...parsed.childNodes]) {
    if (node.nodeName === "H2") {
      const isNumbered = /^\d+\s/.test(node.textContent.trim());
      const id = headingId(node, node.textContent, true);
      const title = decorateHeading(node);
      node.dataset.outlineTitle = title;
      currentSection = document.createElement("section");
      currentSection.id = id;
      node.id = `${currentSection.id}-title`;
      currentSection.setAttribute("aria-labelledby", node.id);
      if (/^abstract$/i.test(title)) currentSection.classList.add("abstract");
      if (/^bibliography$/i.test(title)) currentSection.classList.add("bibliography");
      if (/^notes$/i.test(title)) currentSection.classList.add("footnotes");
      if (isNumbered && !firstNumberedSection) firstNumberedSection = currentSection;
      currentSection.append(node);
      article.append(currentSection);
    } else if (/^H[3-6]$/.test(node.nodeName)) {
      node.id = headingId(node, node.textContent);
      decorateHeading(node);
      (currentSection || article).append(node);
    } else {
      (currentSection || article).append(node);
    }
  }

  firstNumberedSection?.querySelector("p")?.classList.add("with-initial");
  const abstract = article.querySelector(".abstract");
  if (abstract && keywords.length) {
    const line = document.createElement("p");
    line.className = "keywords";
    const label = document.createElement("strong");
    label.textContent = "Keywords: ";
    line.append(label, document.createTextNode(keywords.join(" • ")));
    abstract.after(line);
  }
  [...article.querySelectorAll(".bibliography > ol > li")].forEach((reference, index) => {
    const id = `ref-${index + 1}`;
    if (!reference.id && !document.getElementById(id)) reference.id = id;
  });
  for (const caption of article.querySelectorAll("p")) {
    if (/^Table \d+:/.test(caption.textContent.trim())) caption.classList.add("table-caption");
  }
  const notes = article.querySelector(".footnotes");
  if (notes) {
    const details = document.createElement("details");
    details.className = "notes-disclosure";
    const summary = document.createElement("summary");
    summary.append(notes.querySelector("h2"));
    details.append(summary, ...notes.childNodes);
    notes.append(details);
  }
}

function renderContents(meta) {
  const contents = document.getElementById("contents");
  const disclosure = document.getElementById("contents-disclosure");
  const titleLink = document.getElementById("contents-title");
  const list = document.getElementById("contents-list");
  // Older cached HTML may not contain the optional outline.
  if (!contents || !disclosure || !titleLink || !list) return;
  const sections = [...article.querySelectorAll(":scope > section"), document.getElementById("citation")];
  const targets = [document.getElementById("paper"), ...sections];
  const links = [titleLink];
  const desktop = window.matchMedia("(min-width: 1280px)");
  const nav = titleLink.closest(".contents-nav");
  const marker = document.createElement("span");
  marker.className = "contents-marker";
  marker.setAttribute("aria-hidden", "true");
  nav.prepend(marker);

  const setLabel = (link, text) => {
    const label = document.createElement("span");
    label.className = "contents-label";
    label.textContent = text;
    link.replaceChildren(label);
  };
  setLabel(titleLink, meta.title);
  list.replaceChildren();
  for (const section of sections) {
    const heading = section.querySelector("h2");
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${section.id}`;
    setLabel(link, heading.dataset.outlineTitle || heading.textContent);
    item.append(link);
    list.append(item);
    links.push(link);
  }
  contents.hidden = false;

  let currentIndex = -1;
  let frame = 0;

  const updateCurrent = () => {
    frame = 0;
    const scrollTop = Math.max(0, window.scrollY);
    const viewport = window.innerHeight;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewport);
    // Let the reading line reach lower headings as the page runs out of scroll.
    const endOffset = maxScroll > 0 ? Math.max(0, viewport * .7 - (maxScroll - scrollTop)) : 0;
    const readingLine = viewport * .3 + endOffset;
    let current = 0;
    targets.forEach((target, index) => {
      if (target.getBoundingClientRect().top <= readingLine) current = index;
    });
    if (current !== currentIndex) {
      links.forEach((link, index) => {
        if (index === current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      currentIndex = current;
    }
    if (!desktop.matches) return;
    // Keep the original full-section highlight, easing both ends to the next row.
    const navRect = nav.getBoundingClientRect();
    const linkRect = links[current].getBoundingClientRect();
    const top = Math.max(0, Math.min(navRect.height, linkRect.top - navRect.top));
    const bottom = Math.max(top, Math.min(navRect.height, linkRect.bottom - navRect.top));
    marker.style.clipPath = `inset(${top}px 0 ${navRect.height - bottom}px 0 round 1px)`;
    if (!marker.classList.contains("is-positioned")) {
      requestAnimationFrame(() => marker.classList.add("is-positioned"));
    }
  };
  const requestUpdate = () => {
    if (!frame) frame = requestAnimationFrame(updateCurrent);
  };
  const updateWeights = () => {
    sections.forEach((section, index) => {
      list.children[index].style.setProperty("--section-weight", Math.max(1, section.offsetHeight / 100));
    });
    requestUpdate();
  };
  disclosure.open = true;
  updateWeights();
  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(updateWeights);
    resizeObserver.observe(article);
    resizeObserver.observe(sections.at(-1));
    resizeObserver.observe(nav);
  }
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", updateWeights);
  list.addEventListener("scroll", requestUpdate, { passive: true });
  document.fonts.ready.then(updateWeights);
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
  document.querySelector('meta[name="description"]').content = meta.description || `${meta.title} · ${projectName}`;
  document.querySelector(".eyebrow").textContent = meta.eyebrow || "Paper & project resources";
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
  try {
    renderContents(meta);
  } catch (error) {
    // A navigation enhancement must not erase an otherwise loaded paper.
    console.warn("The section outline could not be initialized.", error);
  }
  initializeReader(meta);
}

fetch(paperSource, { cache: "no-cache" })
  .then((response) => {
    if (!response.ok) throw new Error(`Could not load paper.md (${response.status}).`);
    return response.text();
  })
  .then(async (source) => {
    const { meta, markdown } = parsePaper(source);
    renderPage(meta, markdown);
    const initial = article.querySelector(".with-initial");
    if (initial) {
      // Keep the drop cap out of view until its font is ready, with a bounded wait.
      let timeout;
      const loaded = await Promise.race([
        document.fonts.load("1em GoudyInitialen").then((faces) => faces.length > 0, () => false),
        new Promise((resolve) => { timeout = setTimeout(resolve, 1500, false); }),
      ]).finally(() => clearTimeout(timeout));
      initial.classList.toggle("with-initial", loaded);
    }
    page.dataset.paper = "ready";
  })
  .catch((error) => {
    document.getElementById("paper-title").textContent = "Paper unavailable";
    article.textContent = "The paper could not be loaded. Please reload the page.";
    document.querySelectorAll(".resource-links, .citation-panel, .contents").forEach((element) => { element.hidden = true; });
    page.dataset.paper = "error";
    console.error(error);
  })
  .finally(() => {
    main.removeAttribute("aria-busy");
  });
