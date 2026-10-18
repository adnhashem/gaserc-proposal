/* GASERC · المكتبة الرسمية بالأزرق · السلوك المشترك
   الحركة · الظهور · العدّ · البحث الحيّ (FR-001/002/012/013) · صفحة الإصدار (FR-003..006) · النشرة (FR-017)
   المنطق كله على المفاتيح (publication_type · availability_status) لا على النصوص — RULE #1 */
(() => {
  const PUBS = window.PUBS || [];
  const TYPE_LABEL = { study: 'دراسة', journal_issue: 'مجلة مستقبليات تربوية', scientific_report: 'تقرير علمي', dictionary: 'معجم' };
  const AVAIL = {
    downloadable: { label: 'متاح للتحميل', icon: 'ph-download-simple' },
    print_only:   { label: 'نسخة مطبوعة فقط', icon: 'ph-printer' },
    on_request:   { label: 'يُطلب من المركز', icon: 'ph-envelope-simple' },
    restricted:   { label: 'مقيّد', icon: 'ph-lock-simple' },
  };
  const params = new URLSearchParams(location.search);
  const DEMO_STATE = params.get('state');          // empty | loading | error
  const root = document.documentElement;
  if (DEMO_STATE) root.classList.add('state-' + DEMO_STATE);

  /* ── الحركة: SC 2.2.2 (إيقاف يدوي) + احترام prefers-reduced-motion ── */
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  let stored = null;
  try { stored = localStorage.getItem('gaserc-motion'); } catch (e) {}
  let motionOn = stored ? stored === 'on' : !mq.matches;
  const applyMotion = () => {
    root.classList.toggle('motion', motionOn);
    document.querySelectorAll('[data-motion-toggle]').forEach(b => {
      b.innerHTML = motionOn
        ? '<i class="ph ph-pause" aria-hidden="true"></i><span>إيقاف الحركة</span>'
        : '<i class="ph ph-play" aria-hidden="true"></i><span>تشغيل الحركة</span>';
    });
    window.dispatchEvent(new CustomEvent('gaserc:motion', { detail: { on: motionOn } }));
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-motion-toggle]');
    if (!b) return;
    motionOn = !motionOn;
    try { localStorage.setItem('gaserc-motion', motionOn ? 'on' : 'off'); } catch (err) {}
    applyMotion();
  });

  /* ── أدوات ── */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const normalize = s => String(s || '')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .toLowerCase().trim();
  PUBS.forEach(p => { p._n = normalize(p.title + ' ' + (p.year || '')); });
  const coverHTML = (p, cls = '') => p.cover
    ? `<div class="cover ${cls}"><img src="../_shared/img/covers/${p.id}.jpg" alt="" loading="lazy" decoding="async"></div>`
    : `<div class="cover ${cls}"><div class="cover-alt"><b>${esc(p.title)}</b><small>${TYPE_LABEL[p.type] || ''} · <span class="num">${p.year || ''}</span></small></div></div>`;
  const pubURL = p => `publication.html?id=${p.id}`;

  /* ── الظهور عند التمرير ── */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }) : null;
  const observeReveal = (scope = document) => {
    scope.querySelectorAll('[data-stagger]').forEach(g => [...g.querySelectorAll(':scope > [data-reveal]')].forEach((el, i) => el.style.setProperty('--i', i)));
    scope.querySelectorAll('[data-reveal]:not(.in)').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  };

  /* ── العدّ التصاعدي ── */
  const runCount = el => {
    const to = +el.dataset.count;
    if (!motionOn) { el.textContent = to.toLocaleString('en-US'); return; }
    const t0 = performance.now(), dur = 1200;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(en => { if (en.isIntersecting) { runCount(en.target); countIO.unobserve(en.target); } });
  }, { threshold: 0.6 }) : null;

  /* ── البحث الحيّ ── */
  const listeners = [];
  const onSearch = fn => listeners.push(fn);
  let state = { q: '', type: 'all' };
  const search = () => {
    const toks = normalize(state.q).split(/\s+/).filter(Boolean);
    return PUBS.filter(p => (state.type === 'all' || p.type === state.type) && toks.every(t => p._n.includes(t)));
  };
  const highlight = (title, q) => {
    const t = String(title), qq = q.trim();
    if (!qq) return esc(t);
    const i = t.indexOf(qq);
    if (i < 0) return esc(t);
    let a = i, b = i + qq.length;
    while (a > 0 && !/\s/.test(t[a - 1])) a--;
    while (b < t.length && !/[\s:،,.]/.test(t[b])) b++;
    return esc(t.slice(0, a)) + '<mark>' + esc(t.slice(a, b)) + '</mark>' + esc(t.slice(b));
  };
  // صيغة العدد العربية: نتيجة واحدة · نتيجتان · 3–10 نتائج · 11+ نتيجة
  const plural = n => n === 1 ? 'نتيجة واحدة' : n === 2 ? 'نتيجتان' : (n % 100 >= 3 && n % 100 <= 10) ? `<b class="num">${n}</b> نتائج` : `<b class="num">${n}</b> نتيجة`;
  const pluralTxt = n => plural(n).replace(/<[^>]+>/g, '');
  const initSearch = () => {
    const form = document.querySelector('[data-search-form]');
    if (!form) return;
    const input = form.querySelector('input[type=search]');
    const box = document.querySelector('[data-results]');
    const live = document.querySelector('[data-results-live]');
    const chips = document.querySelectorAll('[data-type]');
    let expanded = false, timer = null;
    const SUGG = ['رخص المعلمين', 'التقويم', 'التعليم في أثناء الأزمات', 'المحتوى الرقمي'];

    const render = () => {
      const has = state.q.trim().length > 0;
      const list = search();
      listeners.forEach(fn => fn({ q: state.q, type: state.type, ids: list.map(p => p.id), total: list.length, active: has || state.type !== 'all' }));
      const filtered = state.type !== 'all';
      if (!has && !filtered) { box.hidden = true; live.textContent = ''; return; }
      box.hidden = false;
      if (DEMO_STATE === 'loading') {
        box.innerHTML = `<div class="results-head"><span>جارٍ البحث…</span></div><div class="state-box" aria-busy="true">${'<div class="skel" style="height:56px;margin-bottom:12px"></div>'.repeat(3)}</div>`;
        return;
      }
      if (DEMO_STATE === 'error') {
        box.innerHTML = `<div class="state-box error" role="alert"><h3>تعذّر البحث الآن</h3><p>حدث خلل مؤقت من جهتنا. ما كتبته محفوظ في الحقل.</p><div class="row"><button class="btn btn-primary" data-retry>إعادة المحاولة</button><a class="btn btn-ghost" href="#latest">تصفّح أحدث الإصدارات</a></div></div>`;
        box.querySelector('[data-retry]').onclick = () => { history.replaceState(null, '', location.pathname); location.reload(); };
        live.textContent = 'تعذّر البحث الآن';
        return;
      }
      if (!list.length) {
        box.innerHTML = `<div class="state-box"><h3>لا توجد نتائج لـ«${esc(state.q)}»</h3><p>جرّب كلمة أقصر أو موضوعاً قريباً، أو ابحث في كل الأنواع.</p><div class="sugg">${SUGG.map(s => `<button type="button" data-sugg="${esc(s)}">${esc(s)}</button>`).join('')}</div><div class="row"><a class="btn btn-ghost" href="#latest">تصفّح كل الإصدارات</a></div></div>`;
        box.querySelectorAll('[data-sugg]').forEach(b => b.onclick = () => { input.value = b.dataset.sugg; state.q = input.value; setType('all'); render(); input.focus(); });
        live.textContent = 'لا توجد نتائج';
        return;
      }
      const shown = expanded ? list.slice(0, 40) : list.slice(0, 6);
      box.innerHTML = `<div class="results-head"><span>${plural(list.length)}${filtered ? ' · ' + ({ study: 'دراسات', journal_issue: 'مستقبليات تربوية', scientific_report: 'تقارير علمية' }[state.type] || '') : ''}</span><button type="button" class="results-clear" style="border:0;background:none;color:var(--p-700);cursor:pointer;font-weight:700">مسح</button></div>
        <ol>${shown.map(p => `<li data-availability="${p.avail}"><a href="${pubURL(p)}"><span class="r-thumb">${p.cover ? `<img src="../_shared/img/covers/${p.id}.jpg" alt="" loading="lazy">` : ''}</span><span><span class="r-title" dir="auto">${highlight(p.title, state.q)}</span><span class="r-meta">${TYPE_LABEL[p.type]} · <span class="num">${p.year || 'بلا سنة'}</span></span></span><span class="avail"><i class="ph ${AVAIL[p.avail].icon}" aria-hidden="true"></i>${AVAIL[p.avail].label}</span></a></li>`).join('')}</ol>
        ${list.length > shown.length ? `<button type="button" class="results-more">عرض كل النتائج (<span class="num">${list.length}</span>)</button>` : ''}`;
      box.querySelector('.results-clear').onclick = () => { input.value = ''; state.q = ''; expanded = false; setType('all'); render(); input.focus(); };
      const more = box.querySelector('.results-more');
      if (more) more.onclick = () => { expanded = true; render(); };
      live.textContent = pluralTxt(list.length);
    };
    const setType = t => {
      state.type = t;
      chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.type === t)));
    };
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { state.q = input.value; expanded = false; render(); }, 240); });
    input.addEventListener('keydown', e => { if (e.key === 'Escape') { input.value = ''; state.q = ''; render(); } });
    form.addEventListener('submit', e => {
      e.preventDefault();
      state.q = input.value; render();
      const first = box.querySelector('ol a');
      if (first) first.focus();
    });
    chips.forEach(c => c.addEventListener('click', () => { setType(c.dataset.type); render(); }));
    input.addEventListener('focus', () => listeners.forEach(fn => fn({ focus: true })));
    input.addEventListener('blur', () => listeners.forEach(fn => fn({ focus: false })));
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-pick]');
      if (!a) return;
      e.preventDefault();
      const t = a.dataset.pick;
      const known = [...chips].some(c => c.dataset.type === t);
      setType(known ? t : 'all');
      render();
      if (!known && t !== 'all') {
        const NAMES = { dictionary: 'المعاجم الخمسة', conference_proceedings: 'أوراق المؤتمرات' };
        box.hidden = false;
        box.innerHTML = `<div class="state-box"><h3>${NAMES[t] || 'هذا النوع'}</h3><p>تظهر هنا بعد ترحيلها إلى المكتبة. يضم النموذج الدراسات وأعداد المجلة والتقارير، 179 إصداراً مفهرساً.</p><div class="row"><button type="button" class="btn btn-ghost" data-show-all>اعرض الدراسات</button></div></div>`;
        box.querySelector('[data-show-all]').onclick = () => { setType('study'); render(); };
        live.textContent = (NAMES[t] || '') + ' تظهر بعد الترحيل';
      }
      const top = document.getElementById('top');
      if (top) top.scrollIntoView({ behavior: motionOn ? 'smooth' : 'auto', block: 'start' });
      input.focus({ preventScroll: true });
    });
    if (DEMO_STATE === 'empty') { input.value = 'علم الفلك'; state.q = input.value; setTimeout(render, 400); }
  };

  /* ── صفحة الإصدار ── */
  const initPub = () => {
    const page = document.querySelector('[data-pub]');
    if (!page) return;
    const id = +(params.get('id') || 181);
    const p = PUBS.find(x => x.id === id) || PUBS.find(x => x.id === 181);
    const access = ['downloadable', 'print_only', 'on_request', 'restricted'].includes(params.get('access')) ? params.get('access') : p.avail;
    document.title = p.title + ' · المركز العربي للبحوث التربوية لدول الخليج';
    const set = (k, v) => document.querySelectorAll(`[data-f="${k}"]`).forEach(el => el.textContent = v);
    set('title', p.title); set('kind', TYPE_LABEL[p.type]); set('year', p.year || 'بلا سنة');
    set('pages', p.pages ? p.pages + ' صفحة' : 'غير محدد');
    set('crumb-type', { study: 'الدراسات والأبحاث', journal_issue: 'مجلة مستقبليات تربوية', scientific_report: 'التقارير العلمية' }[p.type]);
    const cov = document.querySelector('[data-f="cover"]');
    if (cov) cov.outerHTML = coverHTML(p, 'pub-cover-img');
    page.dataset.year = p.year || '';
    page.dataset.type = p.type;
    // الملخص: متوفّر لهذا الإصدار في النموذج فقط — غيره حالة «جزئي»: يُخفى القسم لا يُعرض فارغاً
    if (p.id !== 181) document.querySelectorAll('[data-abstract]').forEach(el => el.hidden = true);
    // الإتاحة — المنطق على المفتاح
    const box = document.querySelector('[data-access]');
    box.dataset.availability = access;
    const A = AVAIL[access];
    const TEXT = {
      downloadable: 'ملف PDF من موقع المركز، يُحمَّل مباشرة.',
      print_only: 'متوفّرة ورقياً في مكتبة المركز بالشامية. تواصل معنا لترتيب الاطلاع.',
      on_request: 'أرسل طلبك وتصلك نسخة إلكترونية مع رقم مرجعي لمتابعته.',
      restricted: 'هذا الإصدار مقيّد بقرار من المركز ولا يتاح للعموم.',
    };
    const ACT = {
      downloadable: '<button type="button" class="btn btn-primary" data-dl><i class="ph ph-download-simple" aria-hidden="true"></i>حمّل الدراسة</button>',
      print_only: '<a class="btn btn-primary" href="#contact">تواصل معنا</a>',
      on_request: '<a class="btn btn-primary" href="#request">اطلب نسخة</a>',
      restricted: '',
    };
    box.innerHTML = `<span class="avail"><i class="ph ${A.icon}" aria-hidden="true"></i>${A.label}</span><p>${TEXT[access]}</p>${ACT[access] ? `<div class="acts">${ACT[access]}</div>` : ''}<p class="dl-note" hidden style="font-size:.875rem">في الموقع الفعلي يبدأ التحميل هنا.</p>`;
    const dl = box.querySelector('[data-dl]');
    if (dl) dl.onclick = () => box.querySelector('.dl-note').hidden = false;
    document.querySelectorAll('[data-request]').forEach(el => el.hidden = access !== 'on_request');
    // الاستشهاد
    const citeTxt = `المركز العربي للبحوث التربوية لدول الخليج. (${p.year || 'د.ت'}). ${p.title}. الكويت: المركز العربي للبحوث التربوية لدول الخليج.`;
    const cq = document.querySelector('[data-cite-text]');
    if (cq) cq.textContent = citeTxt;
    const cb = document.querySelector('[data-cite-copy]');
    if (cb) cb.onclick = async () => {
      try { await navigator.clipboard.writeText(citeTxt); } catch (e) {}
      const old = cb.innerHTML;
      cb.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i>نُسخ الاستشهاد';
      cb.classList.add('copied');
      setTimeout(() => { cb.innerHTML = old; cb.classList.remove('copied'); }, 2000);
    };
    const ce = document.querySelector('[data-cite-export]');
    if (ce) ce.onclick = () => {
      const ris = `TY  - BOOK\nTI  - ${p.title}\nAU  - المركز العربي للبحوث التربوية لدول الخليج\nPY  - ${p.year || ''}\nPB  - المركز العربي للبحوث التربوية لدول الخليج\nCY  - الكويت\nER  - \n`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ris], { type: 'application/x-research-info-systems' }));
      a.download = `gaserc-${p.id}.ris`; a.click();
    };
    // ذات صلة
    const rel = document.querySelector('[data-related]');
    if (rel) {
      const pool = PUBS.filter(x => x.id !== p.id && x.type === p.type).sort((a, b) => Math.abs((a.year || 0) - (p.year || 0)) - Math.abs((b.year || 0) - (p.year || 0)) || (b.cover - a.cover));
      rel.innerHTML = pool.slice(0, 4).map(x => (window.GASERC_RELATED || defaultRelated)(x)).join('');
    }
    initRequest(p);
  };
  const defaultRelated = x => `<a class="rel" href="${pubURL(x)}" data-availability="${x.avail}" data-reveal>${coverHTML(x)}<span class="rel-k">${TYPE_LABEL[x.type]} · <span class="num">${x.year || ''}</span></span><b>${esc(x.title)}</b><span class="avail"><i class="ph ${AVAIL[x.avail].icon}" aria-hidden="true"></i>${AVAIL[x.avail].label}</span></a>`;

  const initRequest = p => {
    const f = document.querySelector('[data-request-form]');
    if (!f) return;
    const errOf = el => el.closest('.field').querySelector('.err');
    const check = el => {
      let m = '';
      if (el.name === 'name' && el.value.trim().length < 2) m = 'اكتب اسمك كما تريده في الطلب.';
      if (el.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim())) m = 'اكتب بريداً إلكترونياً صحيحاً، مثل name@example.com';
      if (el.name === 'org' && !el.value) m = 'اختر جهتك.';
      el.setAttribute('aria-invalid', m ? 'true' : 'false');
      errOf(el).textContent = m;
      return !m;
    };
    f.querySelectorAll('input,select').forEach(el => el.addEventListener('blur', () => el.value && check(el)));
    f.addEventListener('submit', e => {
      e.preventDefault();
      const els = [...f.querySelectorAll('input,select')];
      const ok = els.map(check).every(Boolean);
      const fe = f.querySelector('.form-err');
      fe.textContent = '';
      if (!ok) { els.find(el => el.getAttribute('aria-invalid') === 'true').focus(); return; }
      const btn = f.querySelector('button[type=submit]');
      btn.disabled = true; btn.setAttribute('aria-disabled', 'true'); btn.textContent = 'جارٍ الإرسال…';
      setTimeout(() => {
        if (DEMO_STATE === 'error') {
          btn.disabled = false; btn.removeAttribute('aria-disabled'); btn.textContent = 'أرسل الطلب';
          fe.textContent = 'تعذّر إرسال الطلب الآن. ما كتبته محفوظ، حاول مرة أخرى بعد قليل.';
          return;
        }
        const ref = 'GSR-' + (p.year || 2026) + '-' + String(p.id).padStart(4, '0');
        const done = document.createElement('div');
        done.className = 'done'; done.setAttribute('role', 'status'); done.tabIndex = -1;
        done.innerHTML = `<h3><i class="ph ph-check-circle" aria-hidden="true"></i> وصل طلبك</h3><p>رقم طلبك المرجعي:</p><p class="ref">${ref}</p><p class="note">ستصلك رسالة على بريدك خلال خمسة أيام عمل.</p>`;
        f.replaceWith(done); done.focus();
        window.dispatchEvent(new CustomEvent('gaserc:requested'));
      }, 900);
    });
  };

  /* ── النشرة (FR-017) ── */
  const initNewsletter = () => {
    document.querySelectorAll('[data-newsletter]').forEach(f => f.addEventListener('submit', e => {
      e.preventDefault();
      const em = f.querySelector('input[type=email]'), c = f.querySelector('input[type=checkbox]'), msg = f.querySelector('.msg');
      msg.className = 'msg';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim())) { msg.classList.add('err'); msg.textContent = 'اكتب بريداً إلكترونياً صحيحاً.'; em.setAttribute('aria-invalid', 'true'); em.focus(); return; }
      em.setAttribute('aria-invalid', 'false');
      if (!c.checked) { msg.classList.add('err'); msg.textContent = 'وافق على استلام النشرة أولاً.'; c.focus(); return; }
      msg.classList.add('ok'); msg.textContent = 'شكراً. أرسلنا رسالة تأكيد إلى بريدك.';
      f.reset();
    }));
  };

  /* ── القائمة على الجوال ── */
  const initMenu = () => {
    const b = document.querySelector('[data-menu]'), n = document.querySelector('.mainnav');
    if (!b || !n) return;
    b.addEventListener('click', () => { const o = n.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); });
  };

  /* ── الفرصة: الأيام المتبقية ── */
  const initDeadline = () => document.querySelectorAll('[data-deadline]').forEach(el => {
    const d = Math.ceil((new Date(el.dataset.deadline + 'T23:59:59+03:00') - Date.now()) / 864e5);
    el.textContent = d > 0 ? d : 0;
  });

  window.GASERC = { PUBS, TYPE_LABEL, AVAIL, normalize, coverHTML, pubURL, esc, onSearch, observeReveal, motionOn: () => motionOn, params, DEMO_STATE };

  document.addEventListener('DOMContentLoaded', () => {
    applyMotion();
    observeReveal();
    document.querySelectorAll('[data-count]').forEach(el => { if (motionOn && countIO) { el.textContent = '0'; countIO.observe(el); } else runCount(el); });
    initSearch(); initPub(); initNewsletter(); initMenu(); initDeadline();
  });
})();
