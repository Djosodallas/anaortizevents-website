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

There is no backend yet. The form validates, then opens the visitor's email
app pre-filled to anaortizevents@gmail.com. Once DNS is on Cloudflare this
can become a Worker endpoint that emails Ana directly.

## DNS move to Cloudflare (next step)

Current state (checked 2026-11-18): nameservers are NS1 (`dns1–4.p01.nsone.net`,
Squarespace Domains). Records in use:

| Name | Type | Value | After the move |
| --- | --- | --- | --- |
| `anaortiz.events` | A ×4 | Squarespace IPs | Replaced by Worker custom domain |
| `www` | CNAME | `ext-sq.squarespace.com` | Replaced by Worker custom domain |
| `anaortiz.events` | TXT | `v=spf1 -all` | Keep (no email is sent from this domain) |

No MX records: Ana's email is Gmail, so nothing email-related moves.

Steps:
1. djosito214 dashboard → Add a domain → `anaortiz.events` (Free plan).
   Let it import records; delete the Squarespace A/CNAME records, keep the SPF TXT.
2. At Squarespace Domains → DNS → Nameservers → use custom nameservers →
   enter the two Cloudflare nameservers Cloudflare shows.
3. When the zone is Active, uncomment the `routes` block in `wrangler.jsonc`
   and `npm run deploy` (creates `anaortiz.events` and `www.anaortiz.events`).
4. Add a redirect rule so `anaortiz.events` → `https://www.anaortiz.events`
   (www is the canonical host, matching the old site).
5. Cancel the Squarespace website plan only after the new site is live
   (keep the domain registration until it's transferred or renewed).
