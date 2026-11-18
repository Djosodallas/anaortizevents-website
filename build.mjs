// Static build for anaortiz.events (English + Mexican Spanish).
//
// Pages:  src/pages/*.html (English) and src/pages/es/*.html (Spanish).
//         Each starts with <!--@head title="…" description="…" path="/x" alt="/es/y"-->
//         and uses <!--@header--> / <!--@footer-->.
// Blog:   src/blog/en/<slug>.html → /blog/<slug>, src/blog/es/<slug>.html → /es/blog/<slug>
//         (format in src/blog/FORMAT.md). Index pages /blog and /es/blog are generated.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const SITE = 'https://www.anaortiz.events';
const root = new URL('.', import.meta.url).pathname;
const dist = join(root, 'dist');
const read = (p) => readFileSync(join(root, p), 'utf8');

const LANGS = {
  en: { html: 'en-US', og: 'en_US', prefix: '', partials: '', date: 'en-US' },
  es: { html: 'es-MX', og: 'es_MX', prefix: '/es', partials: '.es', date: 'es-MX' },
};

const T = {
  en: {
    blogTitle: 'Event Planning Blog | Ana Ortiz Events',
    blogDescription: 'Wedding, quinceañera and event planning advice from Ana Ortiz, a day-of coordinator in Dallas–Fort Worth: timelines, budgets, traditions, vendors and more.',
    blogH1: 'Event planning blog',
    blogLede: 'Practical advice for planning a wedding or quinceañera in Dallas–Fort Worth, from timelines and budgets to traditions and day-of details.',
    readPost: 'Read the article',
    back: 'All articles',
    ctaH: 'Ready to enjoy the moment you planned for?',
    ctaP: 'Tell Ana your date and venue. She’ll get back to you with availability and pricing.',
    ctaBtn: 'Contact us today',
    contact: '/contact',
    by: 'By Ana Ortiz, day-of event coordinator',
  },
  es: {
    blogTitle: 'Blog de planeación de eventos | Ana Ortiz Events',
    blogDescription: 'Consejos para planear bodas, quince años y eventos de Ana Ortiz, coordinadora del día en Dallas–Fort Worth: itinerarios, presupuesto, tradiciones y proveedores.',
    blogH1: 'Blog de planeación de eventos',
    blogLede: 'Consejos prácticos para planear una boda o unos quince años en Dallas–Fort Worth, desde el itinerario y el presupuesto hasta las tradiciones y los detalles del día.',
    readPost: 'Leer el artículo',
    back: 'Todos los artículos',
    ctaH: '¿Listos para disfrutar el momento que tanto planearon?',
    ctaP: 'Cuéntale a Ana la fecha y el salón. Ella te responde con su disponibilidad y precios.',
    ctaBtn: 'Contáctanos hoy',
    contact: '/es/contacto',
    by: 'Por Ana Ortiz, coordinadora de eventos del día',
  },
};

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'public'), dist, { recursive: true });

