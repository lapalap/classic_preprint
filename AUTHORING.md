# Author a paper from one Markdown file

Edit **`web/paper.md`**. The metadata, paper text, section outline, bibliography, BibTeX citation, margin notes, image previews, and variable definitions all come from this file. You do not need to edit HTML, CSS, or JavaScript for a new paper. Images and the downloadable PDF can be separate assets referenced from the Markdown.

## 1. Metadata

Start with a JSON object between two `---` lines. This is **JSON, not YAML**: use double quotes and no trailing commas.

```json
---
{
  "project_name": "My paper",
  "title": "A clear paper title",
  "subtitle": "An optional second line",
  "description": "A short description for search engines.",
  "eyebrow": "Paper & project resources",
  "year": "2026",
  "authors": [
    { "name": "Alice Smith", "affiliations": "1" }
  ],
  "institutions": [
    { "mark": "1", "name": "University A" }
  ],
  "keywords": ["machine learning", "attention"],
  "pdf": "./my-paper.pdf",
  "repository": "https://github.com/your-name/your-project",
  "arxiv": "",
  "citation_key": "smith2026paper"
}
---
```

`subtitle`, `description`, `eyebrow`, and `keywords` are optional. Leave `repository` empty to hide Code. Set `arxiv` to an ID or an `https://arxiv.org/abs/…` URL; an empty value displays “arXiv (pending).” The page generates its BibTeX from this metadata, so title and author changes stay consistent. The reader always uses the light paper appearance.

## 2. Sections and copyable links

Use normal Markdown: `##` for main sections, `###` through `######` for subsections, ordinary paragraphs, emphasis, lists, links, images, tables, and fenced code blocks.

```markdown
## Abstract

Your abstract.

## 1 Introduction

Your introduction.

### 1.1 Motivation

Your motivation.
```

The desktop outline is generated from `##` headings. It stays hidden on mobile. Heading copy buttons, animated link underlines, and the reading indicator work automatically.

Headings get IDs from their titles, excluding a leading section number: `## 1 Introduction` becomes `#introduction`. Duplicate titles get `-2`, `-3`, and so on. For a link that will survive renaming a heading, provide an explicit ID:

```markdown
## 2 Our method {#method}

See [our method](#method).
```

Explicit IDs start with a letter and contain letters, digits, underscores, or hyphens. IDs must be unique. Hover over or focus a heading's link icon, then click it to copy the direct URL. On touch screens, the icons remain visible. Direct URLs also work when opened before the Markdown finishes loading.

## 3. Notes, comments, and reference previews

Write a normal internal link where you want the preview to appear:

```markdown
The denominator is [a stabilizing factor](#note-scaling).
See [the implementation detail](#comment-mask).
This follows [Vaswani et al.](#ref-transformer).
```

Define its content in the **same Markdown file**, usually under `## Notes` or `## Bibliography`:

```markdown
:::note scaling Why scale the scores?
The dot products grow with the key dimension. Dividing by $\sqrt{d_k}$
helps keep their scale stable before the softmax.
:::

:::comment mask Causal masking
A causal mask prevents a token from attending to future positions.
:::

:::reference transformer Attention is all you need
**Ashish Vaswani et al. · NeurIPS 2017**

Introduces the Transformer architecture.

[Read the paper](https://arxiv.org/abs/1706.03762)
:::
```

Every definition starts with `:::TYPE ID Title`, followed by Markdown, and ends with `:::` on its own line. Leave blank lines around a block. IDs are case-sensitive, start with a letter, and contain letters, digits, underscores, or hyphens. Do not nest directive blocks. Ordinary fenced code blocks can show this syntax without activating it.

| Block | Link target | Use |
| --- | --- | --- |
| `:::note scaling Title` | `#note-scaling` | Sidenotes and explanations |
| `:::comment mask Title` | `#comment-mask` | Author comments and implementation notes |
| `:::reference transformer Title` | `#ref-transformer` | Bibliographic entries, abstracts, and source links |
| `:::variable Q Title` | `#var-Q` | Equation variable definitions |
| `:::equation attention Caption` | `#eq-attention` | A named display equation |

