/* ج · اللازورد الهندسي — حقل النجوم الثمانية:
   قرب المؤشر تدور النجوم وتتلوّن (تغذية راجعة) · عند التركيز على البحث ينفتح الحقل حول اللوحة (حالة)
   · نقاط ذهبية تضيء بعدد النتائج (حالة). لا حلقة ذاتية: كل حركة استجابة لفعل. */
(() => {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.addEventListener('DOMContentLoaded', () => {
    const G = window.GASERC;
    const field = document.querySelector('[data-field]');
    const hero = document.querySelector('.hero');
    const panel = document.querySelector('.panel');
    if (!field || !hero) return;
    let stars = [];
    const build = () => {
      const W = hero.clientWidth, H = hero.clientHeight, cell = W < 700 ? 56 : 76;
      field.setAttribute('viewBox', `0 0 ${W} ${H}`);
      field.innerHTML = '';
      stars = [];
      const cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = W - c * cell - (r % 2 ? cell / 2 : 0), y = r * cell;   // RTL: يبدأ من اليمين
        const g = document.createElementNS(SVGNS, 'g');
        g.setAttribute('class', 'st enter');
        g.setAttribute('transform', `translate(${x} ${y})`);
        const inner = document.createElementNS(SVGNS, 'g');
        inner.setAttribute('class', 'st-i');
        const s = cell * 0.26;
        inner.innerHTML = `<rect x="${-s}" y="${-s}" width="${2 * s}" height="${2 * s}"/><rect x="${-s}" y="${-s}" width="${2 * s}" height="${2 * s}" transform="rotate(45)"/><circle r="2"/>`;
        g.appendChild(inner);
        field.appendChild(g);
        stars.push({ el: inner, wrap: g, x, y, d: c + r });
      }
      // الحركة على العنصر الداخلي (الخارجي يحمل الموضع)
      stars.forEach(s => s.el.classList.add('st'));
      stars.forEach(s => s.wrap.setAttribute('class', ''));
      if (G.motionOn()) {
        stars.forEach(s => { s.el.classList.add('enter'); s.el.style.transitionDelay = (s.d * 18) + 'ms'; });
        requestAnimationFrame(() => requestAnimationFrame(() => stars.forEach(s => s.el.classList.remove('enter'))));
        setTimeout(() => stars.forEach(s => s.el.style.transitionDelay = ''), 2400);
      }
      markHalo(document.activeElement && document.activeElement.id === 'q');
    };
    const markHalo = on => {
      if (!panel) return;
      const hr = hero.getBoundingClientRect(), pr = panel.getBoundingClientRect();
      const pad = 90;
      stars.forEach(s => {
        const inside = s.x >= pr.left - hr.left - pad && s.x <= pr.right - hr.left + pad && s.y >= pr.top - hr.top - pad && s.y <= pr.bottom - hr.top + pad;
        s.el.classList.toggle('halo', on && inside);
      });
    };
    build();
    let rt = 0;
    let lastW = hero.clientWidth;
    new ResizeObserver(() => { if (hero.clientWidth === lastW) return; lastW = hero.clientWidth; clearTimeout(rt); rt = setTimeout(build, 200); }).observe(hero);

    // قرب المؤشر
    if (fine) {
      let raf = 0, mx = 0, my = 0;
      hero.addEventListener('pointermove', e => {
        if (!G.motionOn()) return;
        const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          stars.forEach(s => {
            const d = Math.hypot(s.x - mx, s.y - my);
            const f = d < 200 ? (1 - d / 200) : 0;
            if (f > 0.02 || s.el.style.getPropertyValue('--f')) s.el.style.setProperty('--f', f.toFixed(2));
          });
        });
      });
      hero.addEventListener('pointerleave', () => stars.forEach(s => s.el.style.removeProperty('--f')));
    }

    // البحث: تركيز ⇒ انفتاح · نتائج ⇒ نقاط ذهبية بعددها
    G.onSearch(s => {
      if (s.focus !== undefined) { markHalo(s.focus); return; }
      if (!s.ids) return;
      stars.forEach(x => x.el.classList.remove('lit'));
      if (!s.active || !s.total) return;
      const n = Math.min(s.total, 40);
      const pool = stars.filter(x => !x.el.classList.contains('halo'));
      for (let i = 0; i < n && pool.length; i++) {
        const k = (i * 7919 + s.total * 31) % pool.length;   // توزيع ثابت لنفس العدد
        pool.splice(k, 1)[0].el.classList.add('lit');
      }
    });
    window.addEventListener('gaserc:motion', e => { if (!e.detail.on) stars.forEach(s => s.el.style.removeProperty('--f')); });
  });
})();
