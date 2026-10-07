const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => 1 - Math.pow(1 - t, 3);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const img = (name) => `img/${name}-1280.webp`;
const arrow = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>';

// Smooth scrolling (Lenis, vendored in vendor/). Falls back to native scrolling if it isn't there.
let lenis = null;
function smoothTo(target) {
  if (lenis) { lenis.scrollTo(target, { duration: 1.4 }); return; }
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY;
  scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
}

$('#yr').textContent = new Date().getFullYear();

/* ───────── nav: pill bar, mega drawer, mobile menu ───────── */
const nav = $('#nav');
const toggle = $('.nav-toggle');
const menu = $('#mobileMenu');
const navDrop = $('#navDrop');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', open);
  menu.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (lenis) (open ? lenis.stop() : lenis.start());
});
$$('a', menu).forEach((a) => a.addEventListener('click', () => toggle.click()));

// Hover opens the drawer and a short grace period keeps it open while the mouse crosses the gap.
// A click right after a hover-open must not toggle it shut again.
let drawerTimer;
let hoverOpenedAt = 0;
function setDrawer(open) {
  clearTimeout(drawerTimer);
  nav.classList.toggle('open', open);
  navDrop.setAttribute('aria-expanded', open);
}
navDrop.addEventListener('click', () => {
  const open = nav.classList.contains('open');
  if (open && performance.now() - hoverOpenedAt < 600) return;
  setDrawer(!open);
});
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  navDrop.addEventListener('mouseenter', () => {
    if (!nav.classList.contains('open')) hoverOpenedAt = performance.now();
    setDrawer(true);
  });
  $('#drawer').addEventListener('mouseenter', () => clearTimeout(drawerTimer));
  nav.addEventListener('mouseleave', () => {
    clearTimeout(drawerTimer);
    drawerTimer = setTimeout(() => setDrawer(false), 280);
  });
  nav.addEventListener('mouseenter', () => clearTimeout(drawerTimer));
}
document.addEventListener('click', (e) => { if (!nav.contains(e.target)) setDrawer(false); });
$$('#drawer a').forEach((a) => a.addEventListener('click', () => setDrawer(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });

/* ───────── contractor.json: every business-specific value lives there ───────── */
const get = (o, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), o);
const has = (v) => !(v == null || v === false || v === '' || (Array.isArray(v) && !v.length));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (tpl, vars) => String(tpl ?? '').replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const rgb = (hex) => {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

function applyConfig(C) {
  const b = C.business;
  document.title = C.meta.title;
  $('meta[name="description"]').setAttribute('content', C.meta.description || '');
  if (C.meta.robots && !$('meta[name="robots"]')) {
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = C.meta.robots;
    document.head.appendChild(m);
  }

  // brand colours: the whole accent system hangs off these variables
  const root = document.documentElement.style;
  root.setProperty('--red', C.brand.accent);
  root.setProperty('--red-deep', C.brand.accentDeep || C.brand.accent);
  root.setProperty('--red-rgb', rgb(C.brand.accent));
  root.setProperty('--red-section', C.brand.section || C.brand.accent);

  // remove what has no data first, then fill the rest
  $$('[data-show]').forEach((el) => { if (!has(get(C, el.dataset.show))) el.remove(); });
  $$('[data-t]').forEach((el) => { el.textContent = get(C, el.dataset.t) ?? ''; });
  $$('[data-h]').forEach((el) => { el.innerHTML = get(C, el.dataset.h) ?? ''; });
  $$('[data-ph]').forEach((el) => { el.placeholder = get(C, el.dataset.ph) ?? ''; });
  $$('[data-aria]').forEach((el) => el.setAttribute('aria-label', get(C, el.dataset.aria) ?? ''));
  $$('[data-tel]').forEach((el) => { if (b.phoneE164) el.href = `tel:${b.phoneE164}`; else el.remove(); });
  $$('[data-mail]').forEach((el) => { if (b.email) el.href = `mailto:${b.email}`; else el.remove(); });
  $('.brand').setAttribute('aria-label', `${b.shortName} home`);
}


const PW = 2400;
const PH = 1800;

// Draws a little roofing town from above as an SVG string. Seeded, so it's the same every load.
function buildTown() {
  let seed = 7;
  const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))));
    return `rgb(${c.join(',')})`;
  };
  const RW = 44;
  const roadsY = [150, 650, 1150, 1650];
  const roadsX = [380, 1000, 1620, 2240];
  const roofs = ['#5b5e63', '#6e6259', '#4d5157', '#7a6a5c', '#585048', '#80858a', '#6b4f42', '#454a52'];
  const houses = [];
  const ground = [];
  const top = [];

  const tree = (x, y, r) => {
    ground.push(`<circle cx="${x + 5}" cy="${y + 6}" r="${r}" fill="rgba(0,0,0,.3)"/>`);
    top.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#2e4a2a"/><circle cx="${x - r * 0.25}" cy="${y - r * 0.25}" r="${r * 0.62}" fill="#3e6036"/>`);
  };
  const roof = (x, y, w, h, color, gable) => {
    const r = h / 2;
    top.push(`<rect x="${x + 7}" y="${y + 8}" width="${w}" height="${h}" fill="rgba(0,0,0,.38)"/>`);
    if (gable) {
      top.push(`<rect x="${x}" y="${y}" width="${w}" height="${r}" fill="${shade(color, 0.18)}"/><rect x="${x}" y="${y + r}" width="${w}" height="${r}" fill="${shade(color, -0.3)}"/>`);
    } else {
      top.push(
        `<polygon points="${x},${y} ${x + w},${y} ${x + w - r},${y + r} ${x + r},${y + r}" fill="${shade(color, 0.18)}"/>`,
        `<polygon points="${x},${y + h} ${x + w},${y + h} ${x + w - r},${y + r} ${x + r},${y + r}" fill="${shade(color, -0.32)}"/>`,
        `<polygon points="${x},${y} ${x},${y + h} ${x + r},${y + r}" fill="${shade(color, -0.05)}"/>`,
        `<polygon points="${x + w},${y} ${x + w},${y + h} ${x + w - r},${y + r}" fill="${shade(color, -0.18)}"/>`,
      );
    }
    top.push(`<line x1="${x + (gable ? 0 : r)}" y1="${y + r}" x2="${x + w - (gable ? 0 : r)}" y2="${y + r}" stroke="${shade(color, 0.35)}" stroke-width="1.5"/>`);
  };

  // lawn texture
  for (let i = 0; i < 60; i++) ground.push(`<ellipse cx="${rnd() * PW}" cy="${rnd() * PH}" rx="${80 + rnd() * 160}" ry="${60 + rnd() * 120}" fill="${pick(['#5f7046', '#4f5f39', '#66744a'])}" opacity=".5"/>`);

  const cols = [[0, roadsX[0] - RW / 2]];
  for (let i = 0; i < roadsX.length; i++) cols.push([roadsX[i] + RW / 2, (roadsX[i + 1] ?? PW + RW / 2) - RW / 2]);
  const rows = [[0, roadsY[0] - RW / 2]];
  for (let i = 0; i < roadsY.length; i++) rows.push([roadsY[i] + RW / 2, (roadsY[i + 1] ?? PH + RW / 2) - RW / 2]);

  rows.forEach(([y0, y1], ri) => cols.forEach(([x0, x1], ci) => {
    const bw = x1 - x0;
    const bh = y1 - y0;
    if (bh < 200 || bw < 200) { // edge strips: just trees
      for (let i = 0; i < (bw * bh) / 6000; i++) tree(x0 + rnd() * bw, y0 + rnd() * bh, 12 + rnd() * 16);
      return;
    }
    if (ri === 1 && ci === 3) { // the park
      ground.push(`<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" fill="#4b6636"/>`);
      ground.push(`<ellipse cx="${x0 + bw * 0.55}" cy="${y0 + bh * 0.55}" rx="${bw * 0.22}" ry="${bh * 0.16}" fill="#2c5872"/>`);
      ground.push(`<path d="M${x0} ${y0 + bh * 0.2} C ${x0 + bw * 0.3} ${y0 + bh * 0.4}, ${x0 + bw * 0.2} ${y0 + bh * 0.9}, ${x1} ${y0 + bh * 0.85}" stroke="#b9ad8f" stroke-width="8" fill="none"/>`);
      for (let i = 0; i < 70; i++) {
        const tx = x0 + rnd() * bw;
        const ty = y0 + rnd() * bh;
        if (Math.hypot((tx - (x0 + bw * 0.55)) / (bw * 0.26), (ty - (y0 + bh * 0.55)) / (bh * 0.2)) > 1) tree(tx, ty, 12 + rnd() * 18);
      }
      return;
    }
    const lot = 118;
    const n = Math.floor((bw - 16) / lot);
    const pad = (bw - n * lot) / 2;
    for (const side of ['top', 'bottom']) {
      for (let k = 0; k < n; k++) {
        const cx = x0 + pad + lot * (k + 0.5);
        const w = 70 + rnd() * 22;
        const h = 52 + rnd() * 14;
        const x = cx - w / 2 + (rnd() - 0.5) * 10;
        const set = 30 + rnd() * 12;
        const y = side === 'top' ? y0 + set : y1 - set - h;
        const dx = cx + (rnd() > 0.5 ? w / 2 - 20 : -w / 2 + 4);
        ground.push(side === 'top'
          ? `<rect x="${dx}" y="${y0}" width="16" height="${y - y0 + 4}" fill="#8f8b83"/>`
          : `<rect x="${dx}" y="${y + h - 4}" width="16" height="${y1 - y - h + 4}" fill="#8f8b83"/>`);
        if (rnd() > 0.82) { // backyard pool
          const py = side === 'top' ? y + h + 22 : y - 52;
          ground.push(`<rect x="${cx - 20}" y="${py}" width="40" height="28" rx="6" fill="#d9d3c4"/><rect x="${cx - 16}" y="${py + 4}" width="32" height="20" rx="4" fill="#3fa0b8"/>`);
        }
        const color = pick(roofs);
        const gable = rnd() > 0.55;
        roof(x, y, w, h, color, gable);
        houses.push({ x, y, w, h, gable, cx: x + w / 2, cy: y + h / 2 });
      }
    }
    // backyard trees down the middle of the block
    for (let i = 0; i < bw / 55; i++) tree(x0 + 10 + rnd() * (bw - 20), y0 + bh * 0.42 + rnd() * bh * 0.16, 12 + rnd() * 16);
  }));

  // roads, sidewalks, centre lines
  const roads = [];
  for (const y of roadsY) {
    roads.push(`<rect x="0" y="${y - RW / 2 - 6}" width="${PW}" height="${RW + 12}" fill="#a9a59c"/>`);
    roads.push(`<rect x="0" y="${y - RW / 2}" width="${PW}" height="${RW}" fill="#3b3f44"/>`);
  }
  for (const x of roadsX) {
    roads.push(`<rect x="${x - RW / 2 - 6}" y="0" width="${RW + 12}" height="${PH}" fill="#a9a59c"/>`);
    roads.push(`<rect x="${x - RW / 2}" y="0" width="${RW}" height="${PH}" fill="#3b3f44"/>`);
  }
  for (const y of roadsY) roads.push(`<line x1="0" y1="${y}" x2="${PW}" y2="${y}" stroke="#d8cf9e" stroke-width="2" stroke-dasharray="18 14"/>`);
  for (const x of roadsX) roads.push(`<line x1="${x}" y1="0" x2="${x}" y2="${PH}" stroke="#d8cf9e" stroke-width="2" stroke-dasharray="18 14"/>`);
  for (const y of roadsY) for (const x of roadsX) roads.push(`<rect x="${x - RW / 2}" y="${y - RW / 2}" width="${RW}" height="${RW}" fill="#3b3f44"/>`);
  // street trees
  for (const y of roadsY) for (let x = 40; x < PW; x += 150 + rnd() * 120) if (!roadsX.some((rx) => Math.abs(rx - x) < 60)) tree(x, y + (rnd() > 0.5 ? 1 : -1) * (RW / 2 + 16), 12 + rnd() * 8);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}" viewBox="0 0 ${PW} ${PH}"><rect width="${PW}" height="${PH}" fill="#56653f"/>${ground.join('')}${roads.join('')}${top.join('')}</svg>`;
  return { svg, houses };
}

