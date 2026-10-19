/* د · الهواء.
   Authored moment: on arrival the sun climbs into place (1.4 s, once); then the sky behind the
   bars brightens from dawn to mid-morning as the page moves, the sun on a slower plane.
   Cards lift into the air on springs; only covers tilt, so text never rotates. */
(() => {
  const { $, $$ } = FX;

  /* 1 · the sky: dawn → day crossfade (opacity only) and a sun on a slower plane */
  const sky = FX.layer(document.body, 'fx-sky');
  sky.innerHTML = '<i class="dawn"></i><i class="day"></i><i class="sun"></i>';
  const day = $('.day', sky), sun = $('.sun', sky);
  const until = () => $('.stats') || $('.crumbs');
  const size = () => { const el = until(); sky.style.height = `${el.getBoundingClientRect().bottom + scrollY + (el.matches('.crumbs') ? 260 : 0)}px`; };
  size(); addEventListener('resize', size); addEventListener('load', size);
  const sunSpring = FX.spring('float', [0], ([x]) => { sun.style.transform = `translate3d(${x.toFixed(1)}px, ${(scrollY * 0.45).toFixed(1)}px, 0)`; });
  let base = 0;   // day already shown before any scroll (the sunrise leaves it at .35)
  const paint = () => {
    const p = FX.live ? Math.min(1, base + scrollY / 640) : 0.5;
    day.style.opacity = p.toFixed(3);
    sun.style.transform = `translate3d(${sunSpring.x[0].toFixed(1)}px, ${(FX.live ? scrollY * 0.45 : 0).toFixed(1)}px, 0)`;
  };
  paint();
  if (FX.live) {
    sun.animate([{ opacity: 0.35, translate: '0 160px' }, { opacity: 1, translate: '0 0' }], { duration: 1400, easing: FX.EASE_OUT, fill: 'backwards' });
    day.animate([{ opacity: 0 }, { opacity: 0.35 }], { duration: 1400, easing: FX.EASE_OUT }).finished.then(() => { base = 0.35; paint(); }).catch(() => {});
  }
  let queued = false;
  addEventListener('scroll', () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; paint(); }); }, { passive: true });
  addEventListener('pointermove', (e) => { if (FX.live && FX.fine && e.clientY < 700) sunSpring.to(((e.clientX / innerWidth) * 2 - 1) * 40); }, { passive: true });
  FX.onPause(() => { sunSpring.jump(0); paint(); });

  /* 2 · cards lift on an air spring; only the cover tilts, so titles never rotate */
  $$('.pub').forEach((card) => {
    const host = $('.cover', card), img = host && $('img', host);
    const lift = FX.spring('air', [0], ([y]) => { card.style.transform = `translateY(${(-y).toFixed(2)}px)`; });
    card.addEventListener('pointerenter', () => { if (FX.live && FX.fine) lift.to(6); });
    card.addEventListener('pointerleave', () => lift.to(0));
    FX.onPause(() => lift.jump(0));
    if (img) FX.tilt(card, img, { max: FX.TILT_MAX.cover, spring: 'air', glare: FX.glare(host, img) });
  });
  const big = $('.big-cover');
  if (big) FX.tilt(big.parentElement, big, { max: FX.TILT_MAX.big, spring: 'air', lift: 4, glare: FX.glare(big.parentElement, big) });

  /* 3 · figures settle on a critically damped spring (numbers never overshoot) */
  const stats = $('.stats');
  if (stats) FX.inView([stats], () => $$('.stat b', stats).forEach((b) => FX.count(b, { spring: true })));

  FX.chips({ mode: 'spring' });
})();
