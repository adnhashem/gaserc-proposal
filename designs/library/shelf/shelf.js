/* د · الرفّ الحيّ — 179 كعباً بسنواتها الحقيقية (1994 يميناً إلى 2026 يساراً، كما يُقرأ الزمن عربياً).
   الارتفاع = عدد الصفحات · اللون = النوع (مع مفتاح نصّي) · البحث والفلتر يضيئان المطابق (حالة) */
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const G = window.GASERC;
    const host = document.querySelector('[data-spines]');
    if (host) {
      const withYear = G.PUBS.filter(p => p.year);
      const years = [];
      for (let y = 1994; y <= 2026; y++) years.push(y);
      const byYear = y => withYear.filter(p => p.year === y).sort((a, b) => a.type.localeCompare(b.type) || a.id - b.id);
      const h = p => Math.round(Math.max(36, Math.min(200, 36 + (p.pages || 140) / 520 * 164)));
      host.innerHTML = years.map((y, k) => `<span class="yr" data-y="${y}">${byYear(y).map(p =>
        `<span class="sp t-${p.type} enter" data-id="${p.id}" style="--h:${h(p)}px;transition-delay:${k * 22}ms"></span>`).join('')}</span>`).join('');
      document.querySelector('[data-years]').innerHTML = years.map(y => `<span>${y % 4 === 2 || y === 2026 ? y : ''}</span>`).join('');
      requestAnimationFrame(() => requestAnimationFrame(() => host.querySelectorAll('.sp').forEach(s => s.classList.remove('enter'))));
      setTimeout(() => host.querySelectorAll('.sp').forEach(s => s.style.transitionDelay = ''), 1800);
      if (matchMedia('(max-width: 760px)').matches) host.scrollLeft = -host.scrollWidth; // الأحدث أولاً على الجوال

      // تلميح عند التحويم + فتح الإصدار عند النقر
      const tip = document.querySelector('[data-tip]');
      const board = document.querySelector('.shelf-board');
      host.addEventListener('pointerover', e => {
        const s = e.target.closest('.sp'); if (!s) return;
        const p = G.PUBS.find(x => x.id === +s.dataset.id);
        tip.innerHTML = `<b>${G.esc(p.title)}</b><span>${G.TYPE_LABEL[p.type]} · <span class="num">${p.year}</span>${p.pages ? ` · <span class="num">${p.pages}</span> صفحة` : ''}</span>`;
        tip.hidden = false;
        const br = board.getBoundingClientRect(), sr = s.getBoundingClientRect();
        const left = Math.min(Math.max(sr.left - br.left - 140, 8), br.width - 290);
        tip.style.left = left + 'px';
        tip.style.top = (sr.top - br.top - tip.offsetHeight - 12) + 'px';
      });
      host.addEventListener('pointerleave', () => { tip.hidden = true; });
      host.addEventListener('click', e => { const s = e.target.closest('.sp'); if (s) location.href = `publication.html?id=${s.dataset.id}`; });

      // النتائج تحت الرفّ: الكعوب المضيئة تبقى ظاهرة فوقها (الرفّ هو النتيجة)
      const res = document.querySelector('[data-results]');
      const boardEl = document.querySelector('.shelf-board');
      if (res && boardEl) { boardEl.after(res); res.classList.add('docked'); }
      const shown = document.querySelector('[data-shown]');
      G.onSearch(s => {
        if (!s.ids) return;
        const set = new Set(s.ids);
        host.classList.toggle('filtering', !!s.active);
        host.querySelectorAll('.sp').forEach(sp => sp.classList.toggle('on', set.has(+sp.dataset.id)));
        shown.textContent = s.active ? s.ids.filter(id => withYear.some(p => p.id === id)).length : withYear.length;
      });
    }

    // صفحة الإصدار: موقع السنة على الرفّ
    const yb = document.querySelector('[data-yearbar]');
    const page = document.querySelector('[data-pub]');
    if (yb && page) {
      const y = +page.dataset.year;
      const cnt = {};
      G.PUBS.forEach(p => { if (p.year) cnt[p.year] = (cnt[p.year] || 0) + 1; });
      const max = Math.max(...Object.values(cnt));
      let ticks = '';
      for (let k = 0, yy = 1994; yy <= 2026; yy++, k++) ticks += `<i class="${yy === y ? 'now' : ''}" style="--h:${Math.max(4, (cnt[yy] || 0) / max * 48)}px;--k:${k}" title="${yy}"></i>`;
      yb.innerHTML = `<div class="ticks">${ticks}</div><div class="cap"><span>1994</span><span>سنة الإصدار <b>${y || 'بلا سنة'}</b> · إصدارات تلك السنة <b>${cnt[y] || 0}</b></span><span>2026</span></div>`;
    }
  });
})();
