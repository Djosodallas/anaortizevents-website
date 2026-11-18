# Blog post file format

One file per post per language:
- English: `src/blog/en/<slug>.html`  → served at `/blog/<slug>`
- Spanish: `src/blog/es/<slug>.html`  → served at `/es/blog/<slug>`

Each file starts with a header comment, then the article body HTML:

```html
<!--@post
title: Quinceañera Planning Timeline: A 12-Month Checklist
description: One or two sentences, 140–160 characters, used for Google and social previews.
date: 2026-11-18
alt: /es/blog/cronograma-para-planear-quinceanera
-->
<p>Opening paragraph…</p>
<h2>Section heading</h2>
<p>…</p>
```

Rules for the body:
- Allowed tags only: p, h2, h3, ul, ol, li, strong, em, a. No h1 (the layout adds the title), no images, no inline styles, no classes, no scripts.
- `alt:` is the URL of the same post in the other language.
- Do not add a closing call to action; the layout adds one.