const sitemap = []; // { loc, alt, lang, lastmod }
const pages = []; // for llms.txt
const TODAY = new Date().toISOString().slice(0, 10);
const strip = (h) =>
  String(h)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(br|\/p|\/li|\/h[1-6]|\/summary)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fileFor = (path) => (path === '/' ? 'index.html' : path.replace(/^\//, '') + '.html');

// Sitewide structured data: one business entity (@id #business) and the WebSite,
// referenced from every page so Google, Bing and AI assistants see the same facts.
const BUSINESS = (lang) => ({
  '@type': ['ProfessionalService', 'LocalBusiness'],
  '@id': `${SITE}/#business`,
  name: 'Ana Ortiz Events',
  alternateName: 'Ana Ortiz, Event Coordinator',
  description:
    lang === 'es'
      ? 'Coordinadora del día para bodas y quince años en Dallas–Fort Worth, Texas. Manejo del itinerario, coordinación de proveedores, cortejo o corte de honor y hasta 6 horas de coordinación en el evento. Atiende en inglés y español.'
      : 'Day-of wedding and quinceañera coordinator in Dallas–Fort Worth, Texas. Timeline management, vendor coordination, wedding party or court management and up to 6 hours of on-site coordination. Serves families in English and Spanish.',
  url: `${SITE}/`,
  telephone: '+1-469-970-4473',
  email: 'anaortizevents@gmail.com',
  image: `${SITE}/images/og-1200x630.jpg`,
  logo: `${SITE}/images/ao-mark.webp`,
  founder: { '@type': 'Person', name: 'Ana Ortiz', jobTitle: lang === 'es' ? 'Coordinadora de eventos' : 'Event coordinator' },
  address: { '@type': 'PostalAddress', addressLocality: 'Dallas', addressRegion: 'TX', addressCountry: 'US' },
  areaServed: [
    { '@type': 'City', name: 'Dallas' },
    { '@type': 'City', name: 'Fort Worth' },
    { '@type': 'AdministrativeArea', name: 'Dallas–Fort Worth metroplex, Texas' },
  ],
  availableLanguage: ['English', 'Spanish'],
  knowsAbout: ['Wedding coordination', 'Quinceañera coordination', 'Day-of coordination', 'Event timelines', 'Vendor management', 'Mexican wedding traditions', 'Quinceañera traditions'],
  makesOffer: [
    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: lang === 'es' ? 'Coordinación del día para bodas' : 'Day-of wedding coordination', serviceType: 'Wedding coordination', areaServed: 'Dallas–Fort Worth, TX' } },
    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: lang === 'es' ? 'Coordinación del día para quince años' : 'Day-of quinceañera coordination', serviceType: 'Quinceañera coordination', areaServed: 'Dallas–Fort Worth, TX' } },
  ],
  priceRange: lang === 'es' ? 'Cotización por evento' : 'Quoted per event',
  sameAs: ['https://www.instagram.com/anaortiz_events/', 'https://www.facebook.com/anaortizevents'],
});
const WEBSITE = (lang) => ({
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  url: `${SITE}/`,
  name: 'Ana Ortiz Events',
  inLanguage: ['en-US', 'es-MX'],
  publisher: { '@id': `${SITE}/#business` },
});
const ldScript = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const crumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + (path === '/' ? '/' : path) })),
});

