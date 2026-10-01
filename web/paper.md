---
{
  "project_name": "Classic Preprint",
  "status": "Preprint. Under review.",
  "title": "Paper Title",
  "subtitle": "A subtitle or second line can go here",
  "year": "2026",
  "authors": [
    { "name": "Alice Smith", "affiliations": "1" },
    { "name": "Bob Johnson", "affiliations": "1, 2", "equal_contribution": true },
    { "name": "Carol Lee", "affiliations": "1", "equal_contribution": true },
    { "name": "David Brown", "affiliations": "1", "equal_contribution": true },
    { "name": "Emma Wilson", "affiliations": "1, 2" },
    { "name": "Frank Miller", "affiliations": "1" },
    { "name": "Grace Taylor", "affiliations": "1" },
    { "name": "Henry Davis", "affiliations": "3" },
    { "name": "Ivy Moore", "affiliations": "1" },
    { "name": "Jack Anderson", "affiliations": "4" },
    { "name": "Karen Thomas", "affiliations": "1" }
  ],
  "institutions": [
    { "mark": "1", "name": "University A" },
    { "mark": "2", "name": "Institute B" },
    { "mark": "3", "name": "University C" },
    { "mark": "4", "name": "Research Lab D" }
  ],
  "keywords": ["paper template", "preprint", "LaTeX", "typography"],
  "pdf": "./classic-preprint.pdf",
  "arxiv": "",
  "repository": "https://github.com/lapalap/classic_preprint",
  "citation_key": "smith2026papertitle",
  "sample": true
}
---

## Abstract

This template is called *Classic Preprint*. It is based on the COLM design, but has been simplified into a single preprint-oriented format with cleaner comments and a customizable header message by yours truly, Kirill Bykov. The current layout uses US Letter paper, a text width of 460pt, and a text height of 9.0in, which gives a full but still visually balanced single-column page. The side margins are a little over one inch, which keeps the paper from looking thin, while the overall page still retains a classic academic appearance.

## 1 About this template

This file is a sample main document for the *Classic Preprint* template. It is intended as a starting point for your own paper. The style is based on the COLM format, but this version removes the older mode structure and keeps only a preprint workflow. In practice, that means the package is loaded with `\usepackage[preprint]{classic_preprint}` and there is no longer any need to think about separate submission or final options in this template.

### 1.1 Custom header message

The style file provides a command for changing the short message shown in the running header:

```tex
\paperheadmessage{Preprint. Version 3, April 2026}
```

Use this command in the preamble, after loading the style package and before `\begin{document}`. If you do not provide it, the template falls back to the built-in default header text from the style file. This is useful for labels such as a version note, technical report note, revision date, or a submission status line that you want to control directly from the main `.tex` file.

### 1.2 Current page dimensions

The present design uses US Letter paper, which is 8.5in × 11in. The style file sets the text block to 460pt in width, which is about 6.36in, and 9.0in in height. That leaves side margins of about 1.07in on each side. Visually, this gives the paper a fairly full page without making the text block feel excessively wide. The vertical layout is also compact, which helps the paper look substantial and not sparse.

For a classic single-column academic layout, this is a reasonable balance: there is enough white space to frame the text, but not so much that the page looks thin or under-filled. If you want a slightly more relaxed look later, the first things to experiment with would be a slightly narrower text width and a slightly shorter text height.

## 2 How to use the template

Replace the title, abstract, authors, affiliations, keywords, and body text with your own material. The decorative drop cap at the beginning of a section is optional. The table and figure examples below are included only to show how the page elements look with the current styling.

### 2.1 Citations

This template loads `natbib` through the style file, so you can use commands such as `\citet{key}` and `\citep{key}` in the usual way. Keep the bibliography style consistent across the whole document. For example, the Transformer architecture is described in [[1]](#ref-1).

### 2.2 Footnotes

Footnotes appear at the bottom of the page and are styled by the template. Here is a small example footnote<sup><a href="#note-1" id="note-1-ref">1</a></sup> to demonstrate the appearance.

### 2.3 Figures

Figures should be clear and readable, with captions placed below the figure. The example below is only a placeholder.

<figure class="sample-figure">
  <div class="figure-box" role="img" aria-label="Empty sample figure placeholder"></div>
  <figcaption>Figure 1: Sample figure caption.</figcaption>
</figure>

### 2.4 Tables

Tables should be neat and easy to read. The example below uses `booktabs`, which is usually a good default choice.

| Part | Description |
| --- | --- |
| Dendrite | Input terminal |
| Axon | Output terminal |
| Soma | Cell body (contains cell nucleus) |

*Table 1: Sample table title*

## 3 Practical notes

Try not to load packages that silently change page geometry, spacing, or font choices unless you really need them. This template is meant to provide a stable baseline with a classic look. Most users will only need to edit the title, author block, header message, abstract, keywords, and paper body.

## 4 Summary

The goal of this sample file is to document the template itself while also serving as a clean starting point for a new paper. The design keeps the page visually pleasing, avoids an overly thin text block, and exposes a simple customization point through `\paperheadmessage{...}`.

## Bibliography

1. Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, and Illia Polosukhin. Attention is all you need. In *Advances in Neural Information Processing Systems*, volume 30, 2017.

## Notes

<p id="note-1"><sup>1</sup> This is an example footnote placed in the sample document. <a href="#note-1-ref" aria-label="Back to footnote reference">↩</a></p>

<p><sup>*</sup> Equal contribution. Correspondence to alice.smith@example.com.</p>
