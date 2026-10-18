/* أ · الحبر الكحلي — جدار الأغلفة يستجيب للبحث (تغذية راجعة + حالة)، ويميل مع المؤشر (طبقة «نادر» في الهيرو فقط) */
(() => {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.addEventListener('DOMContentLoaded', () => {
    const G = window.GASERC;
    const wall = document.querySelector('[data-wall]');
    if (wall) {
      const SLOTS = 24;
      const defaults = G.PUBS.filter(p => p.cover).slice(0, SLOTS);
      const cell = p => `<a href="${G.pubURL(p)}" tabindex="-1">${G.coverHTML(p)}</a>`;
      wall.innerHTML = defaults.map((p, i) => `<div class="wc enter" style="transition-delay:${i * 30}ms">${cell(p)}</div>`).join('');
      requestAnimationFrame(() => requestAnimationFrame(() => wall.querySelectorAll('.wc').forEach(c => c.classList.remove('enter'))));
      setTimeout(() => wall.querySelectorAll('.wc').forEach(c => c.style.transitionDelay = ''), 1400);

      let token = 0;
      G.onSearch(s => {
        if (s.focus !== undefined || !s.ids) return;
        const my = ++token;
        const list = s.active ? s.ids.map(id => G.PUBS.find(p => p.id === id)) : defaults;
        // الأماكن الأوضح أولاً: الصفوف الوسطى قبل الأطراف المغطّاة بالتلاشي
        const ORDER = [8,9,10,11,12,13,14,15,4,5,6,7,16,17,18,19,0,1,2,3,20,21,22,23];
        const cells = ORDER.map(i => wall.children[i]).filter(Boolean);
        const swap = () => {
          if (my !== token) return;
          cells.forEach((c, i) => {
            const p = list[i];
            c.classList.toggle('ghost', !p);
            c.classList.toggle('hit', !!(p && s.active));
            c.innerHTML = p ? cell(p) : cell(defaults[i]);
            c.style.transitionDelay = (G.motionOn() ? i * 25 : 0) + 'ms';
            c.classList.remove('out');
          });
        };
        if (!G.motionOn()) { swap(); return; }
        cells.forEach(c => { c.style.transitionDelay = '0ms'; c.classList.add('out'); });
        setTimeout(swap, 180);
      });

      // إمالة الجدار مع المؤشر — مكتب فقط، ومع تشغيل الحركة
      const hero = document.querySelector('.hero');
      if (fine && hero) {
        let raf = 0;
        hero.addEventListener('pointermove', e => {
          if (!G.motionOn() || raf) return;
          raf = requestAnimationFrame(() => {
            raf = 0;
            const r = hero.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
            wall.style.setProperty('--ry', (-14 + x * 16) + 'deg');
            wall.style.setProperty('--rx', (6 - y * 10) + 'deg');
          });
        });
        hero.addEventListener('pointerleave', () => { wall.style.removeProperty('--ry'); wall.style.removeProperty('--rx'); });
      }
    }

    // إمالة الغلاف عند التحويم ([data-tilt]) — حدّها --tilt-max
    if (fine) document.querySelectorAll('[data-tilt]').forEach(el => {
      const c = () => el.querySelector('.cover') || el;
      el.addEventListener('pointermove', e => {
        if (!G.motionOn()) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c().style.setProperty('--try', (x * 16) + 'deg');
        c().style.setProperty('--trx', (-y * 16) + 'deg');
      });
      el.addEventListener('pointerleave', () => { c().style.removeProperty('--try'); c().style.removeProperty('--trx'); });
    });
  });
})();
