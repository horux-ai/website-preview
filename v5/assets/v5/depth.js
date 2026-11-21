/*
  v5 depth layer: the page gains a third dimension, all of it tied to the scroll or the pointer.

  Built on Motion (motion.dev) loaded from the CDN at a pinned version. scroll(animate()) binds a
  transform to scroll progress and runs on the browser's ScrollTimeline where it exists (off the main
  thread), with Motion's own measurement as the fallback elsewhere. Pointer tilt runs on springs, so it
  keeps its velocity when the pointer changes direction. Only transform and opacity ever move.

  What it does, top to bottom:
    page       a hairline of progress under the header; every section's heading and the line under it rise from
               below and fade in as they arrive (one entrance for every section, contact included)
    hero       the product window opens tilted back and lands flat as the page moves; the words lift away
               ahead of it and the landscape behind sinks more slowly than both; the window leans a little
               toward the pointer
    services   nothing moves with the scroll here (the client's word). The mock inside each visual still
               leans toward the pointer (the card-tilt pattern: the panel is the flat hit area, the mock
               inside it is what tilts)
    why        Why Horux is one dark chapter in two blocks (#why, the reasons, and #reach, where we work): the
               whole of it is uncovered from under the services in one piece, the way the footer is
    approach   "built in, not bolted on" as an object: a stack of plates stands open with the agents'
               plate hanging beside it, and the scroll slides that plate into the stack and closes it
    products   nothing moves with the scroll here (the client's word)
    reach      (the second block of Why Horux) the globe comes forward as it crosses the screen; the figures rise in turn
    close      the footer is uncovered from under the page's last sheet

  Nothing here hides content for good: every element rests in its finished place, so with reduced motion,
  without script or if the CDN cannot be reached the page is simply still (the progress line is made here,
  so it does not exist then). A phone runs the scroll-linked moves at half strength, with no pointer tilt.
*/
const MOTION = 'https://cdn.jsdelivr.net/npm/motion@14.12.0/+esm';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = matchMedia('(max-width: 639px)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

if (!reduced) boot();

async function boot() {
  let M;
  // the page draws the hero window in its opening pose before this file runs (html.v5-pose); if Motion cannot be
  // had, that pose is given back so the window stands flat
  const flat = () => document.documentElement.classList.remove('v5-pose');
  try { M = await import(MOTION); } catch { flat(); return; }
  const { animate, scroll, motionValue, springValue, styleEffect } = M;
  if (!animate || !scroll) { flat(); return; }

  const $ = (q, r = document) => r.querySelector(q);
  const $$ = (q, r = document) => [...r.querySelectorAll(q)];
  const k = phone ? 0.5 : 1;                       // strength: a phone moves half as far
  const out = { ease: 'easeOut' }, lin = { ease: 'linear' };
  const through = ['start end', 'end start'];      // from the moment a thing enters at the foot until it has left at the top
  document.documentElement.classList.add('v5-depth');

  // a surface that leans toward the pointer: `hit` is flat and never moves, `el` inside it tilts
  const lean = (hit, el, max, extra = {}) => {
    if (!fine || !springValue || !styleEffect) { if (styleEffect && Object.keys(extra).length) styleEffect(el, extra); return; }
    const spring = { stiffness: 150, damping: 20, mass: 0.6 };
    const rx = springValue(0, spring), ry = springValue(0, spring);
    styleEffect(el, { ...extra, rotateX: rx, rotateY: ry });
    let box = null;
    hit.addEventListener('pointerenter', () => { box = hit.getBoundingClientRect(); });
    hit.addEventListener('pointermove', e => {
      if (!box) box = hit.getBoundingClientRect();
      ry.set(((e.clientX - box.left) / box.width - 0.5) * 2 * max);
      rx.set(-((e.clientY - box.top) / box.height - 0.5) * 2 * max);
    });
    hit.addEventListener('pointerleave', () => { box = null; rx.set(0); ry.set(0); });
    addEventListener('scroll', () => { box = null; }, { passive: true });
  };

  /* ---------------------------------------------------------------- the page: progress, headings */
  const bar = document.createElement('i');
  bar.className = 'v5-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);
  scroll(animate(bar, { transform: ['scaleX(0)', 'scaleX(1)'] }, lin));

  // CLIENT CHANGE (2026-11-21): "there is an inconsistency in the fading in of the titles and the texts". Every
  // section's words now arrive the one way he liked (approach, products): the heading, then the line under it,
  // each rising from below as it fades in, the second a step behind. The services' heading joins (it had no
  // entrance: the services' "no scroll movement" was about their visuals), and the moves that brought the Why
  // Horux chapter and the contact block down from above (the "uncovered" sheets) are gone.
  // 2026-11-21, CLIENT ASK ("the fade in on scroll is too soft, we need something more and consistent for all
  // sections"), rolled out section by section on his word, from section 2: the stronger entrance below. It rises
  // twice as far (96px, 64 on a phone), starts from nothing and comes up a touch small, over a shorter stretch of
  // the scroll, then rests. Sections not yet on it keep the softer one in the loop after it.
  const RISE = phone ? 64 : 96;
  const rise = (el, i = 0) => scroll(
    animate(el, { transform: [`translateY(${RISE}px) scale(0.97)`, 'translateY(0px) scale(1)'], opacity: [0, 1] }, out),
    { target: el, offset: ['start 102%', `start ${(64 - i * 5).toFixed(0)}%`] });
  const strong = ['#services'];
  // section 2, the services: the heading and the line under it (each service's row has its own parallax, below)
  $$('#services .section-head > :is(h2, h3, p)').forEach(el => rise(el));

  $$('main .section-head, footer .contact__words').forEach(head => {
    if (head.closest('.hero') || strong.some(q => head.closest(q))) return;
    // each on its own scroll range: the line under the heading starts as it reaches the screen, so it comes a step
    // behind by its own place (a phone sets the contact words' box to display: contents, which has no box to measure)
    $$(':scope > :is(h2, h3, p)', head).forEach(el => {
      scroll(animate(el, { transform: [`translateY(${44 * k}px)`, 'translateY(0px)'], opacity: [0.1, 1] }, out),
        { target: el, offset: ['start 100%', 'start 70%'] });
    });
  });

  /* ---------------------------------------------------------------- hero */
  const hero = $('.hero');
  if (hero) {
    const win = $('.hero__window', hero), words = $('.hero__c', hero), ground = $('.hero__ground', hero);
    if (win) {
      // v6: the pose is worked out here from the page's own scroll position, not on a scroll timeline. A timeline
      // on the hero is measured from under the header (the page's scroll-padding), so at the top of the page it
      // already stood 59px in, at a pose no stylesheet could name; the window was drawn flat, then snapped to
      // it when this file arrived. Now the top of the page is exactly the opening pose below, the page draws
      // that same pose from its first paint (html.v5-pose, index.html), and nothing moves at the handover. The
      // figures are the pose the window has always rested at on a desktop screen (17 degrees back, 6% small).
      const R = 17 * k, S = 0.062 * k;
      let range = hero.offsetHeight * 0.46, was = -1;
      const pose = () => {
        const p = Math.min(1, Math.max(0, scrollY / range));
        if (p === was) return;
        was = p;
        const left = (1 - p) * (1 - p);                         // ease out: quick at first, settling as it lands flat
        win.style.transform = `perspective(1500px) rotateX(${(R * left).toFixed(3)}deg) scale(${(1 - S * left).toFixed(4)})`;
      };
      addEventListener('scroll', pose, { passive: true });
      addEventListener('resize', () => { range = hero.offsetHeight * 0.46; was = -1; pose(); });
      pose();
      const app = $(':scope > .ly-piece, :scope > .app', win);
      if (app) lean(win, app, 2.5);
    }
    if (words) scroll(animate(words, { transform: ['translateY(0px)', `translateY(${-80 * k}px)`], opacity: [1, 0] }, lin),
      { target: hero, offset: ['8% start', '62% start'] });
    if (ground) scroll(animate(ground, { transform: ['translateY(0px)', `translateY(${90 * k}px)`] }, lin),
      { target: hero, offset: ['start start', 'end start'] });
  }

  /* ---------------------------------------------------------------- services: each row fades up */
  // CLIENT CHANGE (2026-11-21): after a pass where every row moved in three depths the whole time it was on screen,
  // he asked for that to go: "I just want a fade in from under for both the text and the animation. Something
  // simple but noticeable and elegant". So each service's words and its picture rise 80px (56 on a phone) out of
  // nothing, each on its own stretch of the scroll, from just inside the foot of the screen to a little past the
  // middle, so the move is seen in the part of the screen being read; then they rest. The words come a step
  // behind the picture's start. The pointer still tilts the screen inside the picture.
  const UP = phone ? 56 : 80;
  const fadeUp = (el, from, to) => scroll(
    animate(el, { transform: [`translateY(${UP}px)`, 'translateY(0px)'], opacity: [0, 1] }, { ease: 'easeOut' }),
    { target: el, offset: [`start ${from}%`, `start ${to}%`] });
  $$('#services .svc').forEach(row => {
    const text = $(':scope > .svc__text', row), panel = $(':scope > .svc__visual', row);
    if (panel) {
      fadeUp(panel, 96, 52);
      const layer = $(':scope > .stage, :scope > .ag, :scope > .cv, :scope > .di', panel);
      if (layer) lean(panel, layer, 4);
    }
    if (text) fadeUp(text, 92, 48);
  });

  /* ---------------------------------------------------------------- why: uncovered from under the services */
  // the way the products and the footer come into view: the services are a sheet lying over this band, and what
  // is in the band holds back at about two thirds of the scroll speed while that sheet lifts off it. (The four
  // reasons used to swing up in 3D as the row arrived; that went, so one thing happens here, not two.)
  // CLIENT CHANGE (v6): "why companies choose Horux" and "where we work" are one section, Why Horux, and move as
  // one. The reasons and the globe's block used to be two things: only the reasons were held back, so the gap
  // between the two closed up as the band came into view. Both now ride the same move, on the one timeline of
  // the band's top edge, so the whole dark chapter is uncovered in a single piece.
  // 2026-11-21: taken off (see the headings above): the chapter came down from above while every other section's
  // words rise from below

  /* ---------------------------------------------------------------- a sentence that lights up word by word */
  // v6, CLIENT CHANGE: [data-v5-words] (the line under "Why companies choose Horux") is read as it is scrolled
  // past: every word waits at 15% and comes up to full in turn, the first as the sentence is at 85% of the
  // screen's height and the last as it reaches 45% (the Scroll word reveal on 21st.dev, from Motion's own
  // examples: its resting 15%, each word over a fifth of the travel, the starts spread over four fifths). Each
  // word has its own scroll range, so all of it runs on the scroll timeline with nothing computed per frame.
  $$('[data-v5-words]').forEach(el => {
    const parts = el.textContent.trim().split(/\s+/);
    if (parts.length < 2 || el.children.length) return;       // plain text only: a link or a mark inside stays whole
    el.textContent = '';
    parts.forEach((word, i) => {
      const span = document.createElement('span');
      span.textContent = word;
      el.append(span, i < parts.length - 1 ? ' ' : '');
      const from = (i / (parts.length - 1)) * 0.8, to = Math.min(1, from + 0.2);
      scroll(animate(span, { opacity: [0.15, 1] }, lin),
        { target: el, offset: [`start ${(85 - 40 * from).toFixed(1)}%`, `start ${(85 - 40 * to).toFixed(1)}%`] });
    });
  });

  /* ---------------------------------------------------------------- approach: the plate slides into the stack */
  const stack = $('[data-v5-stack]');
  if (stack) {
    const scene = $('.builtin__scene', stack), head = stack.closest('.section-head') || stack;
    const range = { target: head, offset: ['start 78%', 'start 10%'] };
    const io = { ease: 'easeInOut' };
    // open positions (the stack stands apart, the agents' plate hangs beside it) to the closed ones in the CSS.
    // v5 fix (client: "on mobile the layer of agent has an error"): these distances were drawn for the desktop
    // plate (240px) and stayed the same on a phone, where the plate is 160px, so the agents' plate hung past the
    // screen's right edge and the open stack rose over the paragraph above it. Every distance now scales with
    // the plate (--plate, index.html), and on a phone the agents' plate hangs closer still and the top plate
    // lifts less, so the open stack stays inside the screen and under the words.
    const k = (parseFloat(getComputedStyle(stack).getPropertyValue('--plate')) || 240) / 240;
    const hang = k * (innerWidth < 640 ? 0.62 : 1), lift = k * (innerWidth < 640 ? 0.75 : 1);
    const px = (v, s = k) => `${(v * s).toFixed(1)}px`;
    const OPEN = { systems: 'translate3d(0px, 0px, 0px)', data: `translate3d(0px, 0px, ${px(86, lift)})`, teams: `translate3d(0px, 0px, ${px(300, lift)})`,
                   ai: `translate3d(${px(250, hang)}, ${px(-70, hang)}, ${px(196, lift)}) rotateZ(16deg)` };
    // closed: the CSS stack exactly (index.html, .builtin__plate[data-plate]), which is the same at every size
    const SHUT = { systems: 'translate3d(0px, 0px, 0px)', data: 'translate3d(0px, 0px, 46px)', teams: 'translate3d(0px, 0px, 138px)',
                   ai: 'translate3d(0px, 0px, 92px) rotateZ(0deg)' };
    for (const key in OPEN) {
      const plate = $(`[data-plate="${key}"]`, stack);
      if (plate) scroll(animate(plate, { transform: [OPEN[key], SHUT[key]] }, io), range);
    }
    // v6 (the realistic pass): each plate's shadow on the one under it travels with the plates, on the same
    // scroll. Open, the plates stand further apart, so a shadow lies further from under its plate and is
    // fainter; the agents' plate hangs out to the side, and so does its shadow, which comes in across "Your
    // data" (and across the floor, where it joins the stack's own shadow) as the plate slides home.
    const CAST = {
      systems: [{ transform: `translate(${px(26)}, ${px(26)})`, opacity: 0.13 }, { transform: 'translate(14px, 14px)', opacity: 0.2 }],
      data:    [{ transform: `translate(${px(292, hang)}, ${px(-28, hang)}) rotate(16deg)`, opacity: 0.12 }, { transform: 'translate(14px, 14px) rotate(0deg)', opacity: 0.2 }],
      ai:      [{ transform: `translate(${px(-218, hang)}, ${px(102, lift)})`, opacity: 0.1 }, { transform: 'translate(14px, 14px)', opacity: 0.2 }],
      floor:   [{ transform: `translate3d(${px(318, hang)}, ${px(-2, hang)}, -30px) rotateZ(16deg)`, opacity: 0.7 }, { transform: 'translate3d(34px, 34px, -30px) rotateZ(0deg)', opacity: 0 }],
    };
    for (const key in CAST) {
      const el = $(`[data-cast="${key}"]`, stack), [a, b] = CAST[key];
      if (el) scroll(animate(el, { transform: [a.transform, b.transform], opacity: [a.opacity, b.opacity] }, io), range);
    }
    // the agents' plate wears the orb, whose two layers turn all the time: they rest while the stack is off screen
    if ('IntersectionObserver' in window) new IntersectionObserver(es => stack.classList.toggle('is-away', !es[es.length - 1].isIntersecting), { rootMargin: '120px' }).observe(stack);
    // the moment it shuts: the plates give and settle and a ring of light leaves the agents' plate (index.html,
    // .is-seated). Once each time the stack closes; scrolling back up arms it again.
    let seated = false;
    scroll(p => {
      if (p >= 0.985 && !seated) { seated = true; stack.classList.remove('is-seated'); void stack.offsetWidth; stack.classList.add('is-seated'); }
      else if (p < 0.88 && seated) { seated = false; stack.classList.remove('is-seated'); }
    }, range);
    // the whole object turns a little as it closes
    if (scene) scroll(animate(scene, { transform: ['rotateX(64deg) rotateZ(-58deg)', 'rotateX(58deg) rotateZ(-36deg)'] }, lin), { target: head, offset: through });
  }

  /* ---------------------------------------------------------------- products: uncovered like the footer; ARM at two depths */
  // the products stand still under the scroll (the client took the parallax off this section and off the one
  // before it); the code below is for the second product, which is off the page for now
  const armPanel = $('#arm .arm-panel');
  if (armPanel) {
    scroll(animate(armPanel, {
      transform: [`perspective(1300px) translateY(${130 * k}px) rotateY(${26 * k}deg) rotateX(${8 * k}deg) scale(${1 - 0.12 * k})`, 'perspective(1300px) translateY(0px) rotateY(0deg) rotateX(0deg) scale(1)',
                  'perspective(1300px) translateY(0px) rotateY(0deg) rotateX(0deg) scale(1)', `perspective(1300px) translateY(${-90 * k}px) rotateY(${-14 * k}deg) rotateX(${-6 * k}deg) scale(${1 - 0.06 * k})`],
      opacity: [0.15, 1, 1, 0.6],
    }, { ease: 'linear', times: [0, 0.4, 0.62, 1] }), { target: armPanel, offset: through });
    const layer = $(':scope > .stage', armPanel), feed = $('.arm__feed', armPanel), acc = $('.arm__acc', armPanel);
    if (layer && motionValue && styleEffect) {
      lean(armPanel, layer, 4);
      // the feed card sits nearer than the accounts card, so it travels further and in the other sense
      const fy = motionValue(0), ay = motionValue(0);
      scroll(p => { fy.set(Math.round((0.5 - p) * 110 * k)); ay.set(Math.round((p - 0.5) * 40 * k)); }, { target: armPanel, offset: through });
      if (feed) styleEffect(feed, { y: fy });
      if (acc) styleEffect(acc, { y: ay });
    }
    const armText = $('#arm .span-5');
    if (armText) scroll(animate(armText, { transform: [`translateY(${46 * k}px)`, `translateY(${-46 * k}px)`] }, lin), { target: armPanel, offset: through });
  }

  /* ---------------------------------------------------------------- reach: the globe comes forward, the figures rise */
  const reach = $('#reach'), globe = reach && $('.frame--hero', reach);
  if (globe && !phone) scroll(animate(globe, { transform: ['scale(0.84) translateY(50px)', 'scale(1.1) translateY(-30px)'] }, lin), { target: reach, offset: through });
  const facts = reach && $('.reach-facts', reach);
  if (facts) $$(':scope > div', facts).forEach((f, i) => {
    scroll(animate(f, { transform: [`translateY(${(70 + i * 26) * k}px)`, 'translateY(0px)'], opacity: [0, 1] }, out),
      { target: facts, offset: ['start 100%', `start ${72 - i * 4}%`] });
  });

  /* ---------------------------------------------------------------- close: the footer is uncovered */
  // 2026-11-21: the footer's uncovering (its block came down from above) is taken off; the contact words rise
  // from below like every section's (see the headings above)
}
