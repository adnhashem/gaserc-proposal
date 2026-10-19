/* Shared motion core for the four colourways. No library: a small spring integrator,
   an in-view helper, and the interactions every colourway shares (chips, tilt, forms, pause).
   Rules: content is visible without JS; only transform / opacity / filter / clip-path move;
   no autoplay longer than 5 s; reduced motion keeps colour and opacity, drops movement. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const rtl = getComputedStyle(root).direction === 'rtl';

  const FX = (window.FX = {
    get reduced() { return reduced.matches; },
    get fine() { return fine.matches; },
    rtl,
    paused: false,
    EASE_OUT: 'cubic-bezier(0.23, 1, 0.32, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.77, 0, 0.175, 1)',
    DUR: { press: 160, hover: 200, move: 260, enter: 700, stagger: 60 },
    // k = stiffness, c = damping, mass 1. Named in plan §17.
    SPRING: { lamp: { k: 120, c: 18 }, tilt: { k: 170, c: 20 }, float: { k: 90, c: 16 },
              magnet: { k: 300, c: 24 }, air: { k: 220, c: 15 }, count: { k: 220, c: 30 } },
    TILT_MAX: { cover: 7, big: 9, card: 6 },
    resets: [],
    get live() { return !this.paused && !this.reduced; },
  });

  /* ── spring: n-dimensional, retargetable, carries velocity through interruption ── */
  class Spring {
    constructor(cfg, init, onUpdate) {
      this.k = cfg.k; this.c = cfg.c;
      this.x = init.slice(); this.t = init.slice(); this.v = init.map(() => 0);
      this.on = onUpdate; this.raf = 0; this.last = 0;
      this.step = this.step.bind(this);
    }
    to(...t) { this.t = t; if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this.step); } }
    jump(...x) { cancelAnimationFrame(this.raf); this.raf = 0; this.x = x.slice(); this.t = x.slice(); this.v = x.map(() => 0); this.on(this.x); }
    step(now) {
      const dt = Math.min(0.032, (now - this.last) / 1000); this.last = now;
      let moving = false;
      for (let i = 0; i < this.x.length; i++) {
        const a = -this.k * (this.x[i] - this.t[i]) - this.c * this.v[i];
        this.v[i] += a * dt; this.x[i] += this.v[i] * dt;
        if (Math.abs(this.v[i]) > 0.01 || Math.abs(this.x[i] - this.t[i]) > 0.01) moving = true;
      }
      if (!moving) { this.x = this.t.slice(); this.v = this.v.map(() => 0); }
      this.on(this.x);
      this.raf = moving && !FX.paused ? requestAnimationFrame(this.step) : 0;
    }
  }
  FX.Spring = Spring;
  FX.spring = (name, init, onUpdate) => new Spring(FX.SPRING[name], init, onUpdate);

  /* ── helpers ── */
  FX.$ = (s, r = document) => r.querySelector(s);
  FX.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  FX.layer = (parent, cls, before = true) => {
    const el = document.createElement('div');
    el.className = 'fx-layer ' + cls; el.dataset.fx = ''; el.setAttribute('aria-hidden', 'true');
    before ? parent.prepend(el) : parent.append(el);
    return el;
  };
  FX.inView = (els, cb, { once = true, margin = '0px 0px -12% 0px' } = {}) => {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { cb(e.target); if (once) io.unobserve(e.target); }
    }), { rootMargin: margin });
    els.forEach((el) => io.observe(el));
    return io;
  };
  FX.isInViewport = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
  FX.onPause = (fn) => FX.resets.push(fn);
  FX.ease = (t) => 1 - Math.pow(1 - t, 3); // decelerating, for counters driven by time

  /* ── counter: final value is in the HTML; the animation only replays it ── */
  FX.count = (el, { duration = 900, delay = 0, spring = false } = {}) => {
    const final = el.textContent.trim();
    const target = parseInt(final.replace(/[^\d]/g, ''), 10);
    if (!Number.isFinite(target) || !FX.live) return;
    el.innerHTML = `<span class="fx-sr" data-fx>${final}</span><span aria-hidden="true" data-fx>0</span>`;
    const roll = el.lastChild;
    const show = (v) => { roll.textContent = String(Math.round(v)); };
    if (spring) {
      // critically damped: numbers never overshoot (data must not lie, even for a frame)
      show(0);
      setTimeout(() => { const s = FX.spring('count', [0], ([v]) => { show(Math.min(v, target)); if (v >= target - 0.5) el.textContent = final; }); s.to(target);
        FX.onPause(() => { s.jump(target); el.textContent = final; }); }, delay);
      return;
    }
    show(0);
    const t0 = performance.now() + delay;
    const tick = (now) => {
      if (FX.paused) { el.textContent = final; return; }
      const p = Math.min(1, Math.max(0, (now - t0) / duration));
      show(FX.ease(p) * target);
      if (p < 1) requestAnimationFrame(tick); else el.textContent = final;
    };
    requestAnimationFrame(tick);
  };

  /* ── chips: one clipped overlay draws the active chip, so fill and text move as one ── */
  FX.chips = ({ mode = 'ease', duration = FX.DUR.move } = {}) => {
    const wrap = FX.$('.chips'); if (!wrap) return;
    const chips = FX.$$('.chip', wrap);
    const over = wrap.cloneNode(true);
    over.className = 'fx-chips-on'; over.dataset.fx = ''; over.setAttribute('aria-hidden', 'true');
    over.querySelectorAll('a').forEach((a) => { a.removeAttribute('href'); a.tabIndex = -1; a.classList.remove('on'); });
    wrap.append(over); wrap.classList.add('fx-live');
    const box = (chip) => {
      const W = wrap.getBoundingClientRect(), r = chip.getBoundingClientRect();
      return [r.top - W.top, W.right - r.right, W.bottom - r.bottom, r.left - W.left];
    };
    const paint = ([t, r, b, l]) => { over.style.clipPath = `inset(${t}px ${r}px ${b}px ${l}px round 999px)`; };
    let current = chips.find((c) => c.classList.contains('on')) || chips[0];
    let spring = null;
    paint(box(current));
    chips.forEach((chip) => {
      chip.setAttribute('role', 'button');
      chip.setAttribute('aria-pressed', chip === current ? 'true' : 'false');
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        if (chip === current) return;
        const from = box(current), to = box(chip);
        current.classList.remove('on'); current.setAttribute('aria-pressed', 'false');
        chip.classList.add('on'); chip.setAttribute('aria-pressed', 'true');
        current = chip;
        if (!FX.live) { over.getAnimations().forEach((a) => a.cancel()); paint(to); return; }
        if (mode === 'spring') {
          spring = spring || FX.spring('air', from, paint);
          spring.to(...to);
        } else if (mode === 'liquid') {
          // stretch across both chips mid-way, then settle on the target
          const mid = from.map((v, i) => Math.min(v, to[i]));
          over.animate([{ clipPath: toInset(from) }, { clipPath: toInset(mid), offset: 0.5 }, { clipPath: toInset(to) }],
            { duration, easing: FX.EASE_IN_OUT }).finished.then(() => paint(to)).catch(() => {});
          paint(to);
        } else {
          over.animate([{ clipPath: toInset(from) }, { clipPath: toInset(to) }], { duration, easing: FX.EASE_OUT });
          paint(to);
        }
      });
    });
    const toInset = ([t, r, b, l]) => `inset(${t}px ${r}px ${b}px ${l}px round 999px)`;
    const settle = () => { if (spring) spring.jump(...box(current)); paint(box(current)); };
    addEventListener('resize', settle);
    document.fonts && document.fonts.ready.then(settle);
    if ('ResizeObserver' in window) new ResizeObserver(settle).observe(wrap);
    chips.forEach((chip) => chip.addEventListener('keydown', (e) => { if (e.key === ' ') { e.preventDefault(); chip.click(); } }));
  };

  /* ── tilt toward the pointer (decorative, fine pointers only) ── */
  FX.tilt = (area, target, { max = FX.TILT_MAX.cover, spring = 'tilt', lift = 0, glare = null, perspective = 800 } = {}) => {
    if (!area || !target) return;
    const s = FX.spring(spring, [0, 0, 0], ([rx, ry, z]) => {
      const tf = `perspective(${perspective}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(${(-z).toFixed(2)}px)`;
      target.style.transform = tf; if (glare && !target.contains(glare)) glare.style.transform = tf;
    });
    const move = (e) => {
      if (!FX.live || !FX.fine) return;
      const r = area.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      s.to(-ny * max, nx * max, lift);
      if (glare) { glare.style.setProperty('--gx', `${((nx + 1) * 50).toFixed(1)}%`); glare.style.setProperty('--gy', `${((ny + 1) * 50).toFixed(1)}%`); }
    };
    area.addEventListener('pointermove', move);
    area.addEventListener('pointerleave', () => s.to(0, 0, 0));
    FX.onPause(() => s.jump(0, 0, 0));
    return s;
  };

  /* glare layer aligned to an image inside a positioned host */
  FX.glare = (host, img, cls) => {
    host.style.position = 'relative';
    const g = FX.layer(host, 'fx-glare ' + (cls || ''), false);
    const fit = () => { g.style.left = img.offsetLeft + 'px'; g.style.top = img.offsetTop + 'px';
                        g.style.width = img.offsetWidth + 'px'; g.style.height = img.offsetHeight + 'px'; };
    fit(); img.complete || img.addEventListener('load', fit); addEventListener('resize', fit);
    return g;
  };

  /* ── request form: validation, loading, success; copy citation ── */
  const panel = FX.$('.panel');
  if (panel) {
    const btn = FX.$('.btn', panel), email = FX.$('#e', panel), name = FX.$('#n', panel);
    const say = (input, text) => {
      FX.$$('.fx-msg', panel).forEach((m) => m.remove());
      FX.$$('.fx-field-err', panel).forEach((m) => { m.classList.remove('fx-field-err'); m.removeAttribute('aria-invalid'); m.removeAttribute('aria-describedby'); });
      if (!input) return;
      const m = document.createElement('span'); m.className = 'fx-msg'; m.id = 'fx-msg-' + input.id; m.textContent = text;
      input.classList.add('fx-field-err'); input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', m.id);
      input.after(m); input.focus();
    };
    [name, email].forEach((input) => input.addEventListener('input', () => {
      if (input.classList.contains('fx-field-err')) say(null);
    }));
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-busy') === 'true') return;
      if (!name.value.trim()) return say(name, 'اكتب اسمك حتى نرسل لك النسخة باسمك.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return say(email, 'اكتب بريداً صحيحاً حتى يصلك الرقم المرجعي، مثل name@example.com');
      say(null);
      const label = btn.textContent; btn.style.minWidth = btn.offsetWidth + 'px';
      btn.setAttribute('aria-busy', 'true'); btn.textContent = 'جارٍ الإرسال…';
      setTimeout(() => {
        btn.removeAttribute('aria-busy'); btn.textContent = label;
        FX.$$('.fx-done', panel).forEach((m) => m.remove());
        const done = document.createElement('span'); done.className = 'fx-done'; done.setAttribute('role', 'status');
        done.textContent = 'وصل طلبك إلى وحدة البحوث. يصلك الرقم المرجعي على بريدك.';
        btn.after(done);
      }, 900);
    });
  }
  const cite = FX.$('.cite');
  if (cite) {
    const copy = FX.$$('.btn', cite).find((b) => b.textContent.includes('نسخ'));
    copy && copy.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await navigator.clipboard.writeText(FX.$('p', cite).textContent.trim()); } catch {}
      const label = copy.textContent; copy.style.minWidth = copy.offsetWidth + 'px';
      copy.innerHTML = `<span class="fx-swap is-out">${label}</span>`;
      requestAnimationFrame(() => { copy.innerHTML = '<span class="fx-swap">تم النسخ</span>'; });
      copy.setAttribute('aria-live', 'polite');
      clearTimeout(copy._t); copy._t = setTimeout(() => { copy.textContent = label; }, 1600);
    });
  }

  /* ── prototype pause control ── */
  const pp = FX.$('.proto-pill .pp-motion');
  const setPaused = (p) => {
    FX.paused = p; root.classList.toggle('fx-paused', p);
    if (pp) { pp.setAttribute('aria-pressed', String(p)); pp.textContent = p ? 'تشغيل الحركة' : 'إيقاف الحركة'; }
    if (p) { FX.resets.forEach((fn) => fn()); document.getAnimations().forEach((a) => { try { a.finish(); } catch { a.cancel(); } }); }
    try { sessionStorage.setItem('fx-paused', p ? '1' : '0'); } catch {}
  };
  FX.setPaused = setPaused;
  pp && pp.addEventListener('click', () => setPaused(!FX.paused));
  let stored = null; try { stored = sessionStorage.getItem('fx-paused'); } catch {}
  if (stored === '1') addEventListener('DOMContentLoaded', () => setPaused(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) FX.resets.forEach((fn) => fn()); });
})();
