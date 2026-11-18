// Tiny static build: copies public/ to dist/ and expands partials in src/pages.
// In a page: <!--@head title="..." description="..." path="/x"--> and <!--@header-->, <!--@footer-->.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://www.anaortiz.events';
const root = new URL('.', import.meta.url).pathname;
const dist = join(root, 'dist');
const partial = (name) => readFileSync(join(root, 'src/partials', `${name}.html`), 'utf8');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(join(root, 'public'), dist, { recursive: true });

const urls = [];
for (const file of readdirSync(join(root, 'src/pages')).filter((f) => f.endsWith('.html'))) {
  let html = readFileSync(join(root, 'src/pages', file), 'utf8');
  const nav = file.replace('.html', '');

  html = html.replace(/<!--@head (.*?)-->/s, (_, attrs) => {
    const a = Object.fromEntries([...attrs.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
    const canonical = SITE + (a.path === '/' ? '/' : a.path);
    if (a.path && nav !== '404') urls.push(canonical);
    return partial('head')
      .replaceAll('{{title}}', a.title)
      .replaceAll('{{description}}', a.description)
      .replaceAll('{{canonical}}', canonical)
      .replace('{{robots}}', nav === '404' ? '<meta name="robots" content="noindex">' : '');
  });
  html = html
    .replace('<!--@header-->', partial('header').replace(`data-nav="${nav}"`, `data-nav="${nav}" aria-current="page"`))
    .replace('<!--@footer-->', partial('footer').replace('{{year}}', String(new Date().getFullYear())));
  writeFileSync(join(dist, file), html);
}

writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`
);
console.log(`Built ${urls.length} pages → dist/`);
