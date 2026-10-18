/* ب · أزرق الخليج — المدّ: موجات تتنفّس، ترتفع حيث المؤشر، ومنسوبها يرتفع مع عدد نتائج البحث (حالة).
   حركة ذاتية > ٥ ثوانٍ ⇒ تتوقّف بزرّ «إيقاف الحركة» (SC 2.2.2) وخارج الشاشة. */
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const G = window.GASERC;
    const hero = document.querySelector('.hero');
    const cv = document.querySelector('[data-tide]');
    if (cv && hero && cv.getContext) {
      const ctx = cv.getContext('2d');
      const css = getComputedStyle(document.documentElement);
      const col = n => css.getPropertyValue(n).trim();
      const LAYERS = [
        { c: col('--p-200'), a: 0.55, amp: 14, len: 520, sp: 0.00022, base: 0.30 },
        { c: col('--p-300'), a: 0.45, amp: 18, len: 380, sp: 0.00034, base: 0.48 },
        { c: col('--p-400'), a: 0.35, amp: 12, len: 260, sp: 0.00050, base: 0.66 },
      ];
      let W = 0, H = 0, dpr = 1, raf = 0, visible = true, t0 = performance.now();
      let px = -9999, py = 0, bump = 0, bumpT = 0, level = 0, levelT = 0;
      const size = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = cv.clientWidth; H = cv.clientHeight;
        cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      const draw = now => {
        const t = now - t0;
        bump += (bumpT - bump) * 0.08; level += (levelT - level) * 0.05;
        ctx.clearRect(0, 0, W, H);
        LAYERS.forEach((L, k) => {
          ctx.beginPath();
          const y0 = H * (L.base - level * 0.5);
          ctx.moveTo(0, H);
          for (let x = 0; x <= W; x += 8) {
            // RTL: الموجة تتقدّم من اليمين إلى اليسار
            const ph = (x + t * L.sp * 1000) / L.len * Math.PI * 2;
            const near = Math.exp(-Math.pow((x - px) / 140, 2)) * bump * (24 - k * 6);
            const y = y0 + Math.sin(ph) * L.amp + Math.sin(ph * 0.5 + k) * L.amp * 0.4 - near;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(W, H); ctx.closePath();
          ctx.globalAlpha = L.a; ctx.fillStyle = L.c; ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.fillStyle = col('--p-50'); ctx.fillRect(0, H - 2, W, 2);
      };
      const loop = now => { draw(now); raf = (visible && G.motionOn()) ? requestAnimationFrame(loop) : 0; };
      const start = () => { if (!raf && visible && G.motionOn()) raf = requestAnimationFrame(loop); };
      size(); draw(performance.now());
      new ResizeObserver(() => { size(); draw(performance.now()); }).observe(cv);
      new IntersectionObserver(es => { visible = es[0].isIntersecting; start(); }).observe(hero);
      window.addEventListener('gaserc:motion', e => { if (e.detail.on) start(); else draw(performance.now()); });
      hero.addEventListener('pointermove', e => {
        const r = cv.getBoundingClientRect();
        px = e.clientX - r.left; py = e.clientY - r.top; bumpT = 1;
      });
      hero.addEventListener('pointerleave', () => { bumpT = 0; });
      // المنسوب = عدد النتائج (حتى ٦٠) ⇒ البحث يرفع المدّ
      G.onSearch(s => { if (!s.ids) return; levelT = s.active ? Math.min(s.total, 60) / 60 : 0; if (!G.motionOn()) draw(performance.now()); });
      start();
    }

    // الرفّ: أزرار + سحب بالمؤشر + الكيبورد (بديل السحب SC 2.5.7)
    const shelf = document.querySelector('[data-shelf]');
    if (shelf) {
      const step = () => (shelf.querySelector('li')?.offsetWidth || 220) * 2;
      const go = dir => shelf.scrollBy({ left: dir * step(), behavior: G.motionOn() ? 'smooth' : 'auto' });
      // في RTL «التالي» نحو اليسار
      document.querySelector('[data-shelf-next]')?.addEventListener('click', () => go(-1));
      document.querySelector('[data-shelf-prev]')?.addEventListener('click', () => go(1));
      let down = false, sx = 0, sl = 0, moved = false;
      shelf.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = shelf.scrollLeft; });
      window.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; shelf.classList.add('dragging'); } shelf.scrollLeft = sl - dx; });
      window.addEventListener('pointerup', () => { down = false; shelf.classList.remove('dragging'); });
      shelf.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
      shelf.addEventListener('dragstart', e => e.preventDefault());
    }

    // تموّج عند وصول الطلب
    window.addEventListener('gaserc:requested', () => {
      const r = document.querySelector('.request');
      if (r && G.motionOn()) { r.classList.remove('ripple'); void r.offsetWidth; r.classList.add('ripple'); }
    });
  });
})();