function head(lang, { title, description, path, alt, noindex, extra = '', ogtype = 'website', graph = [] }) {
  const L = LANGS[lang];
  const canonical = SITE + (path === '/' ? '/' : path);
  let alternates = '';
  if (alt) {
    const enPath = lang === 'en' ? path : alt;
    const esPath = lang === 'es' ? path : alt;
    const abs = (p) => SITE + (p === '/' ? '/' : p);
    alternates = [
      `<link rel="alternate" hreflang="en-US" href="${abs(enPath)}">`,
      `<link rel="alternate" hreflang="es-MX" href="${abs(esPath)}">`,
      `<link rel="alternate" hreflang="x-default" href="${abs(enPath)}">`,
    ].join('\n');
  }
  return read('src/partials/head.html')
    .replace('{{htmllang}}', L.html)
    .replaceAll('{{title}}', esc(title))
    .replaceAll('{{description}}', esc(description))
    .replaceAll('{{canonical}}', canonical)
    .replace('{{oglocale}}', L.og)
    .replace('{{alternates}}', alternates)
    .replace('{{robots}}', noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">')
    .replace('{{ogtype}}', ogtype)
    .replace('{{oglocalealt}}', alt ? `<meta property="og:locale:alternate" content="${lang === 'en' ? 'es_MX' : 'en_US'}">` : '')
    .replace('{{ogimagealt}}', lang === 'es' ? 'Una quinceañera abrazando a su mamá en la pista de baile' : 'A quinceañera hugging her mother on the dance floor')
    .replace('{{feedtitle}}', lang === 'es' ? 'Blog de Ana Ortiz Events' : 'Ana Ortiz Events blog')
    .replace('{{feedurl}}', `${SITE}${L.prefix}/blog/feed.xml`)
    .replace('{{schema}}', noindex ? '' : ldScript({ '@context': 'https://schema.org', '@graph': [BUSINESS(lang), WEBSITE(lang), ...graph] }))
    .replace('{{extra}}', extra);
}

function header(lang, nav, alt) {
  const L = LANGS[lang];
  const switchTo = alt || (lang === 'en' ? '/es' : '/');
  return read(`src/partials/header${L.partials}.html`)
    .replace(`data-nav="${nav}"`, `data-nav="${nav}" aria-current="page"`)
    .replace('{{langswitch}}', switchTo);
}
const footer = (lang) =>
  read(`src/partials/footer${LANGS[lang].partials}.html`).replace('{{year}}', String(new Date().getFullYear()));

function write(path, html) {
  const out = join(dist, fileFor(path));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

// ---------- Pages ----------
for (const lang of ['en', 'es']) {
  const dir = lang === 'en' ? 'src/pages' : 'src/pages/es';
  for (const file of readdirSync(join(root, dir)).filter((f) => f.endsWith('.html'))) {
    let html = read(`${dir}/${file}`);
    const nav = file.replace('.html', '');
    const m = html.match(/<!--@head (.*?)-->/s);
    const a = Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1], x[2].replace(/&amp;/g, '&')]));
    const is404 = nav === '404';
    const graph = [];
    const home = lang === 'en' ? '/' : '/es';
    if (a.path !== home && !is404) graph.push(crumbs([[lang === 'es' ? 'Inicio' : 'Home', home], [a.title.split(' | ')[0], a.path]]));
    // FAQ blocks (<details><summary>Q</summary><p>A</p></details>) become FAQPage data.
    const faqs = [...html.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g)];
    if (faqs.length) {
      graph.push({
        '@type': 'FAQPage',
        inLanguage: LANGS[lang].html,
        mainEntity: faqs.map((f) => ({ '@type': 'Question', name: strip(f[1]), acceptedAnswer: { '@type': 'Answer', text: strip(f[2]) } })),
      });
    }
    pages.push({ lang, path: a.path, title: a.title, description: a.description, text: is404 ? '' : strip(html.replace(/<script[\s\S]*?<\/script>/g, '')) });
    html = html
      .replace(m[0], head(lang, { ...a, noindex: is404, graph }))
      .replace('<!--@header-->', header(lang, nav, a.alt))
      .replace('<!--@footer-->', footer(lang));
    write(a.path, html);
    if (!is404) sitemap.push({ loc: a.path, alt: a.alt, lang });
  }
}

// ---------- Blog ----------
function parsePost(lang, file) {
  const raw = read(`src/blog/${lang}/${file}`);
  const m = raw.match(/^<!--@post\s*([\s\S]*?)-->/);
  if (!m) throw new Error(`Missing @post header in src/blog/${lang}/${file}`);
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const k of ['title', 'description', 'date', 'alt']) {
    if (!meta[k]) throw new Error(`src/blog/${lang}/${file} is missing "${k}"`);
  }
  const slug = file.replace('.html', '');
  return { ...meta, slug, lang, path: `${LANGS[lang].prefix}/blog/${slug}`, body: raw.slice(m[0].length).trim() };
}

const fmtDate = (lang, d) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString(LANGS[lang].date, { dateStyle: 'long', timeZone: 'UTC' });

const posts = { en: [], es: [] };
for (const lang of ['en', 'es']) {
  const dir = join(root, 'src/blog', lang);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.html'))) posts[lang].push(parsePost(lang, f));
  posts[lang].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)));
}

