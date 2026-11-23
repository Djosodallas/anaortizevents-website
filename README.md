# anaortiz.events

Static site for Ana Ortiz Events (day-of wedding and quinceañera coordination, DFW),
in English and Mexican Spanish.
Served by a Cloudflare Worker (static assets only) on the **djosito214** Cloudflare
account (`d14c810a16769ab0444144e184b8e0c7`).

## Layout

- `src/pages/*.html` – English pages (`/`, `/investment`, `/vendors`, `/contact`, 404)
- `src/pages/es/*.html` – Spanish (es-MX) twins (`/es`, `/es/precios`, `/es/proveedores`, `/es/contacto`)
- `src/blog/en/*.html`, `src/blog/es/*.html` – blog posts; `build.mjs` generates
  `/blog`, `/es/blog` and each post page. See `src/blog/FORMAT.md`.
- `src/partials/` – shared `<head>`, header, footer; `*.es.html` are the Spanish versions
- `public/` – CSS, JS, images, `_redirects`, `robots.txt` (copied as-is)
- `dist/` – build output (git-ignored)

Adding a preferred vendor: copy an `<article class="vendor">` block in
`src/pages/vendors.html` into the right service section (or add a new
`<section class="service">` and a matching jump link), and add it to the
ItemList JSON-LD at the bottom of that page.

## Two languages

Every page and post has a twin in the other language, linked through the `alt`
attribute in its `<!--@head ...-->` line (posts: `alt:` in the `<!--@post` header).
The build adds `hreflang` tags, the header language switch and sitemap
alternates from it, and **fails if a twin is missing**. Spanish copy is
Mexican Spanish and uses "tú" for one reader and "ustedes" for a couple or family.

Adding a blog post: write `src/blog/en/<slug>.html` and `src/blog/es/<slug>.html`
following `src/blog/FORMAT.md`, each pointing at the other with `alt:`.

## Commands

```bash
npm install
npm run dev      # build + local preview at http://localhost:8788
npm run deploy   # build + deploy to Cloudflare
```

## Contact form

`/contact` and `/es/contacto` post to `POST /api/inquiry` (worker.js), which emails
anaortizevents@gmail.com from `inquiries@anaortiz.events` with Reply-To set to
the visitor. It uses the `INQUIRY_EMAIL` send_email binding (Cloudflare Email
Routing on anaortiz.events; the Gmail destination is verified). Spam traps: a
hidden `company` field and a 3-second minimum fill time. If sending fails, the
form offers a pre-filled mailto link instead. The email notes the event type
(wedding, quinceañera or other) and whether it came from the Spanish site.

## Domain and DNS (done 2026-11-18)

- Registrar: GoDaddy. Nameservers changed there to
  `adel.ns.cloudflare.com` / `louis.ns.cloudflare.com`; DNSSEC off.
- Zone `anaortiz.events` is active on the djosito214 Cloudflare account (Free plan).
- Custom domains `anaortiz.events` and `www.anaortiz.events` are attached to the
  Worker in the dashboard (Workers → anaortiz-events → Domains). worker.js
  301-redirects the bare domain to `https://www.anaortiz.events` (canonical host).
- Squarespace A/CNAME records were removed. Email Routing added MX
  (route1–3.mx.cloudflare.net), DKIM (`cf2024-1._domainkey`) and SPF
  (`v=spf1 include:_spf.mx.cloudflare.net ~all`), replacing the old `v=spf1 -all`.
- The Worker is reachable only through anaortiz.events: `workers_dev` and
  `preview_urls` are off (the old `*.workers.dev` URL returns error 1042), and
  worker.js 301s any host other than `www.anaortiz.events` to it (localhost excepted).
- Any future domain purchase or transfer for Ana goes into the djosito214 account.

## Reviews and photo gallery

Both are driven by JSON files and stay hidden until they have entries, so the site never shows an empty section.

**Reviews:** `src/data/reviews.json`. Only real reviews, copied word for word with the family's permission (for example from Google or Facebook):

```json
[
  { "name": "Maria G.", "event": "quinceanera", "source": "Google", "lang": "es", "text": "The review, exactly as written." }
]
```

`event` is `wedding` or `quinceanera`. The home and About pages show every review; the Weddings and Quinceañeras pages show only their own.

**Gallery:** put optimized `.webp` photos in `public/images/gallery/` and list them in `src/data/gallery.json`:

```json
[
  { "src": "/images/gallery/quince-grand-entrance.webp", "width": 1200, "height": 1500, "event": "quinceanera",
    "alt": { "en": "English description", "es": "Descripción en español" } }
]
```

Photos appear on the Weddings or Quinceañeras page (both languages) above the FAQ. Use only photos from events Ana coordinated, and credit/clear them with the photographer.
