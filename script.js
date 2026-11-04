/* ==========================================================================
   GH COCINAS Y CLOSETS · script.js
   Sin librerías externas: todo el motor de animación es propio, así la
   página se ve completa aunque ninguna CDN responda.
   ========================================================================== */
(() => {
  'use strict';

  window.__ghBoot = true;
  const html = document.documentElement;
  html.classList.add('js');

  /* ───────────────────────────────────────────────────────────────────────
     CONFIGURACIÓN · el número de WhatsApp vive SOLO aquí.
     Formato: 52 + 10 dígitos. Si queda vacío, los botones y el envío de
     WhatsApp se ocultan con elegancia.
     ─────────────────────────────────────────────────────────────────────── */
  const WHATSAPP_NUMBER = '526572887570';

  /* ═══ Utilidades ═══ */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const io = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const mq = (q) => window.matchMedia(q);
  const RM = mq('(prefers-reduced-motion: reduce)').matches;
  const FINE = mq('(hover: hover) and (pointer: fine)').matches;
  const onMq = (m, fn) => (m.addEventListener ? m.addEventListener('change', fn) : m.addListener(fn));
  const safe = (nombre, fn) => {
    try { return fn(); } catch (e) { if (window.console) console.warn('[GH] ' + nombre, e); return undefined; }
  };

  /* ═══ WhatsApp ═══ */
  const DIGITS = String(WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const HAS_WA = DIGITS.length >= 10;
  const waUrl = (text) => 'https://wa.me/' + DIGITS + (text ? '?text=' + encodeURIComponent(text) : '');
  const fmtPhone = () => { const d = DIGITS.slice(-10); return d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6); };

  function initWhatsApp() {
    $$('[data-wa]').forEach((a) => {
      if (!HAS_WA) { a.hidden = true; return; }
      a.href = waUrl(a.getAttribute('data-wa'));
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    $$('[data-tel]').forEach((a) => { if (HAS_WA) a.href = 'tel:+' + DIGITS; else a.hidden = true; });
    if (HAS_WA) $$('[data-wa-text]').forEach((el) => { el.textContent = fmtPhone(); });
    else {
      const send = $('.cfg__send'); if (send) send.hidden = true;
      $$('.contact__list').forEach((l) => { l.hidden = true; });
    }
    // Globo del botón flotante: aparece una vez, a los pocos segundos
    const fl = $('#waFloat');
    if (fl && HAS_WA && !RM) {
      setTimeout(() => { fl.classList.add('is-tip'); setTimeout(() => fl.classList.remove('is-tip'), 5200); }, 7000);
    }
  }

  /* ═══ Cargador: puertas de gabinete que se abren (≤ 2.5 s) ═══ */
  function initLoader(onOpen) {
    const loader = $('#loader');
    if (!loader) { html.classList.add('is-ready'); onOpen(); return; }
    const bar = $('#loaderBar');
    const pct = $('#loaderPct');
    const DUR = RM ? 250 : 1350;
    let opened = false;
    let closed = false;
    const close = () => { if (closed) return; closed = true; loader.classList.add('is-done'); };
    const open = () => {
      if (opened) return;
      opened = true;
      if (bar) bar.style.transform = 'scaleX(1)';
      if (pct) pct.textContent = '100';
      loader.classList.add('is-open');
      html.classList.add('is-ready');
      onOpen();
      setTimeout(close, RM ? 60 : 800);
    };
    const t0 = performance.now();
    const tick = (now) => {
      if (opened) return;
      const t = clamp((now - t0) / DUR);
      const v = io(t);
      if (bar) bar.style.transform = 'scaleX(' + v.toFixed(3) + ')';
      if (pct) pct.textContent = String(Math.round(v * 100));
      if (t < 1) requestAnimationFrame(tick); else open();
    };
    requestAnimationFrame(tick);
    setTimeout(open, DUR + 250);  // respaldo si el navegador pausa rAF
    setTimeout(close, 2300);      // tope absoluto: nunca pasa de 2.5 s
  }

  /* ═══ Aparición al hacer scroll ═══ */
  function initReveal() {
    const els = $$('.rv');
    if (!els.length) return;
    if (RM || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting && en.boundingClientRect.top >= 0) return; // por debajo: aún no toca
        const el = en.target;
        obs.unobserve(el);
        el.classList.add('is-in');
        const d = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
        // al terminar la transición se suelta la clase para no interferir con hover/tilt
        setTimeout(() => el.classList.remove('rv', 'is-in'), (d + 1.4) * 1000);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.05 });
    els.forEach((e) => obs.observe(e));
  }

  /* ═══ Menú móvil ═══ */
  function initMenu() {
    const hdr = $('#hdr'); const burger = $('#burger'); const nav = $('#nav');
    if (!hdr || !burger || !nav) return;
    $$('a:not(.btn)', nav).forEach((a, i) => a.style.setProperty('--i', i));
    const set = (open) => {
      hdr.classList.toggle('is-menu', open);
      html.classList.toggle('no-scroll', open);
      burger.setAttribute('aria-expanded', String(open));
      const sr = $('.sr', burger); if (sr) sr.textContent = open ? 'Cerrar menú' : 'Abrir menú';
    };
    burger.addEventListener('click', () => set(!hdr.classList.contains('is-menu')));
    $$('a', nav).forEach((a) => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && hdr.classList.contains('is-menu')) { set(false); burger.focus(); }
    });
    onMq(mq('(min-width: 900px)'), (e) => { if (e.matches) set(false); });
  }

  /* ═══ Palabras que se encienden con el scroll (manifiesto) ═══ */
  function splitWords(root) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = tok;
            frag.appendChild(s);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    walk(root);
    return $$('.w', root);
  }

  /* ═══ Gabinete 3D del hero (se arma, se ilumina y se desarma en bucle) ═══ */
  const PARTS = [
    { m: 'white', w: 240, h: 314, d: 4, x: 0, y: -3, z: -46, ez: -150, cls: 'back' },
    { m: 'none', w: 236, h: 300, d: 1, x: 0, y: -3, z: -43, ez: -110, cls: 'wash' },
    { m: 'black', w: 250, h: 16, d: 84, x: 0, y: 162, z: -2, ey: 130 },
    { m: 'wood', w: 10, h: 314, d: 96, x: -125, y: -3, z: 0, ex: -135 },
    { m: 'wood', w: 10, h: 314, d: 96, x: 125, y: -3, z: 0, ex: 135 },
    { m: 'wood', w: 260, h: 10, d: 96, x: 0, y: -165, z: 0, ey: -150 },
    { m: 'white', w: 8, h: 314, d: 84, x: 30, y: -3, z: -2, ey: -30, ez: 50 },
    { m: 'chrome', w: 140, h: 6, d: 6, x: -47, y: -130, z: 0, ey: -50, ez: 100 },
    { m: 'chrome', w: 140, h: 6, d: 6, x: -47, y: -20, z: 0, ey: -10, ez: 120 },
    { m: 'white', w: 86, h: 6, d: 80, x: 77, y: -110, z: -2, ex: 30, ey: -40, ez: 90 },
    { m: 'white', w: 86, h: 6, d: 80, x: 77, y: -55, z: -2, ex: 30, ey: -20, ez: 110 },
    { m: 'white', w: 86, h: 6, d: 80, x: 77, y: 0, z: -2, ex: 30, ey: 0, ez: 130 },
    { m: 'sand', w: 86, h: 44, d: 78, x: 77, y: 40, z: -2, ex: 30, ey: 10, ez: 150, cls: 'drawer' },
    { m: 'sand', w: 86, h: 44, d: 78, x: 77, y: 86, z: -2, ex: 30, ey: 25, ez: 185, cls: 'drawer' },
    { m: 'sand', w: 86, h: 44, d: 78, x: 77, y: 132, z: -2, ex: 30, ey: 40, ez: 220, cls: 'drawer' },
    { m: 'led', w: 232, h: 3, d: 6, x: 0, y: -157, z: 38, ey: -70, ez: 120, cls: 'led' },
    { m: 'led', w: 3, h: 300, d: 3, x: 25, y: -3, z: 38, ez: 130, cls: 'led' },
  ];
  const DOORS = [
    { x: -130, y: -8, z: 53, dir: -1, w: 159, ex: -110, ez: 200, cls: 'door--l' },
    { x: 130, y: -8, z: 53, dir: 1, w: 99, ex: 110, ez: 200, cls: 'door--r' },
  ];

  function buildCabinet(host) {
    const cab = document.createElement('div');
    cab.className = 'cab';
    const floor = document.createElement('div');
    floor.className = 'floor';
    floor.innerHTML = '<i class="floor__glow"></i><i class="floor__ring"></i><i class="floor__sh"></i>';
    cab.appendChild(floor);
    const faces = ['fr', 'bk', 'lf', 'rt', 'tp', 'bt'];
    const mk = (p) => {
      const el = document.createElement('div');
      el.className = 'box m-' + p.m + (p.cls ? ' ' + p.cls : '');
      el.style.cssText = '--w:' + p.w + ';--h:' + p.h + ';--d:' + p.d + ';--x:' + (p.x || 0) + ';--y:' + (p.y || 0) + ';--z:' + (p.z || 0) +
        ';--ex:' + (p.ex || 0) + ';--ey:' + (p.ey || 0) + ';--ez:' + (p.ez || 0);
      faces.forEach((f) => { const i = document.createElement('i'); i.className = 'f f--' + f; el.appendChild(i); });
      return el;
    };
    PARTS.forEach((p) => cab.appendChild(mk(p)));
    DOORS.forEach((d) => {
      const pv = document.createElement('div');
      pv.className = 'pivot';
      pv.style.cssText = '--x:' + d.x + ';--y:' + d.y + ';--z:' + d.z + ';--ex:' + d.ex + ';--ey:0;--ez:' + d.ez + ';--dir:' + d.dir;
      pv.appendChild(mk({ m: 'wood', w: d.w, h: 324, d: 9, x: d.dir < 0 ? d.w / 2 : -d.w / 2, y: 0, z: 0, cls: 'door ' + d.cls }));
      cab.appendChild(pv);
    });
    host.appendChild(cab);
    return cab;
  }

  const PERIOD = 13.6;
  function timeline(tt) {
    const t = tt % PERIOD;
    const e = t < 10.8 ? 1 - io(seg(t, 1.0, 3.6)) : io(seg(t, 10.8, 12.6));
    const o = io(seg(t, 3.9, 5.6)) * (1 - io(seg(t, 8.2, 9.6)));
    const led = clamp(seg(t, 4.3, 5.8) * (1 - seg(t, 8.4, 9.8)));
    let step; let txt;
    if (t < 1 || t >= 10.8) { step = '01'; txt = 'Piezas a tu medida'; }
    else if (t < 3.8) { step = '02'; txt = 'Ensamble preciso'; }
    else if (t < 9.6) { step = '03'; txt = 'Luz y orden por dentro'; }
    else { step = '04'; txt = 'Listo para estrenar'; }
    return { e, o, led, step, txt, p: t / PERIOD };
  }

  /* ═══ Brasas (partículas ámbar) ═══ */
  function makeEmbers(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    let w = 0; let h = 0;
    const N = window.innerWidth < 700 ? 34 : 64;
    const ps = [];
    const mouse = { x: -999, y: -999 };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (p, anywhere) => {
      p.x = Math.random() * w; p.y = anywhere ? Math.random() * h : h + 12;
      p.r = 0.6 + Math.random() * 1.9; p.vy = 0.14 + Math.random() * 0.5; p.vx = (Math.random() - 0.5) * 0.14;
      p.a = 0.25 + Math.random() * 0.65; p.ph = Math.random() * 6.283; p.tw = 0.6 + Math.random() * 1.6;
    };
    resize();
    for (let i = 0; i < N; i++) { const p = {}; spawn(p, true); ps.push(p); }
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); }, { passive: true });
    return {
      pointer(x, y) { mouse.x = x; mouse.y = y; },
      draw(t) {
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < ps.length; i++) {
          const p = ps[i];
          p.y -= p.vy; p.x += p.vx + Math.sin(t * p.tw + p.ph) * 0.2;
          const dx = p.x - mouse.x; const dy = p.y - mouse.y; const d2 = dx * dx + dy * dy;
          if (d2 < 14000) { const f = (1 - d2 / 14000) * 1.6; const d = Math.sqrt(d2) || 1; p.x += (dx / d) * f; p.y += (dy / d) * f; }
          if (p.y < -12 || p.x < -12 || p.x > w + 12) spawn(p, false);
          const a = p.a * (0.55 + 0.45 * Math.sin(t * p.tw * 2 + p.ph));
          ctx.fillStyle = 'rgba(255,190,90,' + (a * 0.16).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4.2, 0, 6.283); ctx.fill();
          ctx.fillStyle = 'rgba(255,224,160,' + a.toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        }
      },
      clear() { ctx.clearRect(0, 0, w, h); },
    };
  }

  /* ═══ Hero: controla gabinete 3D + brasas ═══ */
  const heroState = { p: 0 };
  function initHero() {
    const hero = $('#inicio'); const cam = $('#cabCam');
    if (!hero || !cam) return { start() {} };
    const cab = buildCabinet(cam);
    const hudStep = $('#hudStep'); const hudTxt = $('#hudTxt'); const hudBar = $('#hudBar');
    const canvas = $('#embers');
    const embers = canvas && !RM ? safe('brasas', () => makeEmbers(canvas)) : null;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    let started = false; let visible = true; let raf = 0; let t0 = 0; let lastStep = '';

    const pose = (k, t) => {
      const amp = 22 + k.e * 10;
      const ry = Math.sin(t * 0.48) * amp + ptr.x * 16 + heroState.p * 38;
      const rx = -12 + ptr.y * 5 + heroState.p * 10 - k.e * 3;
      cab.style.setProperty('--e', k.e.toFixed(4));
      cab.style.setProperty('--o', k.o.toFixed(4));
      cab.style.setProperty('--led', k.led.toFixed(4));
      cab.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      cab.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      if (hudBar) hudBar.style.setProperty('--hb', k.p.toFixed(3));
      if (k.step !== lastStep) {
        lastStep = k.step;
        if (hudStep) hudStep.textContent = k.step;
        if (hudTxt) hudTxt.textContent = k.txt;
      }
    };

    // Estado inicial: todo desarmado (justo antes de que arranque el ensamble)
    pose(timeline(0), 0);

    const frame = (now) => {
      raf = 0;
      if (!started || !visible || document.hidden) return;
      const t = (now - t0) / 1000;
      ptr.x += (ptr.tx - ptr.x) * 0.06;
      ptr.y += (ptr.ty - ptr.y) * 0.06;
      pose(timeline(t), t);
      if (embers) embers.draw(t);
      raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf && started && visible && !document.hidden) raf = requestAnimationFrame(frame); };

    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      ptr.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (embers) embers.pointer(e.clientX - r.left, e.clientY - r.top);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { ptr.tx = 0; ptr.ty = 0; if (embers) embers.pointer(-999, -999); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', kick);

    return {
      start() {
        if (started) return;
        started = true;
        if (RM) { // sin movimiento: gabinete armado, puertas entreabiertas y luz encendida
          pose({ e: 0, o: 0.55, led: 1, step: '03', txt: 'Luz y orden por dentro', p: 0.5 }, 0);
          cab.style.setProperty('--ry', '-18deg');
          return;
        }
        t0 = performance.now();
        kick();
      },
    };
  }

  /* ═══ Motor de scroll: una sola rueda, escenas suavizadas ═══ */
  const S = { y: 0, vh: window.innerHeight, vw: window.innerWidth, vel: 0, last: 0 };
  const scenes = [];
  let rafScroll = 0;
  const request = () => { if (!rafScroll) rafScroll = requestAnimationFrame(frameScroll); };
  function frameScroll() {
    rafScroll = 0;
    S.y = window.pageYOffset || document.documentElement.scrollTop || 0;
    S.vh = window.innerHeight; S.vw = window.innerWidth;
    S.vel = S.y - S.last; S.last = S.y;
    let more = false;
    for (let i = 0; i < scenes.length; i++) { if (safe('escena ' + i, () => scenes[i](S))) more = true; }
    if (more || Math.abs(S.vel) > 0.4) request();
  }

  // Barra de progreso, cabecera (sólida / oculta / tono según sección)
  function sceneChrome() {
    const progress = $('#progress'); const hdr = $('#hdr');
    const tones = $$('[data-tone]').filter((el) => el !== hdr);
    let lastY = 0;
    return (st) => {
      const max = Math.max(1, document.documentElement.scrollHeight - st.vh);
      if (progress) progress.style.setProperty('--sp', clamp(st.y / max).toFixed(4));
      if (!hdr) return false;
      hdr.classList.toggle('is-solid', st.y > 40);
      const dy = st.y - lastY;
      if (!hdr.classList.contains('is-menu')) {
        if (st.y > 320 && dy > 6) hdr.classList.add('is-hide');
        else if (dy < -4 || st.y < 200) hdr.classList.remove('is-hide');
      }
      lastY = st.y;
      for (let i = 0; i < tones.length; i++) {
        const r = tones[i].getBoundingClientRect();
        if (r.top <= 38 && r.bottom > 38) { if (hdr.dataset.tone !== tones[i].dataset.tone) hdr.dataset.tone = tones[i].dataset.tone; break; }
      }
      return false;
    };
  }

  // Parallax de salida del hero
  function sceneHero() {
    const hero = $('#inicio');
    if (!hero) return () => false;
    let cur = 0; let written = -1;
    return (st) => {
      if (RM) return false;
      const target = clamp(st.y / (hero.offsetHeight * 0.9));
      cur += (target - cur) * 0.14;
      if (Math.abs(target - cur) < 0.0008) cur = target;
      if (cur !== written) {
        written = cur;
        heroState.p = cur;
        hero.style.setProperty('--hp', cur.toFixed(4));
      }
      return cur !== target;
    };
  }

  // Manifiesto: las palabras se encienden (solo hacia delante, para que el texto nunca se "apague")
  function sceneWords() {
    const el = $('[data-words]');
    if (!el) return () => false;
    const words = splitWords(el);
    if (RM) { words.forEach((w) => w.classList.add('on')); return () => false; }
    let shown = 0;
    return (st) => {
      if (shown >= words.length) return false;
      const r = el.getBoundingClientRect();
      if (r.top > st.vh) return false;
      let n;
      if (r.bottom < 0) n = words.length;
      else n = Math.ceil(clamp((st.vh * 0.88 - r.top) / (st.vh * 0.45 + r.height * 0.75)) * words.length * 1.04);
      n = Math.min(n, words.length);
      for (let i = shown; i < n; i++) words[i].classList.add('on');
      if (n > shown) shown = n;
      return false;
    };
  }

  // Showroom: la imagen se abre de marco pequeño a pantalla completa
  function sceneExpand() {
    const sec = $('#showroom'); const stage = sec && $('.expand__stage', sec);
    if (!sec || !stage) return () => false;
    let cur = RM ? 1 : 0; let written = -1;
    const apply = () => {
      if (cur === written) return;
      written = cur;
      stage.style.setProperty('--e', cur.toFixed(4));
      stage.style.setProperty('--t', clamp((cur - 0.7) / 0.3).toFixed(4));
    };
    apply();
    if (RM) return () => false;
    return (st) => {
      const r = sec.getBoundingClientRect();
      const target = io(clamp((st.vh * 0.55 - r.top) / (st.vh * 1.1)));
      cur += (target - cur) * 0.12;
      if (Math.abs(target - cur) < 0.0008) cur = target;
      apply();
      return cur !== target;
    };
  }

  // Por dentro: las puertas del closet se abren con el scroll y se enciende la luz
  function sceneDoor() {
    const grid = $('.inside__grid'); const door = $('#door3d');
    if (!grid || !door) return () => false;
    let cur = RM ? 0.7 : 0; let written = -1;
    const apply = () => {
      if (cur === written) return;
      written = cur;
      door.style.setProperty('--o', io(seg(cur, 0.06, 0.52)).toFixed(4));
      door.style.setProperty('--led', clamp((cur - 0.38) / 0.3).toFixed(4));
    };
    apply();
    if (RM) return () => false;
    return (st) => {
      const r = grid.getBoundingClientRect();
      const total = Math.max(1, r.height - st.vh * 0.9);
      const target = clamp((st.vh * 0.42 - r.top) / total);
      cur += (target - cur) * 0.1;
      if (Math.abs(target - cur) < 0.0008) cur = target;
      apply();
      return cur !== target;
    };
  }

  // Proceso: la tira LED se llena y cada paso se enciende
  function sceneSteps() {
    const wrap = $('#steps');
    if (!wrap) return () => false;
    const steps = $$('.step', wrap);
    if (RM) { steps.forEach((s) => s.classList.add('on')); wrap.style.setProperty('--sf', '1'); return () => false; }
    let cur = 0; let written = -1;
    return (st) => {
      const r = wrap.getBoundingClientRect();
      const line = st.vh * 0.6;
      const target = clamp((line - r.top) / r.height);
      cur += (target - cur) * 0.14;
      if (Math.abs(target - cur) < 0.0008) cur = target;
      if (cur !== written) { written = cur; wrap.style.setProperty('--sf', cur.toFixed(4)); }
      steps.forEach((s) => {
        if (s.classList.contains('on')) return;
        if (s.getBoundingClientRect().top + 40 < line) s.classList.add('on');
      });
      return cur !== target;
    };
  }

  // Marquesina: se inclina según la velocidad del scroll
  function sceneMarquee() {
    const track = $('.marquee__track');
    if (!track || RM) return () => false;
    let sk = 0;
    return (st) => {
      const target = clamp(-st.vel * 0.12, -9, 9);
      sk += (target - sk) * 0.12;
      if (Math.abs(sk) < 0.02 && Math.abs(target) < 0.02) { sk = 0; }
      track.style.setProperty('--sk', sk.toFixed(2) + 'deg');
      return Math.abs(sk) > 0.02;
    };
  }

  // Pie: la palabra gigante sube al entrar
  function sceneFooter() {
    const word = $('.ftr__word');
    const ftr = $('.ftr');
    if (!word || !ftr || RM) return () => false;
    let written = -1;
    return (st) => {
      const r = ftr.getBoundingClientRect();
      if (r.top > st.vh * 1.2) return false;
      const p = clamp((st.vh - r.top) / (st.vh * 0.7));
      if (p !== written) { written = p; word.style.setProperty('--fp', p.toFixed(3)); }
      return false;
    };
  }

  /* ═══ Especialidades: paneles que se expanden (escritorio) ═══ */
  function initSpec() {
    const list = $('#specList');
    if (!list) return;
    const cards = $$('.scard', list);
    const desk = mq('(min-width: 900px)'); // mismo punto de quiebre que el CSS de los paneles
    let idx = 0; let paused = false; let inView = false;
    const set = (i) => { idx = i; cards.forEach((c, k) => c.classList.toggle('is-active', k === i)); };
    cards.forEach((c, i) => {
      c.addEventListener('pointerenter', (e) => { if (desk.matches && e.pointerType === 'mouse') set(i); });
      c.addEventListener('focus', () => { if (desk.matches) set(i); });
      c.addEventListener('click', () => { if (desk.matches) set(i); });
    });
    list.addEventListener('pointerenter', () => { paused = true; });
    list.addEventListener('pointerleave', () => { paused = false; });
    list.addEventListener('focusin', () => { paused = true; });
    list.addEventListener('focusout', () => { paused = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { inView = en.isIntersecting; }).observe(list);
    if (!RM) setInterval(() => { if (desk.matches && inView && !paused && !document.hidden) set((idx + 1) % cards.length); }, 5200);
  }

  /* ═══ Spotlight de luz (sección LED) ═══ */
  function initSpot() {
    const spot = $('#spot'); const frame = spot && $('.spot__frame', spot);
    if (!spot || !frame) return;
    const img = $('#spotImg'); const ph = $('.spot__ph', frame); const btnAll = $('#lightAll');
    let px = 50; let py = 40; let tx = 50; let ty = 40; let hover = false; let vis = false; let raf = 0;
    const t0 = performance.now();
    const paint = () => { frame.style.setProperty('--mx', px.toFixed(2) + '%'); frame.style.setProperty('--my', py.toFixed(2) + '%'); };
    const loop = (now) => {
      raf = 0;
      if (!vis || document.hidden) return;
      const t = (now - t0) / 1000;
      if (!hover && !RM) { tx = 50 + Math.sin(t * 0.55) * 30; ty = 42 + Math.sin(t * 0.37 + 1.2) * 26; }
      px += (tx - px) * 0.08; py += (ty - py) * 0.08;
      paint();
      raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf && vis) raf = requestAnimationFrame(loop); };
    paint();
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { vis = en.isIntersecting; kick(); }).observe(frame);
    document.addEventListener('visibilitychange', kick);
    frame.addEventListener('pointermove', (e) => {
      const r = frame.getBoundingClientRect();
      hover = true;
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      kick();
    }, { passive: true });
    frame.addEventListener('pointerleave', () => { hover = false; });

    $$('.scene').forEach((b) => {
      b.addEventListener('click', () => {
        if (b.classList.contains('is-on')) return;
        $$('.scene').forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); });
        frame.classList.add('is-swap');
        setTimeout(() => {
          const done = () => frame.classList.remove('is-swap');
          img.addEventListener('load', done, { once: true });
          img.src = b.dataset.src;
          img.alt = b.dataset.alt || '';
          if (ph && b.dataset.pos) ph.style.setProperty('--op', b.dataset.pos);
          setTimeout(done, 900);
        }, 280);
      });
    });
    if (btnAll) {
      btnAll.addEventListener('click', () => {
        const on = !spot.classList.contains('is-all');
        spot.classList.toggle('is-all', on);
        btnAll.setAttribute('aria-pressed', String(on));
        const label = $('span', btnAll); if (label) label.textContent = on ? 'Volver a la linterna' : 'Encender todo';
      });
    }
  }

  /* ═══ Galería: filtros + visor ═══ */
  function initGallery() {
    const grid = $('#masonry');
    if (!grid) return;
    const items = $$('.gi', grid);
    const btns = $$('.fbtn');
    // aparición escalonada al hacer scroll (las clases se sueltan solas al terminar)
    items.forEach((it, i) => { it.classList.add('rv'); it.style.setProperty('--d', ((i % 3) * 0.09).toFixed(2) + 's'); });
    btns.forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      btns.forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
      let n = 0;
      items.forEach((it) => {
        const show = f === 'all' || it.dataset.cat === f;
        it.hidden = !show;
        if (!show) return;
        it.style.setProperty('--d', (n++ * 0.05).toFixed(2) + 's');
        it.classList.remove('is-shown');
        void it.offsetWidth; // reinicia la animación
        it.classList.add('is-shown');
      });
    }));

    const lb = $('#lb'); const lbImg = $('#lbImg'); const lbPh = $('#lbPh');
    const lbCap = $('#lbCap'); const lbCount = $('#lbCount'); const lbCta = $('#lbCta');
    const close = $('#lbClose'); const prev = $('#lbPrev'); const next = $('#lbNext');
    if (!lb) return;
    let list = []; let cur = 0; let last = null; let hideT = 0;

    const show = (i) => {
      cur = (i + list.length) % list.length;
      const it = list[cur]; const src = $('img', it);
      const w = Number(it.dataset.w) || 4; const h = Number(it.dataset.h) || 5;
      const wm = it.dataset.wm === '1';
      lbPh.style.setProperty('--ar', (w / (h * (wm ? 0.932 : 1))).toFixed(4));
      lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
      lbImg.src = src.getAttribute('src');
      lbImg.alt = src.alt;
      lbCap.textContent = it.dataset.cap || '';
      lbCount.textContent = (cur + 1) + ' / ' + list.length;
      if (HAS_WA && lbCta) lbCta.href = waUrl('Hola GH Cocinas y Closets, vi este proyecto en su página: «' + (it.dataset.cap || '') + '». Me gustaría algo parecido para mi casa.');
    };
    const openLb = (it) => {
      list = items.filter((x) => !x.hidden);
      last = document.activeElement;
      clearTimeout(hideT);
      lb.hidden = false;
      show(list.indexOf(it));
      void lb.offsetWidth;
      lb.classList.add('is-open');
      html.classList.add('no-scroll');
      close.focus();
    };
    const closeLb = () => {
      lb.classList.remove('is-open');
      html.classList.remove('no-scroll');
      hideT = setTimeout(() => { lb.hidden = true; }, 380);
      if (last && last.focus) last.focus();
    };
    items.forEach((it) => it.addEventListener('click', () => openLb(it)));
    close.addEventListener('click', closeLb);
    prev.addEventListener('click', () => show(cur - 1));
    next.addEventListener('click', () => show(cur + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') show(cur - 1);
      else if (e.key === 'ArrowRight') show(cur + 1);
      else if (e.key === 'Tab') {
        const f = $$('button, a[href]', lb).filter((el) => !el.hidden);
        if (!f.length) return;
        const first = f[0]; const lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    });
    let sx = 0;
    lb.addEventListener('touchstart', (e) => { sx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ═══ Preguntas frecuentes ═══ */
  function initFaq() {
    const items = $$('.fitem');
    if (!items.length) return;
    const setOpen = (it, open) => {
      it.classList.toggle('is-open', open);
      const q = $('.fq', it); const a = $('.fa > div', it);
      if (q) q.setAttribute('aria-expanded', String(open));
      if (a) a.inert = !open;
    };
    items.forEach((it) => {
      setOpen(it, false);
      $('.fq', it).addEventListener('click', () => {
        const open = !it.classList.contains('is-open');
        items.forEach((o) => { if (o !== it) setOpen(o, false); });
        setOpen(it, open);
      });
    });
  }

  /* ═══ Configurador de proyecto → WhatsApp ═══ */
  function initConfigurator() {
    const form = $('#cfg');
    if (!form) return;
    const FIN = { nogal: ['Nogal', '#7A4A2B'], roble: ['Roble claro', '#D3BC9C'], arena: ['Arena', '#A69583'], blanco: ['Blanco mate', '#EFECE6'], grafito: ['Grafito', '#4A4540'] };
    const TIPOS = { cocina: 'Cocina', closet: 'Closet', vestidor: 'Vestidor', tv: 'Mueble de TV' };
    const preview = $('.cfg__preview', form); const tag = $('#cfgTag');
    const val = (name) => { const c = form.querySelector('input[name="' + name + '"]:checked'); return c ? c.value : ''; };
    const update = () => {
      const t = val('tipo'); const f = val('acabado');
      if (preview && FIN[f]) preview.style.setProperty('--fin', FIN[f][1]);
      $$('.pv', form).forEach((s) => s.classList.toggle('is-on', s.classList.contains('pv--' + t)));
      if (tag) tag.textContent = 'Vista de referencia · ' + (TIPOS[t] || '') + ' · ' + (FIN[f] ? FIN[f][0] : '');
    };
    form.addEventListener('change', update);
    update();

    const nombre = $('#f-nombre'); const err = $('#err-nombre'); const idea = $('#f-idea');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const n = nombre.value.trim();
      if (n.length < 2) {
        err.hidden = false; nombre.setAttribute('aria-invalid', 'true'); nombre.setAttribute('aria-describedby', 'err-nombre'); nombre.focus();
        return;
      }
      err.hidden = true; nombre.removeAttribute('aria-invalid');
      if (!HAS_WA) return;
      const t = val('tipo'); const f = val('acabado');
      const msg = 'Hola GH Cocinas y Closets, soy ' + n + '.\n' +
        'Quiero cotizar: ' + (TIPOS[t] || 'un proyecto a la medida') + '.\n' +
        'Acabado que me inspira: ' + (FIN[f] ? FIN[f][0] : 'por definir') + '.\n' +
        (idea.value.trim() ? 'Mi idea: ' + idea.value.trim() + '\n' : '') +
        '¿Podemos platicar?';
      const w = window.open(waUrl(msg), '_blank');
      if (w) { try { w.opener = null; } catch (err2) { /* nada */ } } else { window.location.href = waUrl(msg); }
    });
    nombre.addEventListener('input', () => { if (nombre.value.trim().length >= 2) { err.hidden = true; nombre.removeAttribute('aria-invalid'); } });
  }

  /* ═══ Detalles de pulido: tilt, botones magnéticos y cursor ═══ */
  function initTilt() {
    if (!FINE || RM) return;
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5; const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 7).toFixed(2) + 'deg) rotateY(' + (px * 9).toFixed(2) + 'deg)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
  function initMagnet() {
    if (!FINE || RM) return;
    $$('.btn--lg, .hdr__cta').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2); const dy = e.clientY - (r.top + r.height / 2);
        b.style.transform = 'translate3d(' + clamp(dx * 0.18, -9, 9).toFixed(1) + 'px,' + clamp(dy * 0.28, -7, 7).toFixed(1) + 'px,0)';
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }
  function initCursor() {
    const c = $('#cursor');
    if (!c || !FINE || RM) return;
    const dot = $('span', c);
    c.classList.add('is-hidden');
    let x = -100; let y = -100; let cx = x; let cy = y; let raf = 0;
    const tick = () => {
      cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
      c.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.2 ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      c.classList.remove('is-hidden');
      if (!raf) raf = requestAnimationFrame(tick);
      const t = e.target && e.target.closest ? e.target : null;
      const view = t && t.closest('.gi');
      const link = t && t.closest('a, button, .fq, label, .scard, input, textarea');
      c.classList.toggle('is-view', Boolean(view));
      c.classList.toggle('is-link', Boolean(link) && !view);
      if (dot) dot.textContent = view ? 'Ver' : '';
    }, { passive: true });
    document.addEventListener('mouseleave', () => c.classList.add('is-hidden'));
  }

  /* ═══ Arranque ═══ */
  function boot() {
    safe('whatsapp', initWhatsApp);
    safe('menu', initMenu);
    const hero = safe('hero', initHero) || { start() {} };
    safe('spec', initSpec);
    safe('spot', initSpot);
    safe('galeria', initGallery);
    safe('faq', initFaq);
    safe('configurador', initConfigurator);
    safe('tilt', initTilt);
    safe('magnet', initMagnet);
    safe('cursor', initCursor);

    [sceneChrome, sceneHero, sceneWords, sceneExpand, sceneDoor, sceneSteps, sceneMarquee, sceneFooter].forEach((mk) => {
      const fn = safe(mk.name, mk);
      if (typeof fn === 'function') scenes.push(fn);
    });
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    window.addEventListener('load', request);
    request();

    initLoader(() => {
      safe('reveal', initReveal);
      hero.start();
      request();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