for (const lang of ['en', 'es']) {
  const t = T[lang];
  for (const p of posts[lang]) {
    const words = strip(p.body).split(/\s+/).length;
    const graph = [
      {
        '@type': 'BlogPosting',
        '@id': `${SITE}${p.path}#article`,
        headline: p.title,
        description: p.description,
        datePublished: p.date,
        dateModified: p.updated || p.date,
        inLanguage: LANGS[lang].html,
        mainEntityOfPage: SITE + p.path,
        image: `${SITE}/images/og-1200x630.jpg`,
        wordCount: words,
        articleSection: lang === 'es' ? 'Planeación de eventos' : 'Event planning',
        author: { '@type': 'Person', name: 'Ana Ortiz', jobTitle: lang === 'es' ? 'Coordinadora de bodas y quince años' : 'Wedding and quinceañera coordinator', worksFor: { '@id': `${SITE}/#business` }, url: SITE + (lang === 'es' ? '/es' : '/') },
        publisher: { '@id': `${SITE}/#business` },
        isPartOf: { '@id': `${SITE}${LANGS[lang].prefix}/blog#blog` },
      },
      crumbs([[lang === 'es' ? 'Inicio' : 'Home', lang === 'es' ? '/es' : '/'], ['Blog', `${LANGS[lang].prefix}/blog`], [p.title, p.path]]),
    ];
    const extra = [
      `<meta property="article:published_time" content="${p.date}">`,
      `<meta property="article:modified_time" content="${p.updated || p.date}">`,
      `<meta property="article:author" content="Ana Ortiz">`,
      `<meta name="author" content="Ana Ortiz">`,
    ].join('\n');
    pages.push({ lang, path: p.path, title: p.title, description: p.description, text: strip(p.body), post: true });
    const html = `${head(lang, { title: `${p.title} | Ana Ortiz Events`, description: p.description, path: p.path, alt: p.alt, ogtype: 'article', graph, extra })}
<body>
${header(lang, 'blog', p.alt)}
<main id="main">
  <article class="post">
    <header class="post-hero">
      <div class="wrap narrow">
        <p class="post-back"><a href="${LANGS[lang].prefix}/blog">${t.back}</a></p>
        <h1>${p.title}</h1>
        <p class="post-meta"><span>${t.by}</span><time datetime="${p.date}">${fmtDate(lang, p.date)}</time></p>
      </div>
    </header>
    <div class="wrap narrow post-body">
${p.body}
    </div>
  </article>
  <section class="post-cta">
    <div class="wrap narrow">
      <h2>${t.ctaH}</h2>
      <p>${t.ctaP}</p>
      <a class="btn" href="${t.contact}#inquiry">${t.ctaBtn}</a>
    </div>
  </section>
</main>
${footer(lang)}`;
    write(p.path, html);
    sitemap.push({ loc: p.path, alt: p.alt, lang, lastmod: p.updated || p.date });
  }

  // Index
  const indexPath = `${LANGS[lang].prefix}/blog`;
  const altIndex = lang === 'en' ? '/es/blog' : '/blog';
  const cards = posts[lang]
    .map(
      (p) => `      <li class="post-card">
        <a href="${p.path}">
          <h2>${p.title}</h2>
          <p>${p.description}</p>
          <span class="text-link">${t.readPost}</span>
        </a>
      </li>`
    )
    .join('\n');
  write(
    indexPath,
    `${head(lang, {
      title: t.blogTitle,
      description: t.blogDescription,
      path: indexPath,
      alt: altIndex,
      graph: [
        {
          '@type': 'Blog',
          '@id': `${SITE}${indexPath}#blog`,
          name: t.blogH1,
          description: t.blogDescription,
          url: SITE + indexPath,
          inLanguage: LANGS[lang].html,
          publisher: { '@id': `${SITE}/#business` },
          blogPost: posts[lang].map((p) => ({ '@id': `${SITE}${p.path}#article` })),
        },
        crumbs([[lang === 'es' ? 'Inicio' : 'Home', lang === 'es' ? '/es' : '/'], ['Blog', indexPath]]),
      ],
    })}
<body>
${header(lang, 'blog', altIndex)}
<main id="main">
  <section class="page-hero">
    <div class="wrap">
      <h1>${t.blogH1}</h1>
      <p class="page-lede">${t.blogLede}</p>
    </div>
  </section>
  <section class="blog-list">
    <ul class="wrap post-grid">
${cards}
    </ul>
  </section>
