// Particle-portrait cover: the avatar drawn as a halftone of dots on a hex grid, framed in a
// rounded square. Dots scatter from the pointer and spring home; a click sends them streaming
// into the lines of the intro, where they melt into the text as it forms.
(() => {
  const cover = document.querySelector('.intro-cover');
  if (!cover) return;
  // The cover always starts a visit from the top, so don't let a reload restore an old scroll
  // position behind it (the photos would come in off screen)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  const canvas = cover.querySelector('.intro-cover__canvas');
  const btn = cover.querySelector('.intro-cover__btn');
  const ctx = canvas.getContext('2d');
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const REACH = 80;      // px around the pointer that dots flee
  const FORCE = 3.2;     // push at the pointer's centre
  const SPRING = .055;   // pull back home
  const DAMP = .84;      // velocity kept each frame
  const STREAK = 12;     // longest tail a moving dot draws, in px
  const INTRO_FOR = 900;    // ms each dot takes to settle on load
  const FLY_FOR = 1000;     // ms a dot takes to travel from the portrait to its line of text
  const PARA_GAP = 480;     // ms between paragraphs setting off
  const LAUNCH_SPREAD = 160; // ms over which one paragraph's dots set off, so each stream stays together
  const MELT_FOR = 380;     // ms a dot takes to fade out once it lands, as its text fades in
  const PHOTO_GAP = 280;    // ms between the carousel's photos appearing, after the text
  const SCOOT_FOR = 900;    // ms the centred text takes to slide over to its place (desktop)
  const TRAVELLERS = .35;   // share of the dots that fly to the text; the rest dissolve in place
  const DISSOLVE_FOR = 420; // ms the staying dots take to fade out

  let dots = [], pointer = { x: -1e4, y: -1e4 }, state = 'sealed', raf = 0, flowStart = 0, introStart = 0;
  let w = 0, h = 0, dpr = 1;

  // A soft bubble click for each dot the pointer brushes, with a haptic tick on touch devices
  // that support it. Browsers keep a page silent until the visitor clicks, taps or presses a key
  // (hovering doesn't count), and a tap on the portrait opens the page, so the sound button is the
  // way to hear the pops before going in.
  const TOUCH = 18;       // px from the pointer that counts as touching a dot
  const POP_GAP = 45;     // ms between pops, so a sweep patters instead of buzzing
  const BUZZ_GAP = 70;    // ms between vibration ticks on phones that support them (Android)
  const audio = window.AudioContext && new AudioContext();
  const soundBtn = document.querySelector('.sound-toggle');
  let pop = null, chime = null, lastPop = 0, lastBuzz = 0, muted = false;
  const load = url => fetch(url).then(r => r.arrayBuffer()).then(b => audio.decodeAudioData(b));
  const play = (buf, volume, rate = 1) => {
    const src = audio.createBufferSource(), gain = audio.createGain();
    src.buffer = buf; src.playbackRate.value = rate; gain.gain.value = volume;
    src.connect(gain).connect(audio.destination);
    src.start();
  };
  if (audio) {
    load('/assets/audio/dot-pop.mp3').then(buf => { pop = buf; }).catch(() => {});
    load('/assets/audio/open-sound.mp3').then(buf => { chime = buf; }).catch(() => {});
    const unlock = () => { if (!muted && audio.state === 'suspended') audio.resume(); };
    // iPhones only let audio start from a tap or click (not a finger landing or a drag), so try
    // on every kind of gesture, and again whenever it has been suspended since
    ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(type => addEventListener(type, unlock, { passive: true }));
    // The label always tells the truth: "Sound on" only while sound can actually play. Until a
    // first tap the browser holds it back, so it starts as "Sound off" and flips on by itself
    // when a tap anywhere wakes the audio (unless the visitor muted it here)
    const isOn = () => !muted && audio.state === 'running';
    const label = () => {
      soundBtn.setAttribute('aria-pressed', isOn());
      soundBtn.textContent = isOn() ? 'Sound on' : 'Sound off';
    };
    audio.addEventListener('statechange', label);
    label();
    // Read the state as the tap starts: the page-wide wake-up above runs on the same gesture,
    // before this click arrives, and would otherwise make an "off" tap look like an "on" one
    let wasOn = false;
    const noteState = () => { wasOn = isOn(); };
    soundBtn.addEventListener('pointerdown', noteState);
    soundBtn.addEventListener('keydown', noteState);
    soundBtn.addEventListener('click', () => {
      muted = wasOn;
      if (!muted) audio.resume();
      label();
    });
  } else {
    soundBtn.hidden = true;
  }
  // The same pop greets the pointer on each link in the intro (the companies, Connect, email),
  // so the page keeps the feel of the dots once it's open
  document.querySelectorAll('.intro-text a').forEach(link => link.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse' || muted || !pop || !audio || audio.state !== 'running') return;
    play(pop, .3, .9 + Math.random() * .3);
  }));

  // ...and on each photo the carousel brings to the front as it's swiped (the carousel marks the
  // front card .is-active; watching for that keeps the two scripts apart)
  const frontCardPop = new MutationObserver(records => {
    if (!body.classList.contains('intro-open') || muted || !pop || !audio || audio.state !== 'running') return;
    if (records.some(r => r.target.classList.contains('is-active') && !(r.oldValue || '').includes('is-active'))) {
      play(pop, .28, .9 + Math.random() * .3);
    }
  });
  document.querySelectorAll('.intro-carousel__card').forEach(card =>
    frontCardPop.observe(card, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }));

  function patter(t, touched, touch) {
    if (!touched || t - lastPop < POP_GAP) return;
    lastPop = t;
    // each pop a slightly different pitch, a touch louder when a sweep catches several dots
    if (!muted && pop && audio.state === 'running') play(pop, Math.min(.5, .18 + touched * .04), .85 + Math.random() * .45);
    if (touch && navigator.vibrate && t - lastBuzz > BUZZ_GAP) { lastBuzz = t; navigator.vibrate(10); }
  }

  // Carousel cards hold back their shadow and shading until their photo animates in
  document.querySelectorAll('.intro-carousel__card').forEach(card => card.classList.add('is-waiting'));

  const img = new Image();
  img.src = '/assets/images/avatar-particles.jpg';

  // Is (x, y) inside a rounded square of side s centred on (cx, cy)?
  function inFrame(x, y, cx, cy, s, r) {
    const dx = Math.max(Math.abs(x - cx) - (s / 2 - r), 0), dy = Math.max(Math.abs(y - cy) - (s / 2 - r), 0);
    return Math.abs(x - cx) <= s / 2 && Math.abs(y - cy) <= s / 2 && dx * dx + dy * dy <= r * r;
  }

  function build(assemble) {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const box = btn.getBoundingClientRect(), s = box.width, cx = box.left + s / 2, cy = box.top + s / 2;
    const gap = s / 56, rowH = gap * Math.sqrt(3) / 2, rMax = gap * .36;

    // sample the portrait's brightness at grid resolution
    const n = Math.ceil(s / gap) + 2, sample = document.createElement('canvas');
    sample.width = sample.height = n;
    const sctx = sample.getContext('2d', { willReadFrequently: true });
    // frame in on the face: a square crop of the photo's upper right
    const crop = img.naturalWidth / 512;
    sctx.drawImage(img, 96 * crop, 8 * crop, 416 * crop, 416 * crop, 0, 0, n, n);
    const px = sctx.getImageData(0, 0, n, n).data;
    // a blurred copy gives each spot's surroundings, for an unsharp-mask boost to local detail
    sctx.filter = 'blur(3px)';
    sctx.drawImage(sample, 0, 0);
    const soft = sctx.getImageData(0, 0, n, n).data;
    const at = (data, x, y) => {
      const i = (Math.min(n - 1, Math.max(0, Math.round(x))) + Math.min(n - 1, Math.max(0, Math.round(y))) * n) * 4;
      return (.2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2]) / 255;
    };
    const lum = (x, y) => { const v = at(px, x, y); return v + 1.4 * (v - at(soft, x, y)); };

    const old = dots, cells = [];
    for (let row = 0, y = cy - s / 2 + gap / 2; y < cy + s / 2; row++, y += rowH) {
      for (let x = cx - s / 2 + gap / 2 + (row % 2 ? gap / 2 : 0); x < cx + s / 2; x += gap) {
        if (inFrame(x, y, cx, cy, s, s * .18)) cells.push({ x, y, l: lum((x - cx + s / 2) / gap, (y - cy + s / 2) / gap) });
      }
    }
    // Equalise: size each dot by how bright it is relative to the rest of the portrait, so the
    // face's mid-tones spread across the full range instead of being lost against the pale wall
    const ranked = cells.map(c => c.l).sort((a, b) => a - b);
    const rank = l => { let lo = 0, hi = ranked.length; while (lo < hi) { const m = (lo + hi) >> 1; ranked[m] < l ? lo = m + 1 : hi = m; } return lo / ranked.length; };
    dots = [];
    for (const c of cells) {
      const l = Math.pow(rank(c.l), .8);  // brighter means a bigger dot
      if (l < .05) continue;
      const size = rMax * (.18 + .82 * l);
      const d = { hx: c.x, hy: c.y, x: c.x, y: c.y, vx: 0, vy: 0, r: size, size };
      if (assemble) {  // each dot grows in a few px from home, a beat after its neighbours
        const a = Math.random() * Math.PI * 2, k = 4 + Math.random() * 8;
        Object.assign(d, { ix: Math.cos(a) * k, iy: Math.sin(a) * k, delay: Math.random() * 500, r: 0 });
      }
      dots.push(d);
    }
    if (assemble) { state = 'intro'; introStart = performance.now(); }
    else if (old.length) wake();
  }

  function step() {
    const t = performance.now();
    let moving = false;
    if (state === 'intro') {
      // Calm entrance: dots ease into place from just beside home while growing to full size
      let done = true;
      for (const d of dots) {
        const p = Math.min(1, Math.max(0, (t - introStart - d.delay) / INTRO_FOR));
        const e = 1 - Math.pow(1 - p, 3);
        d.x = d.hx + d.ix * (1 - e); d.y = d.hy + d.iy * (1 - e); d.r = d.size * e;
        if (p < 1) done = false;
      }
      if (done) state = 'sealed';
      moving = !done;
    } else if (state === 'flow') {
      // The portrait dissolves; the dots chosen to carry it over dim while they wait their turn,
      // then each arcs to its spot on a line of text and fades out there as the text resolves
      const el = t - flowStart;
      for (const d of dots) {
        if (!d.travels) {
          d.a = 1 - Math.min(1, Math.max(0, (el - d.delay) / DISSOLVE_FOR));
          if (d.a > 0) moving = true;
          continue;
        }
        const p = Math.min(1, Math.max(0, (el - d.delay) / d.dur));
        const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2, u = 1 - e;
        const x = u * u * d.fx + 2 * u * e * d.cx + e * e * d.tx, y = u * u * d.fy + 2 * u * e * d.cy + e * e * d.ty;
        d.vx = x - d.x; d.vy = y - d.y; d.x = x; d.y = y;
        const melt = Math.min(1, Math.max(0, (el - d.delay - d.dur) / MELT_FOR));
        // shrink toward a fleck on the way, then fade out where it lands rather than vanish
        d.r = d.size * (1 - .55 * e);
        const waiting = el < d.delay ? Math.min(1, el / DISSOLVE_FOR) * .55 : 0;
        d.a = (1 - waiting) * (1 - melt * (2 - melt));
        if (melt < 1) moving = true;
      }
    } else {
      let touched = 0;
      for (const d of dots) {
        const dx = d.x - pointer.x, dy = d.y - pointer.y, dist = Math.hypot(dx, dy);
        // a dot counts as touched once until it has had time to settle back
        if (dist < TOUCH && !(t - d.touched < 600)) { d.touched = t; touched++; }
        if (dist < REACH && dist > .01) {
          const f = (1 - dist / REACH) * FORCE;
          d.vx += dx / dist * f; d.vy += dy / dist * f;
        }
        d.vx = (d.vx + (d.hx - d.x) * SPRING) * DAMP;
        d.vy = (d.vy + (d.hy - d.y) * SPRING) * DAMP;
        d.x += d.vx; d.y += d.vy;
        if (Math.abs(d.vx) + Math.abs(d.vy) > .02 || Math.abs(d.hx - d.x) + Math.abs(d.hy - d.y) > .05) moving = true;
      }
      patter(t, touched, pointer.touch);
    }
    draw();
    raf = moving ? requestAnimationFrame(step) : 0;
  }

  // Still dots are drawn as discs; moving ones stretch into short streaks along their path
  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round';
    // dots fade in steps of a tenth so each step is drawn in one batch
    for (let step = 10; step > 0; step--) {
      const pick = d => d.r > .1 && Math.ceil((d.a ?? 1) * 10) === step;
      ctx.globalAlpha = .92 * step / 10;
      ctx.beginPath();
      for (const d of dots) {
        if (pick(d) && Math.abs(d.vx) + Math.abs(d.vy) < .6) { ctx.moveTo(d.x + d.r, d.y); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); }
      }
      ctx.fill();
      for (const d of dots) {
        const speed = Math.abs(d.vx) + Math.abs(d.vy);
        if (pick(d) && speed >= .6) {
          const k = Math.min(2.2, STREAK / speed);  // tail grows with speed, up to STREAK px
          ctx.beginPath();
          ctx.lineWidth = d.r * 1.7;
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.vx * k, d.y - d.vy * k);
          ctx.stroke();
        }
      }
    }
  }


  const wake = () => { if (!raf) raf = requestAnimationFrame(step); };

  addEventListener('pointermove', e => {
    if (state !== 'sealed' || reduce.matches) return;
    pointer = { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' };
    wake();
  });
  const away = () => { pointer = { x: -1e4, y: -1e4 }; wake(); };
  document.documentElement.addEventListener('pointerleave', away);
  addEventListener('blur', away);
  // a finger lifting is the touch version of the pointer leaving
  ['pointerup', 'pointercancel'].forEach(type => addEventListener(type, e => { if (e.pointerType !== 'mouse') away(); }));

  // Only a real tap on the portrait goes in: a finger that moved more than a few px was
  // playing with the dots, so the click it may still produce is ignored
  let press = null;
  btn.addEventListener('pointerdown', e => { press = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, type: e.pointerType }; });
  addEventListener('pointermove', e => { if (press) press.moved = Math.max(press.moved, Math.hypot(e.clientX - press.x, e.clientY - press.y)); });
  const isTap = () => !press || press.type === 'mouse' || (press.moved < 10 && performance.now() - press.t < 600);

  // Where each line of the intro will sit, per paragraph: the text's line boxes
  function textLines() {
    return [...document.querySelectorAll('.intro-text > p')].map(p => {
      const range = document.createRange();
      range.selectNodeContents(p);
      // only lines on screen take dots; anything below the fold just fades in on its turn
      return { p, rects: [...range.getClientRects()].filter(r => r.width > 2 && r.height > 2 && r.top >= 0 && r.bottom <= innerHeight) };
    });
  }

  function open() {
    if (state !== 'sealed' && state !== 'intro') return;
    for (const d of dots) { d.r = d.size; }
    cover.classList.add('scatter');
    // the click itself lets the page make sound: wake the audio here even if the opening sound
    // hasn't finished downloading, so the pops after it (links, swipes) can play
    if (audio && !muted) { audio.resume(); if (chime) play(chime, .3); }
    scrollTo(0, 0);
    // Side by side (desktop), the intro streams in centred on the screen and then slides over to
    // its place on the right, making room for the photos to slide in last. Stacked (phones), the
    // photos sit above the text and arrive with its first paragraph.
    const carousel = document.querySelector('.intro-carousel'), textBox = document.querySelector('.intro-text');
    const stacked = !carousel || !textBox || carousel.getBoundingClientRect().bottom <= textBox.getBoundingClientRect().top;
    if (!stacked && !reduce.matches) {
      const r = textBox.getBoundingClientRect();
      textBox.style.transition = 'none';
      textBox.style.translate = `${Math.round(innerWidth / 2 - (r.left + r.width / 2))}px 0`;
      textBox.getBoundingClientRect();  // apply it before the lines are measured below
      carousel.style.setProperty('--enter-x', '-120px');
      carousel.style.setProperty('--enter-y', '0px');
    }
    const paras = textLines();
    const reveal = () => { body.classList.add('intro-open'); body.classList.remove('intro-covered'); };
    if (reduce.matches || !paras.some(para => para.rects.length)) {
      state = 'done'; cover.classList.add('gone'); reveal();
      document.querySelectorAll('.intro-carousel__card').forEach(card => card.classList.remove('is-waiting'));
      return;
    }
    state = 'flow';

    // Share the dots out by how much text each line holds; the portrait's top rows feed the first
    // paragraph and its bottom rows the last, so the picture pours down into the page in order
    const lines = paras.flatMap((para, pi) => para.rects.map(r => ({ r, pi })));
    const total = lines.reduce((sum, l) => sum + l.r.width, 0);
    // a third of the dots carry the portrait into the text; the rest dissolve where they are
    for (const d of dots) {
      d.vx = d.vy = 0;
      d.travels = Math.random() < TRAVELLERS;
      if (!d.travels) d.delay = Math.random() * DISSOLVE_FOR;
    }
    const order = dots.filter(d => d.travels).sort((a, b) => a.hy - b.hy || a.hx - b.hx);
    let k = 0;
    lines.forEach((line, li) => {
      const count = li === lines.length - 1 ? order.length - k : Math.round(order.length * line.r.width / total);
      for (const d of order.slice(k, k + count)) {
        const tx = line.r.left + Math.random() * line.r.width;
        const ty = line.r.top + line.r.height * (.35 + Math.random() * .4);  // the x-height band
        // bow each path a little to one side so the streams curve rather than run straight
        const mx = (d.x + tx) / 2, my = (d.y + ty) / 2, len = Math.hypot(tx - d.x, ty - d.y) || 1;
        const bow = (Math.random() - .3) * len * .35;
        Object.assign(d, {
          fx: d.x, fy: d.y, tx, ty,
          cx: mx + (ty - d.y) / len * bow, cy: my - (tx - d.x) / len * bow,
          delay: line.pi * PARA_GAP + Math.random() * LAUNCH_SPREAD,
          dur: FLY_FOR * (.8 + Math.random() * .4),
        });
      }
      k += count;
    });

    // Each paragraph sharpens out of its blur just as its dots land and melt in
    // the text starts to resolve as the paragraph's first dots land, and is clear as the last ones fade
    paras.forEach((para, pi) => { para.p.style.transitionDelay = `${pi * PARA_GAP + FLY_FOR * .85}ms`; });

    // The photos follow one by one, front card first, then the nearest neighbours (the cards
    // stacked highest), and finally the dots under them. Side by side they wait for the text to
    // finish and slide across, then slide in from the left behind it. Stacked, they start the
    // moment the first paragraph's dots set off, so the top of the screen isn't left empty
    // while the text streams in below.
    let textDone = 100, photoGap = PHOTO_GAP * .7;
    if (!stacked) {
      const textClear = (paras.length - 1) * PARA_GAP + FLY_FOR * .85 + 650;
      setTimeout(() => {
        textBox.style.transition = `translate ${SCOOT_FOR}ms cubic-bezier(.65, 0, .35, 1)`;
        textBox.style.translate = '0px 0';
      }, textClear);
      textDone = textClear + SCOOT_FOR * .7;  // once the text has mostly cleared the left side
      photoGap = PHOTO_GAP;
    }
    const cards = [...document.querySelectorAll('.intro-carousel__card')]
      .sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0));
    cards.forEach((card, ci) => {
      const at = textDone + Math.min(ci, 2) * photoGap, tilt = card.querySelector('.intro-carousel__tilt');
      if (tilt) tilt.style.transitionDelay = `${at}ms`;
      // the card's shadow and depth shading wait too, then fade in alongside the photo
      setTimeout(() => { card.classList.add('is-revealing'); card.classList.remove('is-waiting'); }, at);
      setTimeout(() => card.classList.remove('is-revealing'), at + 700);
    });
    const carouselDots = document.querySelector('.intro-carousel__dots');
    if (carouselDots) carouselDots.style.transitionDelay = `${textDone + 3 * photoGap + 150}ms`;
    flowStart = performance.now();
    wake();
    reveal();
    setTimeout(() => cover.classList.add('gone'), (paras.length - 1) * PARA_GAP + LAUNCH_SPREAD + FLY_FOR * 1.2 + MELT_FOR + 50);
  }

  btn.addEventListener('click', () => { if (isTap()) open(); press = null; });
  cover.querySelector('.intro-cover__hint').addEventListener('click', () => open());

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (state === 'sealed' && img.complete) build(false); }, 120);
  });

  const start = () => { build(!reduce.matches); wake(); };
  img.complete && img.naturalWidth ? start() : img.addEventListener('load', start);
})();
