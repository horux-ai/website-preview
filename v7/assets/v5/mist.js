/*
  v6, CLIENT ASK: a mist that follows the pointer, in the manner of the hills behind the hero. First in the hero
  only; then, on the client's word, down the whole page.

  The pointer leaves soft, level dabs of haze where it passes; they drift with a slow wind, rise a little, spread
  and thin out over about two seconds. They take the tone the ground under them calls for:
    hills   (the hero, the products): the slate of the far hills while they are up in the pale sky, a pale mist
            once they are down over the hills, blended across the horizon
    light   (services, how we work, the contact slab): the slate, as a darker haze on the page ground
    dark    (why Horux with where we work, the foot): a pale mist on the ink

  Where it is drawn: every zone has a canvas of its own lying on that zone's ground and under everything the zone
  holds, so the mist passes behind the words, the cards and the windows and never over them. In the hero and the
  products it sits in the landscape's own frame (it fades with the hills); elsewhere it is the zone's first layer
  (z-index -1 inside the zone, which the page's .mist-zone rule makes a stacking context). A canvas is half the
  page's resolution, scaled up by the browser, which is what makes it soft (no blur filter).

  Fields: the dabs live in a field, and a field can lie across more than one zone. Why Horux and where we work
  are two sections on one dark ground, and each canvas stops at its own section's edge, so with a field apiece
  the mist was cut along the line between them (the client saw it). They share one field now: every dab is kept
  once, in the first zone's coordinates, and drawn on both canvases, so what one canvas cuts off the other draws
  and the mist crosses the line whole. (They stay two sections in the markup: the kit keeps the live globe only
  in a top-level section.)

  The hero and the services are one field too (the client saw the same cut along the line between them). There
  the grounds differ: the hills fade out at the hero's foot into the page ground the services stand on. So the hero
  has two canvases. One lies in the landscape's frame as before and fades with the hills (slate in the sky, pale
  over the hills). The other is the hero's first layer, under the landscape, in the services' slate: the hills
  hide it wherever they are opaque and show it exactly as far as they have faded, so the slate haze of the
  services runs up over the line and thins out into the hills, and nothing is cut. Each zone paints in its own
  tone; a field no longer has one.

  How we work and the products are joined the same way, the other way up: the products' hills come in out of the
  page ground over the section's first 14%, so the slate haze of How we work was cut along the line above them.
  The products have the second, slate canvas under their landscape, and the two sections are one field.

  The lines left alone are real edges: a light ground meeting a dark one (services and why Horux, where we work
  and How we work, the contact slab and the foot) and the products' landscape ending whole at its rounded foot.
  The mist changes tone or ground there, so it stopping on the line is what a visitor expects.

  What it costs: a zone's canvas is made the first time the pointer moves over its field, a field's loop stops as
  soon as its last dab has gone, and six seconds later its canvases give their memory back. A still pointer costs
  nothing.

  Only with a mouse or trackpad, and never under reduced motion: a phone, a tablet and a visitor who asked for
  less movement get the page as it is.
*/
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (fine && !reduced) start();

