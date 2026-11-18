// Mobile menu
const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
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
      if (bad) missing.push(input.closest('.field').querySelector('span').firstChild.textContent.trim().toLowerCase());
    });
    if (missing.length) {
      error.textContent = `Add your ${missing.join(', ')} so Ana can check her calendar.`;
      error.hidden = false;
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    error.hidden = true;
    const d = Object.fromEntries(new FormData(form));
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Sending…';
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...d, elapsed: Date.now() - started }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) {
        form.innerHTML = `<div class="form-success" role="status" tabindex="-1"><h2>Sent. Thank you, ${escapeHtml(d.name.split(' ')[0])}!</h2><p>Ana has your details and will get back to you at ${escapeHtml(d.email)} with availability and pricing. Need her sooner? Call or text 469-970-4473.</p></div>`;
        form.querySelector('.form-success').focus();
        return;
      }
      if (res.status === 400 && out.error) {
        error.textContent = out.error;
        error.hidden = false;
        button.disabled = false;
        button.textContent = 'Send to Ana';
        return;
      }
    } catch {}
    button.disabled = false;
    button.textContent = 'Send to Ana';
    error.innerHTML = 'Your message didn’t go through. <a href="#" class="mailto-fallback">Send it from your email app instead</a> or call 469-970-4473.';
    error.hidden = false;
    const date = d.date ? new Date(d.date + 'T12:00').toLocaleDateString('en-US', { dateStyle: 'long' }) : '';
    const lines = [
      `Name: ${d.name}`,
      d.quince ? `Quinceañera: ${d.quince}` : null,
      `Email: ${d.email}`,
      d.phone ? `Phone: ${d.phone}` : null,
      `Event date: ${date}`,
      d.venue ? `Venue: ${d.venue}` : null,
    ].filter(Boolean);
    if (d.message) lines.push('', d.message);
    const body = lines.join('\n');
    const subject = `Quinceañera inquiry: ${date}`;
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
