/* ب · لؤلؤ الخليج — «المدّ».
   Authored moment: nacre sheen in three layers, each at its own depth, drifting with the
   pointer and the scroll like light on the inside of a pearl shell. Covers surface once. */
(() => {
  const { $, $$ } = FX;
  const hero = $('.hero');

  /* 1 · sheen layers: pointer depth + scroll depth; one settling drift on arrival (< 2 s) */
  if (hero) {
    const DEPTH = [16, 34, 58], SCROLL = [0.05, 0.12, 0.2];
    const layers = ['s3', 's2', 's1'].map((c) => FX.layer(hero, 'fx-sheen ' + c)).reverse();
    let sy = 0;
    const render = (i) => { const [x, y] = springs[i].x;
      layers[i].style.transform = `translate3d(${x.toFixed(1)}px, ${(y + sy * SCROLL[i]).toFixed(1)}px, 0)`; };
    const springs = layers.map((_, i) => FX.spring('float', FX.live ? [DEPTH[i] * 2.4 * (FX.rtl ? 1 : -1), DEPTH[i] * 0.9] : [0, 0], () => render(i)));
    layers.forEach((_, i) => render(i));
    if (FX.live) requestAnimationFrame(() => springs.forEach((s) => s.to(0, 0)));
    hero.addEventListener('pointermove', (e) => {
      if (!FX.live || e.pointerType === 'touch') return;
      const r = hero.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      springs.forEach((s, i) => s.to(nx * DEPTH[i], ny * DEPTH[i] * 0.6));
    });
    hero.addEventListener('pointerleave', () => FX.live && springs.forEach((s) => s.to(0, 0)));
    let queued = false;
    addEventListener('scroll', () => {
      if (!FX.live || queued) return; queued = true;
      requestAnimationFrame(() => { queued = false; if (!FX.isInViewport(hero)) return; sy = scrollY; layers.forEach((_, i) => render(i)); });
    }, { passive: true });
    FX.onPause(() => { sy = 0; springs.forEach((s) => s.jump(0, 0)); });
  }

  /* 2 · covers surface from below the waterline, once, as a list (stagger 70 ms).
     Covers stay visible by default: the hidden first frame is armed only while the grid is
     just below the fold and about to enter, so print, find-in-page and full-page captures
     never meet an empty frame (the live site hid content until scroll; this must not). */
  const surface = (grid) => {
    const imgs = $$('.cover img', grid);
    if (!imgs.length || !FX.live || FX.isInViewport(grid)) return;
    let anims = null;
    const arm = () => anims || (anims = imgs.map((img, i) => {
      const a = img.animate([{ clipPath: 'inset(100% 0 0 0)', transform: 'translateY(16px)' },
                              { clipPath: 'inset(0 0 0 0)', transform: 'translateY(0)' }],
                             { duration: FX.DUR.enter, delay: i * 70, easing: FX.EASE_OUT, fill: 'backwards' });
      a.pause(); return a;
    }));
    FX.inView([grid], arm, { margin: '0px 0px 15% 0px' });
    FX.inView([grid], () => { if (!FX.live) return; arm().forEach((a) => a.play()); }, { margin: '0px 0px -4% 0px' });
    FX.onPause(() => anims && anims.forEach((a) => a.finish()));
  };
  $$('.pubs, .related').forEach(surface);

  /* 3 · figures count up in a wave across the band */
  const stats = $('.stats');
  if (stats) FX.inView([stats], () => $$('.stat b', stats).forEach((b, i) => FX.count(b, { duration: 900, delay: i * 120 })));

  /* 4 · the large cover floats with the pointer and carries the sheen */
  const big = $('.big-cover');
  if (big) {
    const host = big.parentElement, glare = FX.glare(host, big);
    const s = FX.spring('float', [0, 0], ([x, y]) => { const t = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`; big.style.transform = t; glare.style.transform = t; });
    host.addEventListener('pointermove', (e) => {
      if (!FX.live || !FX.fine) return;
      const r = host.getBoundingClientRect(), nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      s.to(nx * 10, ny * 10 - 6); glare.style.setProperty('--gx', `${((nx + 1) * 50).toFixed(1)}%`);
    });
    host.addEventListener('pointerleave', () => s.to(0, 0));
    FX.onPause(() => s.jump(0, 0));
  }

  FX.chips({ mode: 'liquid' });
})();
