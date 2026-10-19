/* أ · مصباح القارئ.
   Authored moment: a reading lamp follows the pointer (or the finger) over the dark hero,
   and the headline's words come out of the dark. Covers catch the same lamp light. */
(() => {
  const { $, $$ } = FX;
  const hero = $('.hero');

  /* 1 · the lamp — one light across the whole dark block (bar, header, hero, figures), so it
     never meets a hard edge between sections. Position is kept in page coordinates; each
     section carries its own clipped copy offset by its own position. Rests over the search
     field (or the header centre on pages without a hero) when the pointer leaves. */
  const block = $$('.util, .head, .hero, .stats, .band');
  if (block.length) {
    const lamps = block.map((sec) => [sec, FX.layer(sec, 'fx-lamp')]);
    const search = $('.hero .search');
    const pageXY = (el, fx = 0.5, fy = 0.5) => { const r = el.getBoundingClientRect(); return [r.left + scrollX + r.width * fx, r.top + scrollY + r.height * fy]; };
    const rest = () => (search ? pageXY(search, 0.5, 0.2) : pageXY($('.head'), 0.5, 0.5));
    let origin = [];
    const measure = () => { origin = block.map((sec) => { const r = sec.getBoundingClientRect(); return [r.left + scrollX, r.top + scrollY]; }); };
    const put = ([x, y]) => lamps.forEach(([, lamp], i) => {
      lamp.style.transform = `translate3d(${(x - origin[i][0]).toFixed(1)}px, ${(y - origin[i][1]).toFixed(1)}px, 0)`; });
    measure();
    const start = FX.live ? [innerWidth * 0.5, -innerHeight * 0.2] : rest();
    const lampSpring = FX.spring('lamp', start, put);
    put(lampSpring.x);
    if (FX.live) requestAnimationFrame(() => lampSpring.to(...rest()));   // one sweep on arrival, ~1 s
    const follow = (x, y) => { if (FX.live) lampSpring.to(x + scrollX, y + scrollY); };
    block.forEach((sec) => {
      sec.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') follow(e.clientX, e.clientY); });
      sec.addEventListener('touchstart', (e) => follow(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
      sec.addEventListener('touchmove', (e) => follow(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    });
    document.addEventListener('pointerover', (e) => {
      if (FX.live && e.pointerType !== 'touch' && !block.some((sec) => sec.contains(e.target))) lampSpring.to(...rest());
    });
    addEventListener('touchend', () => { if (FX.live) setTimeout(() => lampSpring.to(...rest()), 700); }, { passive: true });
    addEventListener('resize', () => { measure(); lampSpring.jump(...rest()); });
    addEventListener('load', () => { measure(); put(lampSpring.x); });
    FX.onPause(() => lampSpring.jump(...rest()));
  }

  /* 2 · headline: word by word out of the dark (never letter by letter — Arabic must stay joined) */
  const h1 = $('.hero h1');
  if (h1 && !FX.paused) {
    if (FX.live) {
      const parts = h1.textContent.split(/(\s+)/);
      h1.textContent = '';
      const words = [];
      parts.forEach((p) => {
        if (/^\s+$/.test(p) || !p) { h1.append(p); return; }
        const w = document.createElement('span'); w.className = 'fx-w'; w.dataset.fx = ''; w.textContent = p;
        h1.append(w); words.push(w);
      });
      words.forEach((w, i) => w.animate(
        [{ opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0px)' }],
        { duration: FX.DUR.enter, delay: 120 + i * FX.DUR.stagger, easing: FX.EASE_OUT, fill: 'backwards' }));
    } else if (FX.reduced) {
      h1.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease' });
    }
  }

  /* 3 · the figures count up once, when they are seen */
  const stats = $('.stats');
  if (stats) FX.inView([stats], () => $$('.stat b', stats).forEach((b) => FX.count(b, { duration: 900 })));

  /* 4 · covers tilt toward the pointer and catch the lamp's light */
  $$('.pub').forEach((card) => {
    const host = $('.cover', card), img = host && $('img', host);
    if (!img) return;
    FX.tilt(card, img, { max: FX.TILT_MAX.cover, glare: FX.glare(host, img) });
  });
  const big = $('.big-cover');
  if (big) FX.tilt(big.parentElement, big, { max: FX.TILT_MAX.big, glare: FX.glare(big.parentElement, big) });

  FX.chips({ mode: 'ease' });
})();
