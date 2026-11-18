// Serves the static site and handles POST /api/inquiry by emailing Ana.
// Email goes out through Cloudflare Email Routing's send_email binding (INQUIRY_EMAIL),
// from inquiries@anaortiz.events to the verified address anaortizevents@gmail.com.
import { EmailMessage } from 'cloudflare:email';

const TO = 'anaortizevents@gmail.com';
const FROM = 'inquiries@anaortiz.events';
const CANONICAL_HOST = 'www.anaortiz.events';
const LIMITS = { name: 120, quince: 120, email: 200, phone: 40, date: 20, venue: 200, message: 4000 };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // One canonical host: anything that isn't www.anaortiz.events (the bare domain,
    // or any other hostname that reaches this Worker) is sent to www with a 301.
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.hostname !== CANONICAL_HOST && !local) {
      url.hostname = CANONICAL_HOST;
      url.protocol = 'https:';
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === '/api/inquiry') {
      if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405);
      return handleInquiry(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleInquiry(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'The form data could not be read.' }, 400);
  }

  // Spam traps: hidden field must stay empty, and a human takes more than 3 seconds.
  if (data.company) return json({ ok: true });
  if (Number(data.elapsed) < 3000) return json({ ok: true });

  const f = {};
  for (const [key, max] of Object.entries(LIMITS)) {
    f[key] = String(data[key] ?? '').trim().slice(0, max);
  }
  const missing = ['name', 'email', 'date'].filter((k) => !f[k]);
  if (missing.length) return json({ error: `Add your ${missing.join(', ')}.` }, 400);
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(f.email)) return json({ error: 'Check the email address.' }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return json({ error: 'Check the event date.' }, 400);

  const prettyDate = new Date(`${f.date}T12:00:00Z`).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' });
  const lines = [
    'New quinceañera inquiry from anaortiz.events',
    '',
    `Name: ${f.name}`,
    f.quince ? `Quinceañera: ${f.quince}` : null,
    `Email: ${f.email}`,
    f.phone ? `Phone: ${f.phone}` : null,
    `Event date: ${prettyDate}`,
    f.venue ? `Venue: ${f.venue}` : null,
    '',
    f.message ? `Message:\n${f.message}` : 'No message.',
    '',
    'Reply to this email to answer them directly.',
  ].filter((l) => l !== null);

  const raw = buildMime({
    from: `Ana Ortiz Events Website <${FROM}>`,
    to: TO,
    replyTo: `${sanitizeHeader(f.name)} <${f.email}>`,
    subject: `Quinceañera inquiry: ${f.name}, ${prettyDate}`,
    text: lines.join('\r\n'),
  });

  try {
    await env.INQUIRY_EMAIL.send(new EmailMessage(FROM, TO, raw));
  } catch (err) {
    console.error('send_email failed', err && err.message);
    return json({ error: 'The message could not be sent.' }, 502);
  }
  return json({ ok: true });
}

function buildMime({ from, to, replyTo, subject, text }) {
  const domain = FROM.split('@')[1];
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(text).replace(/.{76}/g, '$&\r\n'),
  ].join('\r\n');
}

function sanitizeHeader(s) {
  return s.replace(/[\r\n<>"]/g, ' ').trim() || 'Website visitor';
}
function encodeHeader(s) {
  return `=?UTF-8?B?${b64(sanitizeHeader(s))}?=`;
}
function b64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