async function boot(C) {
  applyConfig(C);

  /* ───────── hero: aerial town → camera flies in → circle dive into the job ───────── */
  // Pins on the roofs. `at` is a rough spot on the 2400×1800 town; each pin snaps to the nearest house.
  const JOBS = C.jobs.map((j) => ({ ...j, img: img(j.img) }));
  const chipKeys = C.hero.chips.filter(([k]) => k === 'all' || JOBS.some((j) => j.k === k));
  $('#heroChips').innerHTML = chipKeys.map(([k, l], i) => `<button class="chip${i ? '' : ' active'}" data-k="${esc(k)}">${esc(l)}</button>`).join('') + '<span class="mono chip-count" id="heroCount"></span>';
  const countLabel = (n) => `${n} ${n === 1 ? C.hero.countLabel.replace(/s$/, '') : C.hero.countLabel}`;
  $('#heroCount').textContent = countLabel(JOBS.length);

  const heroEl = $('#hero');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const stage = $('#heroStage');
  const plane = $('#plane');
  const pinsEl = $('#pins');
  const dive = $('#dive');
  const heroFade = $('#heroFade');
  const town = buildTown();
  const townUrl = URL.createObjectURL(new Blob([town.svg], { type: 'image/svg+xml' }));
  $('#planeBase').src = townUrl;
  $('#planeLit').src = townUrl;

  // snap each job to the nearest unused house
  const used = new Set();
  JOBS.forEach((job, i) => {
    let best = null;
    let bd = Infinity;
    town.houses.forEach((h, hi) => {
      const d = Math.hypot(h.cx - job.at[0], h.cy - job.at[1]);
      if (d < bd && !used.has(hi)) { bd = d; best = hi; }
    });
    used.add(best);
    job.x = town.houses[best].cx;
    job.y = town.houses[best].cy;
    const pin = document.createElement('button');
    pin.className = 'pin';
    pin.type = 'button';
    pin.dataset.i = i;
    pin.style.left = job.x + 'px';
    pin.style.top = job.y + 'px';
    pin.style.setProperty('--d', `${0.35 + i * 0.09}s`);
    pin.setAttribute('aria-label', [job.title, job.town].filter(Boolean).join(', '));
    pin.innerHTML = `<span class="pin-up"><span class="pin-tag"><i class="pin-dot"></i>${esc(job.label)}${job.em ? `<em>${esc(job.em)}</em>` : ''}</span><span class="pin-stem"></span><span class="pin-base"></span></span>`;
    pinsEl.appendChild(pin);
  });
  const pins = $$('.pin', pinsEl);

  let active = 0;
  function setActive(i) {
    active = i;
    const job = JOBS[i];
    pins.forEach((p, pi) => p.classList.toggle('is-a', pi === i));
    $('#diveImg').src = job.img;
    $('#diveImg').alt = job.title;
    $('#diveEyebrow').textContent = [C.hero.featuredLabel, job.type, job.town].filter(Boolean).join(' · ');
    $('#diveTitle').textContent = job.title;
    $('#diveLine').textContent = job.line;
    $('#diveFact').textContent = job.fact || '';
    $('#diveMeta').textContent = job.meta || '';
    $('#heroJobTown').textContent = [job.town, job.type].filter(Boolean).join(' · ');
  }
  setActive(0);

  // hero chips filter the pins
  $$('#heroChips .chip').forEach((chip) => chip.addEventListener('click', () => {
    $$('#heroChips .chip').forEach((c) => c.classList.toggle('active', c === chip));
    const k = chip.dataset.k;
    let n = 0;
    let first = -1;
    JOBS.forEach((job, i) => {
      const on = k === 'all' || job.k === k;
      pins[i].classList.toggle('is-dim', !on);
      if (on) { n++; if (first < 0) first = i; }
    });
    $('#heroCount').textContent = countLabel(n);
    if (pins[active].classList.contains('is-dim')) setActive(first);
  }));

  let heroP = 0;
  pins.forEach((pin, i) => {
    pin.addEventListener('mouseenter', () => { if (heroP < 0.3) setActive(i); });
    pin.addEventListener('focus', () => setActive(i));
    pin.addEventListener('click', () => {
      setActive(i);
      const end = heroEl.offsetTop + (heroEl.offsetHeight - innerHeight) * 0.96;
      smoothTo(end);
    });
  });

  // camera
  const cam = { fx: JOBS[0].x, fy: JOBS[0].y };
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  stage.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX / innerWidth - 0.5;
    mouse.y = e.clientY / innerHeight - 0.5;
  });
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function heroFrame(now) {
    const vw = innerWidth;
    const vh = innerHeight;
    const mobile = vw <= 680;
    const rect = heroEl.getBoundingClientRect();
    const p = clamp(-rect.top / (heroEl.offsetHeight - vh));
    heroP = p;
    const z = ease(clamp(p / 0.62));

    // smooth the focal point and mouse so switching pins glides instead of jumping
    const job = JOBS[active];
    cam.fx += (job.x - cam.fx) * 0.07;
    cam.fy += (job.y - cam.fy) * 0.07;
    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;

    const idle = reduced ? 0 : Math.sin(now * 0.00018) * 1.6;
    const free = 1 - z;
    const ax = lerp(mobile ? vw * 0.5 : vw * 0.68, vw * 0.5, z);
    const ay = lerp(mobile ? vh * 0.88 : vh * 0.6, vh * 0.52, z);
    const tilt = lerp(54, 22, z);
    const s = lerp(mobile ? 0.45 : 0.72, 2.6, z);
    const rz = (idle + mouse.sx * 4) * free;
    const fx = cam.fx + mouse.sx * 90 * free;
    const fy = cam.fy + mouse.sy * 60 * free;

    plane.style.transform = `translate3d(${ax}px, ${ay}px, 0) rotateX(${tilt}deg) rotateZ(${rz}deg) scale(${s}) translate(${-fx}px, ${-fy}px)`;
    plane.style.setProperty('--tilt', `${tilt}deg`);
    plane.style.setProperty('--untilt', `${-tilt}deg`);
    plane.style.setProperty('--ps', (mobile ? 0.85 : 1) / Math.pow(s, 0.8));
    plane.style.setProperty('--pins', 1 - clamp((p - 0.32) / 0.14));
    plane.style.setProperty('--lx', `${(cam.fx / PW) * 100}%`);
    plane.style.setProperty('--ly', `${(cam.fy / PH) * 100}%`);
    plane.style.setProperty('--lr', `${150 + z * 80}px`);

    heroFade.style.opacity = 1 - clamp(p / 0.18);
    heroFade.style.transform = `translateY(${-clamp(p / 0.25) * 90}px)`;
    heroFade.style.visibility = p > 0.25 ? 'hidden' : '';

    // the dive opens from the active roof
    const d = easeInOut(clamp((p - 0.42) / 0.34));
    const base = $('.pin-base', pins[active]).getBoundingClientRect();
    const cx = base.left + base.width / 2;
    const cy = base.top + base.height / 2;
    const R = d * Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy)) * 1.02;
    dive.style.clipPath = d <= 0 ? 'circle(0px at 50% 50%)' : `circle(${R}px at ${cx}px ${cy}px)`;
    dive.style.setProperty('--o', d);
    const oc = clamp((p - 0.74) / 0.18);
    dive.style.setProperty('--oc', oc);
    dive.classList.toggle('is-open', oc > 0.85);
    cursor.classList.toggle('is-off', p > 0.4);
    heroEl.classList.toggle('is-live', finePointer && p < 0.4);
  }

  let heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(heroEl);
  function loop(now) {
    if (heroVisible) heroFrame(now);
    requestAnimationFrame(loop);
  }
  $('#planeBase').addEventListener('load', () => {
    heroEl.classList.add('is-go');
  }, { once: true });
  setTimeout(() => heroEl.classList.add('is-go'), 1200);

  // key cursor: a ring that follows the mouse and says "Open job" over a pin
  const cursor = $('#cursor');
  if (finePointer) {
    stage.addEventListener('pointermove', (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const t = e.target;
      cursor.classList.toggle('is-pin', !!t.closest('.pin') && heroP < 0.3);
      cursor.classList.toggle('is-ui', !t.closest('.pin') && !!t.closest('a, button'));
    });
    stage.addEventListener('pointerenter', () => cursor.classList.add('is-in'));
    stage.addEventListener('pointerleave', () => cursor.classList.remove('is-in'));
  }
  requestAnimationFrame(loop);

  /* ───────── content shortcuts ───────── */
  const SERVICES = C.services.items;
  const AREAS = C.areas.items;
  const STEPS = C.process.steps;
  const B = C.business;
  const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2);
  const isDesktop = () => innerWidth > 1100;

  /* ───────── nav drawer + footer lists ───────── */
  $('#drawerCards').innerHTML = C.drawer.cards.map((d) => `<a href="#services" class="dcard"><span class="dcard-ph"><img src="${img(d.img)}" alt="" loading="lazy" />${d.badge ? `<em class="badge">${esc(d.badge)}</em>` : ''}</span><b class="serif">${esc(d.title)}</b><small class="mono">${esc(d.meta)}</small></a>`).join('');
  $('#drawerAreas').innerHTML = AREAS.slice(0, 6).map((a) => `<li><a href="#areas">${esc(a.n)} <span>→</span></a></li>`).join('');
  $$('#drawer a').forEach((a) => a.addEventListener('click', () => setDrawer(false)));
  $('#ftServices').innerHTML = SERVICES.slice(0, 5).map((s) => `<li><a href="#services">${esc(s.title)}</a></li>`).join('');
  $('#ftCompany').innerHTML = [
    ['#services', C.nav.services],
    C.stories.show && ['#work', C.nav.work],
    C.crew.show && ['#crew', C.nav.crew],
    ['#areas', C.nav.areas],
    ['#faq', C.nav.faq],
  ].filter(Boolean).map(([h, l]) => `<li><a href="${h}">${esc(l)}</a></li>`).join('');
  if ($('#ftSocial')) $('#ftSocial').innerHTML = (B.social || []).map((s) => `<li><a href="${esc(s.url)}"${/^https?:/.test(s.url) ? ' target="_blank" rel="noopener"' : ''}>${esc(s.label)}</a></li>`).join('');
  $('#ftLegal').textContent = B.legal || '';

  /* ───────── headings: split into words that rise out of a mask ───────── */
  function splitHeading(h) {
    let i = 0;
    const walk = (node, acc, dark) => {
      for (const n of [...node.childNodes]) {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.append(' '); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const wi = document.createElement('span');
            wi.className = 'wi' + (acc ? ' acc' : '') + (dark ? ' dark' : '');
            wi.style.setProperty('--wd', `${0.1 + i++ * 0.07}s`);
            wi.textContent = t;
            w.append(wi);
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeName === 'MARK') {
          walk(n, true, n.classList.contains('dark'));
        } else if (n.nodeName !== 'BR') {
          walk(n, acc, dark);
        }
      }
    };
    walk(h, false, false);
    h.classList.add('is-split');
  }
  $$('.hd').forEach(splitHeading);

  /* ───────── 01 stats board + ticker ───────── */
  $('#board').insertAdjacentHTML('beforeend', C.stats.signs.slice(0, 4).map((s, i) => {
    const big = s.count != null ? `<span data-count="${s.count}"${s.suffix ? ` data-suffix="${esc(s.suffix)}"` : ''}>0</span>` : esc(s.value);
    return `<div class="slot${i ? '' : ' is-red'}" style="--sd:${0.15 + i * 0.16}s"><span class="rail"></span><div class="sign"><span class="chain"></span><span class="chain"></span><div class="plate"><span class="holes"></span><b class="serif">${big}${s.small ? `<small>${esc(s.small)}</small>` : ''}</b><span class="mono">${esc(s.label)}</span></div></div></div>`;
  }).join(''));
  $('#board').classList.add(`n${Math.min(4, C.stats.signs.length)}`);
  const track = $('#track');
  const run = C.stats.ticker.map(([a, t]) => `<span class="it">${C.stats.tickerBadge ? `<span class="badge">${esc(C.stats.tickerBadge)}</span>` : ''}<b>${esc(a)}</b>${t ? esc(t) : ''}</span>`).join('');
  track.innerHTML = `<span class="run">${run}</span><span class="run" aria-hidden="true">${run}</span>`;
  $('#tickPause').addEventListener('click', (e) => {
    const paused = track.classList.toggle('is-paused');
    e.currentTarget.textContent = paused ? 'Play' : 'Pause';
    e.currentTarget.setAttribute('aria-pressed', paused);
  });

  /* ───────── 02 services ───────── */
  const svcGrid = $('#svcGrid');
  const usedTabs = C.services.tabs.filter(([f]) => f === 'all' || SERVICES.some((s) => s.f === f));
  $('#svcTabs').innerHTML = usedTabs.map(([f, l], i) => `<button class="tab${i ? '' : ' is-on'}" data-f="${esc(f)}">${esc(l)}</button>`).join('');
  svcGrid.innerHTML = SERVICES.map((s, i) => {
    const bg = `background-image:url(${img(s.img)})`;
    return `<article class="svc${s.big ? ' is-big' : ''}" data-f="${esc(s.f)}">
      <a href="#book" class="svc-main" data-svc="${i}">
        <span class="svc-ph">
          <span class="svc-zoom" style="${bg}"></span>
          <span class="svc-door l" style="${bg}"></span><span class="svc-door r" style="${bg}"></span>
          ${s.tag ? `<em class="badge svc-tag">${esc(s.tag)}</em>` : ''}
          ${s.pin ? `<span class="svc-pin"><span><i></i>${esc(s.pin[0])}</span><span>${esc(s.pin[1] || '')}</span></span>` : ''}
        </span>
        <span class="svc-tx">
          <span class="svc-title">${esc(s.title)}</span>
          ${s.sub ? `<span class="svc-sub">${esc(s.sub)}</span>` : ''}
          ${s.line ? `<span class="svc-line">${esc(s.line)}</span>` : ''}
          ${s.specs ? `<span class="svc-specs">${esc(s.specs)}</span>` : ''}
        </span>
      </a>
      <a href="#book" class="svc-view" data-svc="${i}">${esc(C.services.linkLabel)} ${arrow}</a>
    </article>`;
  }).join('');
  $('#svcCount').textContent = SERVICES.length;
  $$('#svcTabs .tab').forEach((tab) => tab.addEventListener('click', () => {
    $$('#svcTabs .tab').forEach((t) => t.classList.toggle('is-on', t === tab));
    let n = 0;
    $$('.svc', svcGrid).forEach((c) => {
      const on = tab.dataset.f === 'all' || c.dataset.f === tab.dataset.f;
      c.classList.toggle('hide', !on);
      if (on) { n++; c.classList.add('in'); }
    });
    $('#svcCount').textContent = n;
  }));

  /* ───────── 03 areas ───────── */
  const [mcx, mcy] = C.areas.center || [48, 46];
  // centre is in % of the map; the SVG viewBox is 100 x 76
  ['#mapRadius', '#mapRadiusEdge'].forEach((s) => { $(s).setAttribute('cx', mcx); $(s).setAttribute('cy', mcy * 0.76); });
  $('#areaList').innerHTML = AREAS.map((a, i) => `<li><a href="#areas" class="area-row" data-i="${i}"><span class="ai">${String(i + 1).padStart(2, '0')}</span><span class="an">${esc(a.n)}</span><span class="ac">${esc(a.c || '')}</span><span class="aa">↗</span></a></li>`).join('');
  $('#areaList').classList.toggle('is-long', AREAS.length > 6);
  $('#mapPins').innerHTML = AREAS.map((a, i) => `<a href="#areas" class="mpin" data-i="${i}" style="left:${a.x}%;top:${a.y}%" aria-label="${esc(a.n)}"><span class="mpin-s"></span><span class="mpin-up"><span class="mpin-l">${esc(a.n)}</span></span></a>`).join('');
  const mapCard = $('#mapCard');
  let areaOn = -1;
  function setArea(i) {
    if (i === areaOn) return;
    areaOn = i;
    const a = AREAS[i];
    $$('.area-row').forEach((r) => r.classList.toggle('is-on', +r.dataset.i === i));
    $$('.mpin').forEach((p) => p.classList.toggle('is-on', +p.dataset.i === i));
    mapCard.classList.add('swap');
    setTimeout(() => {
      mapCard.innerHTML = `<div class="mc-ph"><img src="${img(a.img)}" alt="" />${a.badge ? `<span class="badge">${esc(a.badge)}</span>` : ''}</div>
        <div class="mc-tx"><h3>${esc(a.n)}</h3>${a.stats ? `<div class="mc-stats">${a.stats.map(([v, s]) => `<span><b>${esc(v)}</b><span>${esc(s)}</span></span>`).join('')}</div>` : ''}
        ${a.note ? `<p class="mc-note">${esc(a.note)}</p>` : ''}<a href="#book" class="mono link-red">${esc(fill(C.areas.cardLink, { town: a.n }))}</a></div>`;
      mapCard.classList.remove('swap');
    }, mapCard.innerHTML ? 180 : 0);
  }
  $$('.area-row, .mpin').forEach((el) => {
    el.addEventListener('mouseenter', () => setArea(+el.dataset.i));
    el.addEventListener('focus', () => setArea(+el.dataset.i));
    el.addEventListener('click', (e) => { e.preventDefault(); setArea(+el.dataset.i); });
  });
  setArea(0);

  /* ───────── 04 estimate ───────── */
  const E = C.estimate;
  const PRICING = E.pricing;
  const est = { material: 'architectural', pitch: 'mid', sq: 20 };
  const SCALE = [5000, 55000];
  $('#estTown').innerHTML = AREAS.map((a) => `<option>${esc(a.n)}</option>`).join('');
  $('#estPriced').hidden = !PRICING;
  $('#estUnpriced').hidden = !!PRICING;
  $('#ticks').innerHTML = Array.from({ length: 51 }, (_, i) => `<span class="${i % 10 === 0 ? 'maj' : ''}"></span>`).join('');
  const money = (n) => '$' + (Math.round(n / 100) * 100).toLocaleString();
  const pos = (v) => clamp((v - SCALE[0]) / (SCALE[1] - SCALE[0])) * 100;
  const segLabel = (name) => $(`.seg[data-name="${name}"] .is-on`).textContent;
  function estimate() {
    $('#sqOut').textContent = est.sq;
    $('#estBasis').textContent = fill(E.basis, { town: $('#estTown').value });
    if (!PRICING) {
      $('#estSummary').textContent = `${est.sq} squares · ${segLabel('material')} · ${segLabel('pitch').toLowerCase()} pitch`;
      return;
    }
    const [lo, hi] = PRICING.material[est.material];
    const f = PRICING.pitch[est.pitch];
    const a = est.sq * lo * f;
    const b = est.sq * hi * f;
    $('#estLo').textContent = money(a);
    $('#estHi').textContent = money(b);
    $('#band').style.left = pos(a) + '%';
    $('#band').style.width = pos(b) - pos(a) + '%';
    $('#needle').style.left = pos((a + b) / 2) + '%';
  }
  $('#sqMinus').addEventListener('click', () => { est.sq = Math.max(8, est.sq - 2); estimate(); });
  $('#sqPlus').addEventListener('click', () => { est.sq = Math.min(60, est.sq + 2); estimate(); });
  $('#estTown').addEventListener('change', estimate);
  function placeSeg(seg) {
    const on = $('.is-on', seg);
    const b = $('.seg-b', seg);
    b.style.left = on.offsetLeft + 'px';
    b.style.width = on.offsetWidth + 'px';
  }
  $$('.seg').forEach((seg) => {
    $$('button', seg).forEach((btn) => btn.addEventListener('click', () => {
      $$('button', seg).forEach((x) => x.classList.toggle('is-on', x === btn));
      if (seg.dataset.name) est[seg.dataset.name] = btn.dataset.v;
      placeSeg(seg);
      estimate();
    }));
    placeSeg(seg);
  });
  estimate();

  /* ───────── process: scroll drives the steps ───────── */
  const prSection = $('#process');
  const prList = $('#prList');
  prList.innerHTML = STEPS.map((s, i) => `<li><button class="pr-row" data-i="${i}"><span class="pd">${esc(C.process.counterLabel)} ${i + 1}</span><span class="pt">${esc(s.t)}</span><span class="px"><span>${esc(s.x)}</span></span><span class="pbar"></span></button></li>`).join('');
  STEPS.forEach((s) => { new Image().src = img(s.img); });
  const prRows = $$('.pr-row', prList);
  let prOn = -1;
  function setStep(i) {
    if (i === prOn) return;
    prOn = i;
    const s = STEPS[i];
    prRows.forEach((r, ri) => {
      r.classList.toggle('is-on', ri === i);
      r.classList.toggle('is-done', ri < i);
    });
    const flash = $('#prFlash');
    flash.classList.remove('go');
    void flash.offsetWidth;
    flash.classList.add('go');
    $('#prImg').src = img(s.img);
    $('#prVf').textContent = s.vf;
    $('#prPin').innerHTML = s.pin ? `<i></i>${esc(s.pin[0])}<em>${esc(s.pin[1])}</em>` : '';
    $('#prPin').hidden = !s.pin;
    $('#prLive').innerHTML = `<i class="live"></i>${esc(s.live)}`;
    $('#prChips').innerHTML = STEPS.slice(0, i + 1).map((x, xi) => `<span class="pr-chip" style="${xi < i ? 'animation:none' : ''}">${esc(x.chip)}</span>`).join('');
    $('#prDay').textContent = i + 1;
    const flap = $('#prFlap');
    flap.classList.remove('is-anim');
    void flap.offsetWidth;
    flap.classList.add('is-anim');
    setTimeout(() => { flap.textContent = s.flap; }, 300);
  }
  function sectionProgress(el) {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / (el.offsetHeight - innerHeight));
  }
  function processFrame() {
    if (!isDesktop()) return;
    const p = sectionProgress(prSection);
    const f = p * STEPS.length;
    const i = Math.min(STEPS.length - 1, Math.floor(f));
    setStep(i);
    prRows.forEach((r, ri) => { $('.pbar', r).style.width = ri === i ? `${clamp(f - i) * 100}%` : '0'; });
  }
  const jumpTo = (section, i, n) => smoothTo(section.offsetTop + ((i + 0.5) / n) * (section.offsetHeight - innerHeight));
  prRows.forEach((r, i) => r.addEventListener('click', () => (isDesktop() ? jumpTo(prSection, i, STEPS.length) : setStep(i))));
  setStep(0);

  /* ───────── crew: flip cards (only real people) ───────── */
  if (C.crew.show) {
    $('#crewGrid').innerHTML = C.crew.items.map((c) => {
      const first = c.n.split(' ')[0];
      return `<li class="crew-card"><div class="flip" tabindex="0" aria-label="${esc(c.n)}, ${esc(c.role)}">
        <div class="face front">
          <div class="cr-ph"><img src="${img(c.img)}" alt="" loading="lazy" /><span class="cr-ini">${esc(initials(c.n))}</span><span class="cr-hint">About ${esc(first)}</span></div>
          <h3>${esc(c.n)}</h3><p class="cr-role">${esc(c.role)}</p>${c.stats ? `<p class="cr-stats">${esc(c.stats)}</p>` : ''}
          <p class="cr-areas">${(c.areas || []).map((a) => `<span>${esc(a)}</span>`).join('')}</p>
        </div>
        <div class="face back">
          <div class="bt"><span class="avatar serif">${esc(initials(c.n))}</span><span><b>${esc(c.n)}</b><small>${esc(c.role)}</small></span></div>
          <blockquote>${esc(c.q || '')}</blockquote>
          <div class="cr-links">${c.tel ? `<a href="tel:${c.tel.replace(/\D/g, '')}"><small>Direct</small>${esc(c.tel)}</a>` : ''}${c.mail ? `<a href="mailto:${esc(c.mail)}"><small>Email</small>${esc(c.mail)}</a>` : ''}</div>
          ${c.tel ? `<a href="tel:${c.tel.replace(/\D/g, '')}" class="pill pill-red"><span class="dot-ico">${arrow}</span>Call ${esc(first)}</a>` : ''}
        </div>
      </div></li>`;
    }).join('');
    $$('.crew-card').forEach((card) => card.addEventListener('click', (e) => {
      if (!e.target.closest('a')) card.classList.toggle('is-flip');
    }));
  }

  /* ───────── stories: real reviews only ───────── */
  let storiesFrame = () => {};
  if (C.stories.show) {
    const STORIES = C.stories.items;
    const stSection = $('#work');
    $('#stPhotos').innerHTML = STORIES.map((s, i) => `<img class="st-img" src="${img(s.img)}" alt="" loading="lazy" data-i="${i}" />`).join('');
    $('#stDots').innerHTML = STORIES.map((_, i) => `<button class="st-dot" data-i="${i}" aria-label="Review ${i + 1}"><i></i></button>`).join('');
    $('#stTotal').textContent = String(STORIES.length).padStart(2, '0');
    let stOn = -1;
    const setStory = (i) => {
      if (i === stOn) return;
      stOn = i;
      const s = STORIES[i];
      $$('.st-img').forEach((m) => m.classList.toggle('is-a', +m.dataset.i === i));
      $$('.st-dot').forEach((d) => d.classList.toggle('is-a', +d.dataset.i === i));
      $('#stNum').textContent = String(i + 1).padStart(2, '0');
      $('#stDays').textContent = s.days || '';
      $('#stAddr').textContent = s.addr || '';
      $('#stTown').textContent = s.town || '';
      $('#stStars').textContent = s.stars ? '★'.repeat(s.stars) + '☆'.repeat(5 - s.stars) : '';
      $('#stQuote').textContent = `“${s.q}”`;
      $('#stAv').textContent = initials(s.name);
      $('#stName').textContent = s.name;
      $('#stWhere').textContent = s.where || '';
      $('#stDuo').hidden = !s.quoted;
      $('#stQuoted').textContent = s.quoted || '';
      $('#stFinal').textContent = s.final || '';
      $('#stDelta').textContent = s.delta || '';
      const tx = $('.st-tx');
      tx.classList.remove('st-swap');
      void tx.offsetWidth;
      tx.classList.add('st-swap');
    };
    storiesFrame = () => {
      if (!isDesktop()) return;
      setStory(Math.min(STORIES.length - 1, Math.floor(sectionProgress(stSection) * STORIES.length)));
    };
    const goStory = (i) => {
      const n = STORIES.length;
      i = (i + n) % n;
      if (isDesktop()) jumpTo(stSection, i, n); else setStory(i);
    };
    $$('.st-dot').forEach((d) => d.addEventListener('click', () => goStory(+d.dataset.i)));
    $('#stPrev').addEventListener('click', () => goStory(stOn - 1));
    $('#stNext').addEventListener('click', () => goStory(stOn + 1));
    let touchX = null;
    $('.st-frame').addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    $('.st-frame').addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) goStory(stOn + (dx < 0 ? 1 : -1));
      touchX = null;
    });
    setStory(0);
  }

  /* ───────── season chart (only with real data) ───────── */
  let drawChart = () => {};
  let mkSeen = false;
  const mkBox = $('#mkBox');
  if (C.season.show) {
    const S = C.season;
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - 11 + i);
      return d.toLocaleString('en-US', { month: 'short' });
    });
    $('#mkMonths').innerHTML = months.map((m) => `<span>${m}</span>`).join('');
    const towns = Object.keys(S.towns);
    $('#mkTabs').innerHTML = towns.map((t, i) => `<button class="tab${i ? '' : ' is-on'}" data-t="${esc(t)}">${esc(t)}</button>`).join('');
    if ($('#posts')) $('#posts').innerHTML = (S.posts || []).map((p) => `<li><a href="${esc(p.url)}" class="post"><span class="thumb"><img src="${img(p.img)}" alt="" loading="lazy" /></span><span class="pt"><span class="kick mono">${esc(p.kick)}</span><span class="serif ptitle">${esc(p.title)}</span><span class="mono muted">${esc(p.meta)}</span></span></a></li>`).join('');
    let mkTown = towns[0];
    let mkPts = [];
    let mkI = 11;
    drawChart = () => {
      const data = S.towns[mkTown].calls;
      const W = mkBox.clientWidth;
      const H = mkBox.clientHeight;
      const L = 34;
      const max = Math.ceil(Math.max(...data) / 10) * 10;
      const X = (i) => L + (i / (data.length - 1)) * (W - L - 8);
      const Y = (v) => 10 + (1 - v / max) * (H - 24);
      mkPts = data.map((v, i) => [X(i), Y(v), v]);
      let d = `M${mkPts[0][0]},${mkPts[0][1]}`;
      for (let i = 1; i < mkPts.length; i++) {
        const [x0, y0] = mkPts[i - 1];
        const [x1, y1] = mkPts[i];
        const cx = (x0 + x1) / 2;
        d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
      }
      const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => {
        const v = Math.round(max * f);
        return `<line x1="${L}" x2="${W}" y1="${Y(v)}" y2="${Y(v)}"/><text x="0" y="${Y(v) + 3}">${v}</text>`;
      }).join('');
      mkBox.innerHTML = `<svg viewBox="0 0 ${W} ${H}">
        <defs><linearGradient id="mkg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.brand.accent}" stop-opacity=".25"/><stop offset="1" stop-color="${C.brand.accent}" stop-opacity="0"/></linearGradient></defs>
        <g class="mk-grid">${grid}</g>
        <path class="mk-area" d="${d} L${mkPts[mkPts.length - 1][0]},${H - 14} L${L},${H - 14} Z" fill="url(#mkg)"/>
        <path class="mk-line" d="${d}"/>
        <line class="mk-cross" y1="0" y2="${H - 14}"/>
        <circle class="mk-dot" r="6"/>
      </svg><div class="mk-tip"></div>`;
      const line = $('.mk-line', mkBox);
      line.style.setProperty('--len', line.getTotalLength());
      mkBox.classList.remove('is-on');
      requestAnimationFrame(() => requestAnimationFrame(() => { if (mkSeen) mkBox.classList.add('is-on'); }));
    };
    const mkHover = (i) => {
      mkI = clamp(i, 0, 11);
      const [x, y, v] = mkPts[mkI];
      const cross = $('.mk-cross', mkBox);
      cross.setAttribute('x1', x);
      cross.setAttribute('x2', x);
      const dot = $('.mk-dot', mkBox);
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', y);
      const tip = $('.mk-tip', mkBox);
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
      tip.innerHTML = `<b>${v}</b>${esc(S.tooltipUnit)} · ${months[mkI]}`;
      mkBox.classList.add('is-hover');
    };
    mkBox.addEventListener('pointermove', (e) => {
      const r = mkBox.getBoundingClientRect();
      const x = e.clientX - r.left;
      let best = 0;
      mkPts.forEach((p, i) => { if (Math.abs(p[0] - x) < Math.abs(mkPts[best][0] - x)) best = i; });
      mkHover(best);
    });
    mkBox.addEventListener('pointerleave', () => mkBox.classList.remove('is-hover'));
    mkBox.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); mkHover(mkI + (e.key === 'ArrowLeft' ? -1 : 1)); }
    });
    mkBox.addEventListener('blur', () => mkBox.classList.remove('is-hover'));
    const setTown = (t) => {
      mkTown = t;
      const s = S.towns[t];
      $('#mkTitle').innerHTML = `<span class="w"><span class="wi">${esc(t)}</span></span>`;
      $('#mkBig').textContent = s.avg;
      $('#mkLabel').textContent = fill(S.statLabel, { town: t });
      $('#mkChg').textContent = s.chg;
      $$('#mkTabs .tab').forEach((b) => b.classList.toggle('is-on', b.dataset.t === t));
      drawChart();
    };
    $$('#mkTabs .tab').forEach((b) => b.addEventListener('click', () => setTown(b.dataset.t)));
    setTown(mkTown);
  }

  /* ───────── faq ───────── */
  const F = C.faq;
  const contact = [
    esc(F.contactLead),
    B.phone && `<a href="tel:${esc(B.phoneE164)}" class="ul">${esc(B.phone)}</a>`,
    B.phone && B.email && esc(F.contactJoin),
    B.email && `<a href="mailto:${esc(B.email)}" class="ul">${esc(B.email)}</a>`,
  ].filter(Boolean).join(' ');
  $('#faqContact').innerHTML = `${contact}.${F.contactTail ? ' ' + esc(F.contactTail) : ''}`;
  const fqTabs = F.tabs.filter(([k]) => k === 'all' || F.items.some((f) => f.g === k));
  $('#fqTabs').innerHTML = fqTabs.map(([k, l], i) => `<button class="tab${i ? '' : ' is-on'}" data-k="${esc(k)}">${esc(l)}<small>${k === 'all' ? F.items.length : F.items.filter((f) => f.g === k).length}</small></button>`).join('');
  $('#fqList').innerHTML = F.items.map((f, i) => `<li class="fq-row${i ? '' : ' is-o'}" data-g="${esc(f.g)}">
    <button class="fq-q" aria-expanded="${!i}"><span class="fq-n">${String(i + 1).padStart(2, '0')}</span><span class="fq-qt">${esc(f.q)}</span><span class="fq-key">+</span></button>
    <div class="fq-a"><div><p>${esc(f.a)}</p></div></div><span class="fq-rule"></span></li>`).join('');
  $$('.fq-q').forEach((q) => q.addEventListener('click', () => {
    const row = q.parentElement;
    const open = !row.classList.contains('is-o');
    $$('.fq-row').forEach((r) => { r.classList.remove('is-o'); $('.fq-q', r).setAttribute('aria-expanded', false); });
    row.classList.toggle('is-o', open);
    q.setAttribute('aria-expanded', open);
  }));
  $$('#fqTabs .tab').forEach((t) => t.addEventListener('click', () => {
    $$('#fqTabs .tab').forEach((x) => x.classList.toggle('is-on', x === t));
    $$('.fq-row').forEach((r) => r.classList.toggle('hide', t.dataset.k !== 'all' && r.dataset.g !== t.dataset.k));
  }));

  /* ───────── book ───────── */
  const bk = { job: 0, day: null, time: null };
  $('#bkJob').innerHTML = SERVICES.map((s, i) => `<option value="${i}">${esc(s.title)}${s.sub ? ` (${esc(s.sub)})` : ''}</option>`).join('');
  function setJob(i) {
    bk.job = i;
    const s = SERVICES[i];
    $('#bkJob').value = i;
    $('#bkMini').innerHTML = `<span class="bk-thumb"><img src="${img(s.img)}" alt="" /></span><span class="bk-mtx"><b>${esc(s.title)}</b>${s.sub ? `<span>${esc(s.sub)}</span>` : ''}${s.specs ? `<small>${esc(s.specs)}</small>` : ''}</span><span class="bk-key">${arrow}</span>`;
    $('#bkImg').src = img(s.img);
  }
  $('#bkJob').addEventListener('change', (e) => setJob(+e.target.value));
  $$('[data-svc]').forEach((a) => a.addEventListener('click', () => setJob(+a.dataset.svc)));
  const days = [];
  for (let d = new Date(), n = 0; days.length < 8 && n < 14; n++) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) days.push(new Date(d));
  }
  $('#bkDays').innerHTML = days.map((d, i) => `<button type="button" class="bk-day" data-i="${i}"><small>${d.toLocaleString('en-US', { weekday: 'short' })}</small><b>${d.getDate()}</b><small>${d.toLocaleString('en-US', { month: 'short' })}</small></button>`).join('');
  $('#bkTimes').innerHTML = C.book.times.map((t) => `<button type="button" class="bk-time" data-t="${esc(t)}">${esc(t)}</button>`).join('');
  function bkSummary() {
    const d = bk.day !== null ? days[bk.day].toLocaleString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : null;
    $('#bkSum').innerHTML = d && bk.time ? `<b>${d}</b> at <b>${esc(bk.time)}</b>` : d ? `<b>${d}</b> · now pick a time` : 'Pick a day and a time';
  }
  $$('.bk-day').forEach((b) => b.addEventListener('click', () => {
    bk.day = +b.dataset.i;
    $$('.bk-day').forEach((x) => x.classList.toggle('is-on', x === b));
    bkSummary();
  }));
  $$('.bk-time').forEach((b) => b.addEventListener('click', () => {
    bk.time = b.dataset.t;
    $$('.bk-time').forEach((x) => x.classList.toggle('is-on', x === b));
    bkSummary();
  }));
  $('#bkForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (bk.day === null || !bk.time) { $('#bkSum').innerHTML = '<b>Pick a day and a time first</b>'; return; }
    if (!f.reportValidity()) return;
    // Front-end only. Hook this up to a form backend to actually send it.
    $('#bkSum').innerHTML = fill(C.book.thanks, { name: esc(f.name.value.split(' ')[0]) });
  });
  setJob(0);

  /* ───────── footer ───────── */
  const word = [...(B.wordmark || B.shortName)];
  $('#ftWord').style.setProperty('--wm-len', word.length + 1);
  $('#ftWord').setAttribute('aria-label', B.name);
  $('#ftWord').innerHTML = word.map((c, i) => `<span class="lm" aria-hidden="true"><span class="l" style="--ld:${i * 0.06}s">${c === ' ' ? '&nbsp;' : esc(c)}</span></span>`).join('') + `<span class="lm" aria-hidden="true"><span class="l dot" style="--ld:${word.length * 0.06}s">.</span></span>`;
  if ($('#ftForm')) $('#ftForm').addEventListener('submit', (e) => {
    e.preventDefault();
    e.target.innerHTML = '<p class="mono" style="margin:0;padding:14px 16px">You\'re on the list. Thanks.</p>';
  });

  /* ───────── reveal, counters, scroll ───────── */
  $$('.svc, .crew-card, .post, .map, .est-card, .bk-card, .mk-chart, .fq-row, .ft-top > *, .ft-mid > *, .section .body, .est-steps, .sec-head > .pill, .crew-side .pill, .stats-copy .pill, .tick, .area-list, .bk-under').forEach((el) => el.classList.add('reveal'));
  function countUp(el) {
    const to = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    if (reduced) { el.textContent = to.toLocaleString() + suffix; return; }
    const t0 = performance.now();
    const tick = (t) => {
      const k = ease(clamp((t - t0) / 1600));
      el.textContent = Math.round(to * k).toLocaleString() + suffix;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (el.classList.contains('reveal')) el.classList.add('in');
      else el.classList.add('is-on');
      $$('[data-count]', el).forEach(countUp);
      if (el === mkBox) { mkSeen = true; el.classList.add('is-on'); }
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
  let stagger = 0;
  $$('.reveal').forEach((el) => {
    el.style.transitionDelay = `${(stagger++ % 3) * 80}ms`;
    io.observe(el);
  });
  $$('.hd, .eb, .board, .ft-word').forEach((el) => io.observe(el));
  if (mkBox) io.observe(mkBox);

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', scrollY > 40);
      processFrame();
      storiesFrame();
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });

  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on('scroll', onScroll);
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  // in-page links glide instead of jumping
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    const id = a.getAttribute('href');
    const el = id === '#top' ? 0 : id.length > 1 && document.querySelector(id);
    if (el === null || el === false) return;
    e.preventDefault();
    smoothTo(el);
  });
  let rz;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { drawChart(); $$('.seg').forEach(placeSeg); onScroll(); }, 150);
  });
  onScroll();

  document.documentElement.classList.remove('is-loading');
}

/* ───────── boot: load contractor.json, then build the page ───────── */
fetch('contractor.json', { cache: 'no-cache' })
  .then((r) => {
    if (!r.ok) throw new Error(`contractor.json: HTTP ${r.status}`);
    return r.json();
  })
  .then(boot)
  .catch((err) => {
    console.error(err);
    document.documentElement.classList.remove('is-loading');
    document.body.insertAdjacentHTML('afterbegin', '<p style="position:fixed;inset:auto 16px 16px;z-index:99;padding:14px 18px;border-radius:12px;background:#fff;color:#101820;font:500 14px/1.4 system-ui">Could not load contractor.json. Open this site through a web server (for example: npx vite . or VS Code Live Server).</p>');
  });
