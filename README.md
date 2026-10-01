# Classic Preprint

**Classic Preprint** is a clean LaTeX template collection for researchers who want a polished, publication-ready visual style without excessive ornamentation.

The repository currently includes:

- a **single-column preprint template** for papers, technical reports, and research drafts
- a matching **academic / research-oriented CV template**
- shared visual ideas across both formats: classic serif typography, restrained maroon accents, clean rules, and a compact but readable layout

The paper template is **heavily inspired by the visual design of the COLM paper format**, while being simplified and adapted into a standalone preprint-oriented template. This is also stated directly in the comments of the source files.

## Templates

### 1. Classic Preprint

The preprint template is intended for:

- research papers
- arXiv-style manuscripts
- technical reports
- polished drafts shared before formal submission

Key features:

- classic single-column academic appearance
- visible author block in preprint mode
- customizable running header message
- maroon hyperlink styling
- carefully chosen page geometry
- examples for title blocks, figures, tables, keywords, and citations

Main files:

```text
classic_preprint.tex
classic_preprint.sty
```

Compile with:

```bash
pdflatex classic_preprint.tex
```

For documents with bibliographies, use the usual sequence appropriate to your bibliography setup.

### 2. Classic CV

The CV template follows the same broad visual language as the preprint template, but is optimized for professional use.

It is suitable for:

- academic CVs
- postdoc and faculty applications
- research scientist applications
- research-oriented industry roles

Key features:

- elegant serif typography
- structured sections for research profiles and experience
- publication entries with links
- compact footer pagination
- no distracting running header
- adaptable spacing for fuller academic CVs or denser industry versions

Main file:

```text
kirill_cv_template_v2_no_header_compact_footer.tex
```

## Design Philosophy

The goal of these templates is to feel:

- **classical**, without looking dated
- **editorial**, without becoming decorative
- **professional**, without resembling a corporate resume generator
- **clear and typographically calm**, especially for long-form research documents

The paper template draws strong inspiration from the COLM paper design, then modifies the style for a public preprint workflow and a more reusable standalone format.

## Repository Structure

```text
.
├── classic_preprint.tex
├── classic_preprint.sty
├── fancyhdr.sty
├── kirill_cv_template_v2_no_header_compact_footer.tex
└── README.md
```

## Paper webpage

The `web/` directory contains a responsive web edition of the sample preprint. It uses the paper's content, bundles the reference PDF, and serves TeX Gyre Pagella locally. Its opening initial uses the GoudyInitialen glyph from the PDF; see `web/GOUDY-INITIAL-NOTICE.md` for attribution. From the repository root, run:

```bash
python3 -m http.server 8000 --directory web
```

Then visit `http://localhost:8000`.

## Notes

- The preprint style file controls the visual layout. Avoid loading packages that unexpectedly override geometry or page formatting unless you know why.
- The CV template is intentionally standalone and can be edited independently.
- Both templates are meant as starting points. Replace placeholder text, author details, URLs, and section contents with your own material.

## Acknowledgment

The visual direction of the **Classic Preprint** paper template is heavily inspired by the **COLM paper design**. This repository adapts that spirit into a simplified preprint template and a companion CV style for researchers.