</main>
${footer(lang)}`
  );
  sitemap.push({ loc: indexPath, alt: altIndex, lang, lastmod: posts[lang][0]?.date });

  // RSS feed
  const xmlEsc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const items = posts[lang]
    .map((p) => `  <item>\n    <title>${xmlEsc(p.title)}</title>\n    <link>${SITE}${p.path}</link>\n    <guid>${SITE}${p.path}</guid>\n    <pubDate>${new Date(`${p.date}T12:00:00Z`).toUTCString()}</pubDate>\n    <description>${xmlEsc(p.description)}</description>\n  </item>`)
    .join('\n');
  mkdirSync(join(dist, indexPath.slice(1)), { recursive: true });
  writeFileSync(
    join(dist, indexPath.slice(1), 'feed.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n  <title>${xmlEsc(t.blogTitle)}</title>\n  <link>${SITE}${indexPath}</link>\n  <atom:link href="${SITE}${indexPath}/feed.xml" rel="self" type="application/rss+xml"/>\n  <description>${xmlEsc(t.blogDescription)}</description>\n  <language>${LANGS[lang].html.toLowerCase()}</language>\n${items}\n</channel>\n</rss>\n`
  );
}

// ---------- Sitemap with language alternates ----------
const abs = (p) => SITE + (p === '/' ? '/' : p);
const urlXml = sitemap
  .map(({ loc, alt, lang, lastmod }) => {
    const links = alt
      ? `\n    <xhtml:link rel="alternate" hreflang="${LANGS[lang].html}" href="${abs(loc)}"/>\n    <xhtml:link rel="alternate" hreflang="${LANGS[lang === 'en' ? 'es' : 'en'].html}" href="${abs(alt)}"/>`
      : '';
    return `  <url>\n    <loc>${abs(loc)}</loc>\n    <lastmod>${lastmod || TODAY}</lastmod>${links}\n  </url>`;
  })
  .join('\n');
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlXml}\n</urlset>\n`
);

// ---------- llms.txt / llms-full.txt for AI assistants ----------
const pageList = (lang, post) =>
  pages
    .filter((p) => p.lang === lang && !!p.post === post && p.text)
    .map((p) => `- [${p.title.split(' | ')[0]}](${abs(p.path)}): ${p.description}`)
    .join('\n');
const llms = `# Ana Ortiz Events

> Ana Ortiz is a day-of wedding and quinceañera coordinator serving the Dallas–Fort Worth metroplex in Texas, in English and Spanish. Families and couples plan and book their own vendors; Ana joins in the months before the event (unlimited communication, virtual planning meetings, venue walkthrough, design guidance, vendor recommendations and vendor management, a custom timeline and a final details meeting) and runs the day itself with up to 6 hours of on-site coordination. Pricing is quoted per event. Now booking 2026–2027.

Contact: call or text 469-970-4473, email anaortizevents@gmail.com, or use the form at ${SITE}/contact (Spanish: ${SITE}/es/contacto).
Instagram: https://www.instagram.com/anaortiz_events/ · Facebook: https://www.facebook.com/anaortizevents

## Pages (English)
${pageList('en', false)}

## Páginas (español, México)
${pageList('es', false)}

## Blog (English)
${pageList('en', true)}

## Blog (español)
${pageList('es', true)}

## Optional
- [Full text of every page and article](${SITE}/llms-full.txt)
- [Sitemap](${SITE}/sitemap.xml)
`;
writeFileSync(join(dist, 'llms.txt'), llms);
writeFileSync(
  join(dist, 'llms-full.txt'),
  `# Ana Ortiz Events: full site text\n\nSource: ${SITE}/ · Generated ${TODAY}\n\n` +
    pages
      .filter((p) => p.text)
      .map((p) => `---\n\n# ${p.title}\nURL: ${abs(p.path)}\nLanguage: ${LANGS[p.lang].html}\n\n${p.text}\n`)
      .join('\n')
);

// ---------- Checks: every alt link must exist ----------
const built = new Set(sitemap.map((s) => s.loc));
const broken = sitemap.filter((s) => s.alt && !built.has(s.alt));
if (broken.length) {
  console.error('Missing language twins:\n' + broken.map((b) => `  ${b.loc} → ${b.alt}`).join('\n'));
  process.exit(1);
}
console.log(`Built ${sitemap.length} pages (${posts.en.length} EN posts, ${posts.es.length} ES posts) → dist/`);
