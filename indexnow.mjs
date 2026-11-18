// Tells Bing, Yandex, Seznam and other IndexNow engines that every URL in the
// sitemap changed, so new pages and posts get crawled within hours.
// Run after a deploy: npm run indexnow
import { readFileSync } from 'node:fs';

const HOST = 'www.anaortiz.events';
const key = readFileSync(new URL('./.indexnow-key', import.meta.url), 'utf8').trim();
const sitemap = readFileSync(new URL('./dist/sitemap.xml', import.meta.url), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} for ${urlList.length} URLs`);
if (res.status >= 400) process.exit(1);