On desktop, hovering or focusing a linked phrase opens a preview in the **right margin**. You can move the pointer onto the window to read, scroll, or follow its links. It fades away after you leave. Clicking an ordinary reference link on desktop still jumps to its source in the text.

On mobile and touch devices, tap the linked phrase to open a compact floating preview. Tap outside or press Escape to dismiss it. Previews show only their title and content, with no type label or toolbar. The entire endnote list starts collapsed: click **Notes** to reveal it, then expand an individual entry. A direct link to a note opens its containing list automatically.

Numbered list entries under `## Bibliography` automatically get `#ref-1`, `#ref-2`, and so on. Existing links to these entries and to footnotes such as `#note-1` also get previews. Internal links to figures or sections can preview the corresponding content, too. Preview content comes from this file; the reader does not fetch arbitrary websites when hovering an external URL.

### Include an image

Use ordinary Markdown images inside any note, comment, reference, or variable block:

```markdown
:::note experiment What the experiment shows
The darkest cells indicate the strongest attention.

![Attention weights for a sample input.](./images/attention.svg)

*An illustrative attention matrix.*
:::
```

Paths are relative to `web/` when previewing or publishing. Put local images in `web/images/`, use a hosted image URL, or embed a data URL for an image carried inside the Markdown itself. Always write meaningful alt text. An HTML `<img>` with the original `width` and `height` reserves space while the image loads. Images scale to fit the preview and also appear when the definition is expanded.

## 4. Equations

Use KaTeX-compatible LaTeX. Math and fonts are bundled locally, so rendering does not depend on a third-party CDN.

Inline math:

```markdown
The scale is $1/\sqrt{d_k}$.
```

A plain display equation:

```markdown
$$
p_i = \frac{\exp(z_i)}{\sum_j \exp(z_j)}
$$
```

A named display equation with a caption:

```markdown
:::equation attention Scaled dot-product attention
\operatorname{Attention}(\var{Q}{Q},\var{K}{K},\var{V}{V}) =
\operatorname{softmax}\!\left(\frac{\var{Q}{Q}\var{K}{K}^{\mathsf T}}{\sqrt{\var{dk}{d_k}}}\right)\var{V}{V}
:::
```

The `\var{ID}{LaTeX}` command marks an interactive variable. Its first argument names a definition; the second is the symbol or expression to typeset. Add the corresponding definitions anywhere in the same file:

```markdown
:::variable Q Query matrix
Each row represents what one token is looking for.
:::

:::variable K Key matrix
Query–key dot products measure compatibility.
:::

:::variable V Value matrix
The information combined using the attention weights.
:::

:::variable dk Key dimension
The number of components in each query and key vector.
:::
```

Hovering or tapping a marked symbol highlights all its occurrences and opens its definition. The “Explore the symbols” controls below a display equation provide the same interaction for keyboard, touch, and screen-reader users. For a Greek symbol, write `\var{theta}{\theta}` and define `:::variable theta Model parameters`. Mark only the part you want highlighted: `\var{K}{K}^{\mathsf T}` keeps the transpose outside the highlight, while `\var{KT}{K^{\mathsf T}}` includes it.

Plain inline math does not need definitions. Use an ordinary `[variable description](#var-Q)` link when you also want an explanatory phrase in the prose. Wide equations automatically resize to fit, including in previews and on mobile. For particularly long equations, use a LaTeX `aligned` environment to split them into readable lines. BibTeX, code, table cells, and long links wrap instead of showing horizontal scrollbars. Invalid math is shown as its original LaTeX with an error hint, instead of preventing the rest of the paper from rendering.

## 5. Preview, checks, and publishing

From the repository root:

```bash
python3 -m http.server 8000 --directory web
```

Open `http://localhost:8000`, edit `web/paper.md`, and reload. For a production build:

```bash
node scripts/check-web.mjs
node scripts/build-web.mjs
python3 -m http.server 8000 --directory _site
```

The build packages the Markdown, renderer, styles, math library, fonts, and images together, and fingerprints the JavaScript and CSS. The page preserves the rounded desktop reading indicator and tracks through the final BibTeX section. Motion is disabled when the reader requests reduced motion.

Raw HTML is also supported for custom figures and existing paper markup.
