# anaortiz.events

Static site for Ana Ortiz Events (day-of quinceañera coordination, DFW).
Served by a Cloudflare Worker (static assets only) on the **djosito214** Cloudflare
account (`d14c810a16769ab0444144e184b8e0c7`).

## Layout

- `src/pages/*.html` – one file per page (`/`, `/investment`, `/vendors`, `/contact`, 404)
- `src/partials/` – shared `<head>`, header, footer (expanded by `build.mjs`)
- `public/` – CSS, JS, images, `_redirects`, `robots.txt` (copied as-is)
- `dist/` – build output (git-ignored)

Adding a preferred vendor: copy an `<article class="vendor">` block in
`src/pages/vendors.html` into the right service section (or add a new
`<section class="service">` and a matching jump link), and add it to the
ItemList JSON-LD at the bottom of that page.

## Commands

```bash
npm install
npm run dev      # build + local preview at http://localhost:8788
npm run deploy   # build + deploy to Cloudflare
```

## Contact form

`/contact` posts to `POST /api/inquiry` (worker.js), which emails
anaortizevents@gmail.com from `inquiries@anaortiz.events` with Reply-To set to
the visitor. It uses the `INQUIRY_EMAIL` send_email binding (Cloudflare Email
Routing on anaortiz.events; the Gmail destination is verified). Spam traps: a
hidden `company` field and a 3-second minimum fill time. If sending fails, the
form offers a pre-filled mailto link instead.

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
