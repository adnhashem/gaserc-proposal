/* ج · الأزرق الملكي — «الدقّة».
   Authored moment: the headline is written by an ink wipe in reading direction, then the
   figures roll like a mechanical counter on the cobalt band. Ink floods the type cells
   from where the pointer enters. */
(() => {
  const { $, $$ } = FX;

  /* 1 · ink wipe from inline-start (right in Arabic) */
  const wipe = (el, delay = 100) => {
    if (!el || FX.paused) return;
    if (FX.reduced) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease' }); return; }
    const from = FX.rtl ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
    el.animate([{ clipPath: from }, { clipPath: 'inset(0 0 0 0)' }],
               { duration: FX.DUR.enter, delay, easing: FX.EASE_IN_OUT, fill: 'backwards' });
  };
  wipe($('.hero h1'));
  wipe($('.pub-page h1'));
  const search = $('.hero .search');
  if (search && FX.live) {
    search.animate([{ boxShadow: 'none' }, { boxShadow: getComputedStyle(search).boxShadow }],
                   { duration: 500, delay: FX.DUR.enter, easing: FX.EASE_OUT, fill: 'backwards' });
  }

  /* 2 · odometer: each digit rolls through 0–9 and lands; the plain number returns after */
  const odo = (b, delay) => {
    const final = b.textContent.trim();
    if (!FX.live || !/^\d+$/.test(final)) return;
    const sr = document.createElement('span'); sr.className = 'fx-sr'; sr.dataset.fx = ''; sr.textContent = final;
    const wrap = document.createElement('span');
    wrap.className = 'fx-odo'; wrap.dataset.fx = ''; wrap.setAttribute('aria-hidden', 'true');
    const strips = [...final].map((d) => {
      const col = document.createElement('span'); col.className = 'fx-odo-col';
      const strip = document.createElement('span'); strip.className = 'fx-odo-strip';
      for (let i = 0; i < 20; i++) { const s = document.createElement('span'); s.textContent = i % 10; strip.append(s); }
      col.append(strip); wrap.append(col); return [strip, +d];
    });
    b.textContent = ''; b.append(sr, wrap);
    const runs = strips.map(([strip, d], i) => strip.animate(
      [{ transform: 'translateY(0)' }, { transform: `translateY(${-(10 + d) * 1.2}em)` }],
      { duration: 900 + i * 140, delay, easing: FX.EASE_OUT, fill: 'forwards' }).finished);
    const restore = () => { b.textContent = final; };
    Promise.all(runs).then(restore).catch(restore);
    FX.onPause(restore);
  };
  const stats = $('.stats');
  if (stats) FX.inView([stats], () => $$('.stat b', stats).forEach((b, i) => odo(b, i * 90)));

  /* 3 · browse by type: ink floods from the entry point, drains toward the exit point */
  $$('.types a').forEach((a) => {
    FX.layer(a, 'fx-ink');
    const at = (e) => { const r = a.getBoundingClientRect();
      a.style.setProperty('--ix', `${(e.clientX - r.left).toFixed(0)}px`); a.style.setProperty('--iy', `${(e.clientY - r.top).toFixed(0)}px`); };
    a.addEventListener('pointerenter', (e) => { if (FX.paused) return; at(e); a.classList.add('is-ink'); });
    a.addEventListener('pointerleave', (e) => { at(e); a.classList.remove('is-ink'); });
    a.addEventListener('focus', () => { a.style.setProperty('--ix', '50%'); a.style.setProperty('--iy', '50%'); a.classList.add('is-ink'); });
    a.addEventListener('blur', () => a.classList.remove('is-ink'));
  });
  FX.onPause(() => $$('.types a.is-ink').forEach((a) => a.classList.remove('is-ink')));

  /* 4 · covers: short, stiff tilt — no glare, precision over shine */
  $$('.pub').forEach((card) => { const img = $('.cover img', card); img && FX.tilt(card, img, { max: FX.TILT_MAX.cover, spring: 'magnet' }); });
  const big = $('.big-cover');
  if (big) FX.tilt(big.parentElement, big, { max: FX.TILT_MAX.big });

  FX.chips({ mode: 'ease', duration: 200 });
})();