function start() {
  const K = 0.5;                         // canvas pixels per page pixel
  const MAX = 150;                       // dabs alive at once in one field
  const GAP = 13;                        // one dab for every 13px the pointer travels
  const REACH = 190;                     // the furthest a dab's paint gets from its centre, in page pixels
  const SLATE = [127, 155, 163], PALE = [236, 240, 240], NIGHT = [176, 198, 204];
  // the zone (what the pointer is over), the element its canvas goes into, its tone, and the field it belongs to
  const ZONES = [
    ['.hero--centred', '.hero__sky', 'hills', 'top'],
    ['.hero--centred', null, 'light', 'top'],        // under the landscape: seen only where the hills have faded
    ['#services', null, 'light', 'top'],
    ['#why', null, 'dark', 'chapter'],
    ['#reach', null, 'dark', 'chapter'],
    ['#approach', null, 'light', 'lower'],
    ['#products', '.products__sky', 'hills', 'lower'],
    ['#products', null, 'light', 'lower'],          // under the landscape: seen only where the hills have not yet come in
    ['footer.footer', '.contact__sky', 'dark', 'close'],   // the contact section stands on the hills' deep tone: a pale mist, drawn in the landscape's own frame
    ['.sitefoot', null, 'dark', 'foot'],
  ];
  // v5 night (<html class="dk">, assets/v5/dark.css): every section stands on the one night ground, so the edges the
  // fields above keep (light against dark) are gone, and a mist stopping at any of them was a line the client saw.
  // The whole page is one field there and every zone paints the same pale night haze, so the mist crosses every
  // section line whole, the hills' frames included.
  if (document.documentElement.classList.contains('dk')) ZONES.forEach(z => { z[2] = 'dark'; z[3] = 'page'; });
  const HORIZON = 0.46;                  // where the hills begin in the two landscapes, as a share of their height

  const rnd = (a, b) => a + Math.random() * (b - a);
  // four blots per tone: a handful of soft discs set wider than they are tall, like the dabs in the hero's sky
  const blots = ([r, g, b]) => [0, 1, 2, 3].map(() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    for (let i = 0; i < 7; i++) {
      const cx = 64 + rnd(-24, 24), cy = 64 + rnd(-12, 12), rad = rnd(24, 38);
      const gr = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      gr.addColorStop(0, `rgb(${r} ${g} ${b} / .42)`); gr.addColorStop(0.55, `rgb(${r} ${g} ${b} / .16)`); gr.addColorStop(1, `rgb(${r} ${g} ${b} / 0)`);
      x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    }
    return c;
  });
  let ink = null;
  const inks = () => ink || (ink = { slate: blots(SLATE), pale: blots(PALE), night: blots(NIGHT) });

  const byZone = new WeakMap(), fields = new Map();
  for (const [zq, hq, tone, key] of ZONES) {
    const zone = document.querySelector(zq);
    const holder = zone && (hq ? zone.querySelector(hq) : zone);
    if (!holder) continue;
    zone.classList.add('mist-zone');
    if (!fields.has(key)) fields.set(key, { zones: [], dabs: null, alive: 0, next: 0, raf: 0, last: 0, rest: 0, awake: false });
    const f = fields.get(key), z = { f, holder, tone, under: !hq, cv: null, ctx: null, W: 0, H: 0, dy: 0, box: null };
    f.zones.push(z);
    if (!byZone.has(zone)) byZone.set(zone, z);       // a zone with two canvases (the hero) is found by its first
  }

  // a zone's canvas to its holder's size; dy is how far down the field this zone starts (0 for a field's first zone)
  const fit = f => {
    const top = f.zones[0].holder.getBoundingClientRect().top;
    for (const z of f.zones) {
      z.W = z.holder.clientWidth; z.H = z.holder.clientHeight;
      z.cv.width = Math.max(1, Math.round(z.W * K)); z.cv.height = Math.max(1, Math.round(z.H * K));
      z.dy = z.holder.getBoundingClientRect().top - top; z.box = null;
    }
  };
  const wake = f => {
    clearTimeout(f.rest);
    if (!f.dabs) {
      f.dabs = [];
      for (let i = 0; i < MAX; i++) f.dabs.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, r: 40, turn: 0, spin: 0, seed: 0, k: 0 });
      for (const z of f.zones) {
        z.cv = document.createElement('canvas');
        z.cv.className = z.under ? 'mist mist--under' : 'mist';
        z.cv.setAttribute('aria-hidden', 'true');
        z.under ? z.holder.prepend(z.cv) : z.holder.append(z.cv);
        z.ctx = z.cv.getContext('2d');
      }
    }
    if (!f.awake) { fit(f); f.awake = true; }
    return f.zones.every(z => z.ctx);
  };
  addEventListener('resize', () => fields.forEach(f => { if (f.awake) fit(f); }));
  addEventListener('scroll', () => fields.forEach(f => { for (const z of f.zones) z.box = null; }), { passive: true });

  const put = (f, x, y, vx, vy) => {
    const d = f.dabs[f.next]; f.next = (f.next + 1) % MAX;
    if (!d.on) f.alive++;
    d.on = true; d.x = x + rnd(-10, 10); d.y = y + rnd(-8, 8);
    d.vx = vx * 0.14; d.vy = vy * 0.14;
    d.age = 0; d.life = rnd(1.7, 2.6); d.r = rnd(34, 58);
    d.turn = rnd(-0.5, 0.5); d.spin = rnd(-0.25, 0.25); d.seed = rnd(0, 6.28); d.k = (Math.random() * 4) | 0;
  };

  let px = 0, py = 0, pt = 0, has = false, owed = 0, clock = 0;
  // off until asked for: a triple click anywhere turns the mist on, another triple click turns it off again
  let on = false;
  addEventListener('click', e => { if (e.detail === 3) { on = !on; has = false; owed = 0; } });
  addEventListener('pointermove', e => {
    if (!on) return;
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const x = e.clientX, y = e.clientY, now = e.timeStamp;
    const el = e.target && e.target.closest ? e.target.closest('.mist-zone') : null, z = el && byZone.get(el);
    if (!has || !z) { px = x; py = y; pt = now; has = !!z; owed = 0; return; }
    const dx = x - px, dy = y - py, dist = Math.hypot(dx, dy), dt = Math.max(8, now - pt) / 1000;
    if (dist > 240) { px = x; py = y; pt = now; return; }                  // the pointer came in from elsewhere: no streak across the page
    owed += dist;
    const f = z.f;
    if (owed >= GAP && wake(f)) {
      if (!z.box) z.box = z.holder.getBoundingClientRect();
      const vx = Math.max(-900, Math.min(900, dx / dt)), vy = Math.max(-900, Math.min(900, dy / dt));
      while (owed >= GAP) {
        owed -= GAP;
        const t = dist ? Math.min(1, Math.max(0, 1 - owed / dist)) : 1;
        put(f, px + dx * t - z.box.left, py + dy * t - z.box.top + z.dy, vx, vy);
      }
      if (!f.raf) { f.last = 0; f.raf = requestAnimationFrame(ts => frame(f, ts)); }
    }
    px = x; py = y; pt = now;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { has = false; owed = 0; });

  const frame = (f, ts) => {
    const dt = f.last ? Math.min(0.05, (ts - f.last) / 1000) : 0.016;
    f.last = ts; clock += dt;
    const { dabs, zones } = f, I = inks(), n = zones.length;
    for (let j = 0; j < n; j++) { const z = zones[j]; z.ctx.setTransform(1, 0, 0, 1, 0, 0); z.ctx.clearRect(0, 0, z.cv.width, z.cv.height); }
    const drag = Math.max(0, 1 - 2.2 * dt);
    for (let i = 0; i < MAX; i++) {
      const d = dabs[i];
      if (!d.on) continue;
      d.age += dt;
      if (d.age >= d.life) { d.on = false; f.alive--; continue; }
      const t = d.age / d.life;
      // the push the pointer gave it dies away; a slow wind to the right and a gentle rise take over, each with a waver of its own
      d.vx *= drag; d.vy *= drag;
      d.x += (d.vx + 16 + 20 * Math.sin(d.seed + clock * 0.7 + d.y * 0.011)) * dt;
      d.y += (d.vy - 11 - 7 * Math.cos(d.seed * 1.7 + clock * 0.55 + d.x * 0.009)) * dt;
      d.turn += d.spin * dt;
      const grow = 1 + 1.7 * (1 - (1 - t) * (1 - t));                    // spreads fast, then slowly
      const fade = Math.min(1, t / 0.14) * Math.pow(1 - t, 1.5);          // in at once, out over the rest
      const s = (d.r * grow / 64) * K, cos = Math.cos(d.turn), sin = Math.sin(d.turn);
      for (let j = 0; j < n; j++) {
        const z = zones[j], y = d.y - z.dy;                               // the dab in this zone's own coordinates
        if (y < -REACH || y > z.H + REACH) continue;                      // none of its paint reaches this canvas
        const ctx = z.ctx, tone = z.tone;
        ctx.setTransform(s * 1.5 * cos, s * 1.5 * sin, -s * sin, s * cos, d.x * K, y * K);
        if (tone === 'light') { ctx.globalAlpha = 0.42 * fade; ctx.drawImage(I.slate[d.k], -64, -64); }
        else if (tone === 'dark') { ctx.globalAlpha = 0.3 * fade; ctx.drawImage(I.night[d.k], -64, -64); }
        else {
          // slate up in the sky, pale over the hills, blended across the horizon
          const h = y / z.H, w = h <= HORIZON - 0.08 ? 0 : h >= HORIZON + 0.1 ? 1 : (h - HORIZON + 0.08) / 0.18;
          if (w < 0.98) { ctx.globalAlpha = 0.42 * fade * (1 - w); ctx.drawImage(I.slate[d.k], -64, -64); }
          if (w > 0.02) { ctx.globalAlpha = 0.34 * fade * w; ctx.drawImage(I.pale[d.k], -64, -64); }
        }
      }
    }
    if (f.alive > 0) { f.raf = requestAnimationFrame(t2 => frame(f, t2)); return; }
    f.raf = 0;
    for (let j = 0; j < n; j++) { const z = zones[j]; z.ctx.setTransform(1, 0, 0, 1, 0, 0); z.ctx.globalAlpha = 1; z.ctx.clearRect(0, 0, z.cv.width, z.cv.height); }
    // nothing left to draw here: after a while the canvases hand their memory back (they are fitted again when next needed)
    f.rest = setTimeout(() => { if (!f.raf) { for (const z of zones) z.cv.width = z.cv.height = 1; f.awake = false; } }, 6000);
  };
}
