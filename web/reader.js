/* Reading controls enhance the content rendered from paper.md. */
function initializeReader(meta) {
  const article = document.getElementById("paper-content");
  const status = document.getElementById("interaction-status");
  const announce = (message) => { status.textContent = message; };

  const linkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 8a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1" transform="translate(1 2) scale(.85)"/></svg>';
  const checkIcon = '<svg class="copied-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  for (const heading of document.querySelectorAll("#paper-title, #paper-content h2, #paper-content h3, #paper-content h4, #paper-content h5, #paper-content h6, #citation-title")) {
    if (!heading.id) continue;
    const title = heading.id === "paper-title" ? [meta.title, meta.subtitle].filter(Boolean).join(": ") :
      heading.dataset.outlineTitle || heading.textContent.trim();
    heading.setAttribute("aria-label", title);
    const target = heading.closest("section")?.querySelector("h2") === heading ? heading.closest("section").id : heading.id;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "heading-copy";
    button.setAttribute("aria-label", `Copy link to ${title}`);
    button.title = "Copy section link";
    button.innerHTML = linkIcon + checkIcon;
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const url = new URL(location.href);
      url.hash = target;
      try {
        await navigator.clipboard.writeText(url.href);
        button.dataset.copied = "true";
        announce(`Link to ${title} copied.`);
        setTimeout(() => { delete button.dataset.copied; }, 1800);
      } catch {
        history.replaceState(null, "", url);
        announce("Clipboard is unavailable. The section link is in the address bar for you to copy.");
      }
    });
    const notes = heading.closest(".notes-disclosure");
    if (heading.parentElement === notes?.firstElementChild) notes.after(button);
    else heading.append(button);
  }

  const panel = document.getElementById("margin-preview");
  const panelTitle = document.getElementById("preview-title");
  const panelBody = document.getElementById("preview-body");
  const wide = window.matchMedia("(min-width: 1280px)");
  const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
  let active = null;
  let closeTimer;
  let positionFrame = 0;
  const clearTimer = () => clearTimeout(closeTimer);

  const highlight = (key) => article.querySelectorAll("[data-variable]").forEach((item) =>
    item.classList.toggle("is-variable-highlighted", item.dataset.variable === key));

  function fitMath(root = document) {
    for (const formula of root.querySelectorAll(".katex")) {
      formula.style.fontSize = "";
      const container = formula.closest(".katex-display, p, li, td, th, figcaption, .annotation-body, .preview-body") || formula.parentElement;
      const available = container.clientWidth - 2;
      const width = formula.getBoundingClientRect().width;
      if (available > 0 && width > available) formula.style.fontSize = `${parseFloat(getComputedStyle(formula).fontSize) * available / width}px`;
    }
  }

  function hidePreview(restoreFocus = false) {
    clearTimer();
    const trigger = active?.trigger;
    if (trigger) {
      trigger.classList.remove("is-preview-active");
      trigger.setAttribute("aria-expanded", "false");
    }
    active = null;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    panel.inert = true;
    highlight();
    if (restoreFocus && trigger) {
      // Focus restoration should not immediately reopen the preview.
      trigger.dataset.restoringFocus = "true";
      trigger.focus({ preventScroll: true });
      delete trigger.dataset.restoringFocus;
    }
  }

  function scheduleClose() {
    clearTimer();
    if (!active?.pinned && !panel.matches(":hover")) closeTimer = setTimeout(() => hidePreview(), 240);
  }

  function positionPreview() {
    positionFrame = 0;
    if (!wide.matches) { panel.style.removeProperty("top"); return; }
    if (!active) return;
    const rect = active.trigger.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) { hidePreview(); return; }
    const top = Math.max(24, Math.min(rect.top - 12, innerHeight - panel.offsetHeight - 24));
    panel.style.top = `${top}px`;
  }

  function requestPosition() {
    if (!positionFrame) positionFrame = requestAnimationFrame(positionPreview);
  }

  function showPreview(trigger, source, pinned = false) {
    clearTimer();
    if (active?.trigger === trigger) {
      active.pinned ||= pinned;
      if (pinned) panel.focus({ preventScroll: true });
      return;
    }
    if (active) {
      active.trigger.classList.remove("is-preview-active");
      active.trigger.setAttribute("aria-expanded", "false");
    }
    const title = source.querySelector(".annotation-title")?.textContent || source.dataset.outlineTitle ||
      source.querySelector("h2, h3, figcaption")?.textContent.trim() || "";
    panelTitle.textContent = title;
    panelTitle.hidden = !title;
    panel.setAttribute("aria-label", title || "Annotation");
    const content = source.querySelector(".annotation-body") || source;
    const clone = content.cloneNode(true);
    for (const element of [clone, ...clone.querySelectorAll("*")]) {
      for (const attr of ["id", "tabindex", "aria-controls", "aria-expanded"]) element.removeAttribute(attr);
      element.classList.remove("preview-trigger", "is-preview-active", "is-variable-highlighted");
    }
    for (const control of clone.querySelectorAll("button, .equation-legend")) control.remove();
    panelBody.replaceChildren(...(content === source ? [clone] : [...clone.childNodes]));
    panelBody.scrollTop = 0;
    active = { trigger, source, pinned };
    trigger.classList.add("is-preview-active");
    trigger.setAttribute("aria-expanded", "true");
    highlight(source.dataset.previewKind === "variable" ? source.id.slice(4) : undefined);
    panel.inert = false;
    panel.setAttribute("aria-hidden", "false");
    panel.classList.add("is-open");
    fitMath(panel);
    positionPreview();
    if (pinned) panel.focus({ preventScroll: true });
  }

  function register(trigger, source, variable = false) {
    trigger.classList.add("preview-trigger");
    trigger.setAttribute("aria-controls", panel.id);
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch" && hover.matches) showPreview(trigger, source);
    });
    trigger.addEventListener("pointerleave", scheduleClose);
    trigger.addEventListener("focus", () => {
      if (!trigger.dataset.restoringFocus) showPreview(trigger, source);
    });
    trigger.addEventListener("blur", (event) => {
      if (!panel.contains(event.relatedTarget)) scheduleClose();
    });
    trigger.addEventListener("click", (event) => {
      if (!variable && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
      if (variable || !wide.matches || !hover.matches) {
        event.preventDefault();
        showPreview(trigger, source, true);
      }
    });
  }

  for (const link of article.querySelectorAll('a[href^="#"]')) {
    let source;
    try { source = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch { continue; }
    if (source && article.contains(source) && !source.matches("a, button") && source !== link && !source.contains(link)) register(link, source);
  }
  for (const symbol of article.querySelectorAll("[data-variable]")) {
    const source = document.getElementById(`var-${symbol.dataset.variable}`);
    if (source) register(symbol, source, true);
    else console.warn(`No variable definition for ${symbol.dataset.variable}. Add :::variable ${symbol.dataset.variable}.`);
  }
  // Expose the same definitions outside KaTeX's aria-hidden visual markup.
  for (const equation of article.querySelectorAll(".equation")) {
    const definitions = [...new Set([...equation.querySelectorAll("[data-variable]")].map((symbol) => symbol.dataset.variable))];
    if (!definitions.length) continue;
    const legend = document.createElement("div");
    legend.className = "equation-legend";
    const label = document.createElement("span");
    label.textContent = "Explore the symbols";
    legend.append(label);
    for (const key of definitions) {
      const source = document.getElementById(`var-${key}`);
      if (!source) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = key;
      register(button, source);
      button.addEventListener("click", () => showPreview(button, source, true));
      legend.append(button);
    }
    equation.append(legend);
  }

  panel.addEventListener("pointerenter", clearTimer);
  panel.addEventListener("pointerleave", scheduleClose);
  panel.addEventListener("focusin", clearTimer);
  panel.addEventListener("focusout", (event) => {
    if (!panel.contains(event.relatedTarget) && event.relatedTarget !== active?.trigger) scheduleClose();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && active) { event.preventDefault(); hidePreview(true); }
  });
  document.addEventListener("pointerdown", (event) => {
    if (active && !panel.contains(event.target) && !active.trigger.contains(event.target)) hidePreview();
  });
  window.addEventListener("scroll", requestPosition, { passive: true });
  window.addEventListener("resize", () => { fitMath(); requestPosition(); });
  article.addEventListener("toggle", () => fitMath(article), true);
  document.fonts.ready.then(() => fitMath());
  document.fonts.addEventListener("loadingdone", () => fitMath());
  if ("ResizeObserver" in window) new ResizeObserver(requestPosition).observe(panel);

  function followHash(scroll = false, hash = location.hash) {
    let target;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return; }
    if (!target) return;
    const details = target.matches("details") ? target : target.querySelector(":scope > .notes-disclosure");
    if (details) details.open = true;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent.matches("details")) parent.open = true;
    }
    if (scroll) target.scrollIntoView({ block: "start", behavior: "instant" });
  }
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link && !event.defaultPrevented) followHash(false, link.hash);
  });
  window.addEventListener("hashchange", () => followHash());
  if (location.hash) document.fonts.ready.then(() => requestAnimationFrame(() => followHash(true)));
}
