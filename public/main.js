const ES = (document.documentElement.lang || '').startsWith('es');
const L = ES ? {
  close: 'Cerrar', menu: 'Menú', sending: 'Enviando…', send: 'Enviar a Ana',
  missing: (m) => `Agrega ${m} para que Ana pueda revisar su agenda.`,
  and: ', ',
  thanks: (n) => `¡Enviado! Gracias, ${n}.`,
  got: (e) => `Ana ya tiene tus datos y te responderá a ${e} con su disponibilidad y una cotización. ¿La necesitas antes? Llama o manda mensaje al 469-970-4473.`,
  failed: 'Tu mensaje no se envió. <a href="#" class="mailto-fallback">Envíalo desde tu app de correo</a> o llama al 469-970-4473.',
  locale: 'es-MX',
  f: { name: 'Nombre', type: 'Tipo de evento', quince: 'Novios / quinceañera', email: 'Correo', phone: 'Teléfono', date: 'Fecha del evento', venue: 'Salón', subject: 'Consulta de evento' },
} : {
  close: 'Close', menu: 'Menu', sending: 'Sending…', send: 'Send to Ana',
  missing: (m) => `Add your ${m} so Ana can check her calendar.`,
  and: ', ',
  thanks: (n) => `Sent. Thank you, ${n}!`,
  got: (e) => `Ana has your details and will get back to you at ${e} with availability and pricing. Need her sooner? Call or text 469-970-4473.`,
  failed: 'Your message didn’t go through. <a href="#" class="mailto-fallback">Send it from your email app instead</a> or call 469-970-4473.',
  locale: 'en-US',
  f: { name: 'Name', type: 'Event type', quince: 'Couple / quinceañera', email: 'Email', phone: 'Phone', date: 'Event date', venue: 'Venue', subject: 'Event inquiry' },
};

// Mobile menu
const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? (toggle.dataset.open || L.close) : (toggle.dataset.closed || L.menu);
  });
}

// Inquiry form: validates, then posts to /api/inquiry, which emails Ana.
// If sending fails, falls back to opening the visitor's email app pre-filled.
const form = document.getElementById('inquiry');
if (form) {
  const error = form.querySelector('.form-error');
  const started = Date.now();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const missing = [];
    form.querySelectorAll('[required]').forEach((input) => {
      const bad = !input.value.trim() || (input.type === 'email' && !input.checkValidity());
      input.setAttribute('aria-invalid', String(bad));
      if (bad) {
        const label = input.closest('.field').querySelector('span').firstChild.textContent.trim();
        missing.push(ES ? ({ email: 'tu correo', date: 'la fecha del evento', type: 'el tipo de evento' }[input.name] || 'tu nombre') : label.toLowerCase());
      }
    });
    if (missing.length) {
      error.textContent = L.missing(missing.join(L.and));
      error.hidden = false;
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    error.hidden = true;
    const d = Object.fromEntries(new FormData(form));
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = L.sending;
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...d, lang: ES ? 'es' : 'en', elapsed: Date.now() - started }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) {
        form.innerHTML = `<div class="form-success" role="status" tabindex="-1"><h2>${L.thanks(escapeHtml(d.name.split(' ')[0]))}</h2><p>${L.got(escapeHtml(d.email))}</p></div>`;
        form.querySelector('.form-success').focus();
        return;
      }
      if (res.status === 400 && out.error) {
        error.textContent = out.error;
        error.hidden = false;
        button.disabled = false;
        button.textContent = L.send;
        return;
      }
    } catch {}
    button.disabled = false;
    button.textContent = L.send;
    error.innerHTML = L.failed;
    error.hidden = false;
    const date = d.date ? new Date(d.date + 'T12:00').toLocaleDateString(L.locale, { dateStyle: 'long' }) : '';
    const lines = [
      `${L.f.name}: ${d.name}`,
      d.type ? `${L.f.type}: ${form.querySelector('[name=type] option:checked').textContent}` : null,
      d.quince ? `${L.f.quince}: ${d.quince}` : null,
      `${L.f.email}: ${d.email}`,
      d.phone ? `${L.f.phone}: ${d.phone}` : null,
      `${L.f.date}: ${date}`,
      d.venue ? `${L.f.venue}: ${d.venue}` : null,
    ].filter(Boolean);
    if (d.message) lines.push('', d.message);
    const body = lines.join('\n');
    const subject = `${L.f.subject}: ${date}`;
    error.querySelector('.mailto-fallback').href = `mailto:anaortizevents@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Mobile timeline motion: reveal steps, light up the current one, fill the line, parallax.
const timeline = document.querySelector('.timeline');
const mobile = window.matchMedia('(max-width: 600px)');
const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
if (timeline && mobile.matches && !calm.matches) {
  const steps = [...timeline.children];
  timeline.classList.add('timeline-animated');
  const seen = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) en.target.classList.add('is-in');
  }, { rootMargin: '0px 0px -18% 0px' });
  steps.forEach((s) => seen.observe(s));
  const end = document.querySelector('.day-end');
  if (end) seen.observe(end);

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    const focus = vh * 0.55;
    const box = timeline.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (focus - box.top) / box.height));
    timeline.style.setProperty('--progress', progress.toFixed(4));
    let active = null;
    for (const s of steps) {
      const r = s.getBoundingClientRect();
      s.style.setProperty('--shift', Math.max(-30, Math.min(30, (r.top + r.height / 2 - focus) / 10)).toFixed(2));
      if (r.top <= focus) active = s;
    }
    steps.forEach((s) => s.classList.toggle('is-active', s === active));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}
