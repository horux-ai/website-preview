/* v5 site.js: the header's scroll state, on every page (the styles are in site.css).
   .is-scrolled once the page has moved 8px. The change is only animated once the page has settled
   (html.nav-live): a page that opens part-way down, by a link to a section from another page or by Back,
   gets the scrolled bar straight away instead of watching it change on arrival. */
(() => {
  const nav = document.querySelector('header.nav');
  if (!nav) return;
  const set = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  set();
  window.addEventListener('scroll', set, { passive: true });
  window.addEventListener('pageshow', set);          // a page restored by Back / Forward
  let live = false;
  const settle = () => {
    if (live) return;
    live = true;
    set();
    requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('nav-live')));
  };
  if (document.readyState === 'complete') settle();
  else { window.addEventListener('load', settle, { once: true }); setTimeout(settle, 3000); }
})();
