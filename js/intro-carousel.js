// Turntable photo carousel: drag / swipe / click / arrow keys, tilt + glare on
// the front card, Instagram-style dots.
(function () {
  var root = document.querySelector('.intro-carousel');
  if (!root) return;

  var stage = root.querySelector('.intro-carousel__stage');
  var cards = [].slice.call(root.querySelectorAll('.intro-carousel__card'));
  var tilts = cards.map(function (c) { return c.querySelector('.intro-carousel__tilt'); });
  var dotsEl = root.querySelector('.intro-carousel__dots');
  var n = cards.length;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var SPREAD;           // sideways shift of the first neighbour, in card widths (--spread in CSS)
  var SPREAD_FAR;       // extra shift for each card beyond the first neighbour (--spread-far)
  var STAGGER;          // px each step left rises and each step right drops (--stagger in CSS)
  var VISIBLE;          // how many steps out cards stay visible (--visible)
  var DEPTH = 120;       // px each step pushes a card back
  var TURN = 5;          // deg each step turns a card away
  // Each card keeps its own slight resting tilt, like loose prints in a stack
  var JITTER = [-3, 2.5, -1.5, 3, -2.5, 1.5, -2, 2, -1];
  var MAX_TILT = 4;      // deg of hover tilt on the front card
  var DRAG_STEP = 0.55;  // card widths of drag that move one step
  var DOT_WINDOW = 3;    // full-size dots shown at once

  var MAX_LEAN = 9;      // deg cards tip toward the direction of travel at full speed
  var FLING = 130;       // ms of release velocity projected forward to pick the landing card
  var MAX_FLING = 3;     // most cards a single flick can travel

  var pos = 0;           // continuous position; integer = a card is in front
  var lastPos = 0;
  var speed = 0;         // smoothed positions per frame, drives the lean
  var target = 0;
  var vel = 0;
  var cardW;

  function measure() {
    cardW = cards[0].offsetWidth;
    var css = getComputedStyle(stage);
    SPREAD = parseFloat(css.getPropertyValue('--spread')) || 0.3;
    SPREAD_FAR = parseFloat(css.getPropertyValue('--spread-far')) || SPREAD * 0.5;
    STAGGER = parseFloat(css.getPropertyValue('--stagger')) || 0;
    VISIBLE = parseFloat(css.getPropertyValue('--visible')) || 1.5;
  }
  measure();

  // Drag distance that moves one step; at least the visual spread so the
  // neighbour tracks the finger.
  function stepPx() { return cardW * Math.max(DRAG_STEP, SPREAD); }

  var drag = null;
  var tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  var hoverCard = -1;

  function mod(a) { return ((a % n) + n) % n; }
  function offset(i) { var d = mod(i - pos); return d > n / 2 ? d - n : d; }
  function active() { return mod(Math.round(target)); }

  // Shortest way round the turntable to card i
  function goTo(i) {
    var d = mod(i - target);
    if (d > n / 2) d -= n;
    target = Math.round(target + d);
    renderDots();
  }

  function step(dir) {
    target = Math.round(target) + dir;
    renderDots();
  }

  // Layout -----------------------------------------------------------------

  function render(t) {
    var front = active();
    cards.forEach(function (card, i) {
      var d = offset(i);
      var a = Math.abs(d);
      var s = d < 0 ? -1 : 1;
      var x = s * (Math.min(a, 1) * SPREAD + Math.max(a - 1, 0) * SPREAD_FAR) * cardW;
      var y = s * Math.min(a, VISIBLE) * STAGGER + (reduceMotion ? 0 : Math.sin(t / 1600 + i * 1.7) * 4);
      var lean = s * Math.min(a, 1.5);
      var tip = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, -speed * 70));
      card.style.transform =
        'translate3d(' + x + 'px,' + y + 'px,' + (-a * DEPTH) + 'px) rotateY(' + (-lean * TURN + tip * 0.8) + 'deg) rotateZ(' + (JITTER[i % JITTER.length] + tip) + 'deg)';
      card.style.zIndex = String(100 - Math.round(a * 10));
      card.style.opacity = String(Math.max(0, Math.min(1, 1 - (a - VISIBLE) * 2.5)));
      card.style.setProperty('--shade', String(Math.min(a, 2) * 0.28));
      card.classList.toggle('is-active', i === front && a < 0.5);
      card.setAttribute('aria-hidden', i === front ? 'false' : 'true');

      if (i === front) {
        tilts[i].style.transform =
          'perspective(800px) rotateX(' + tilt.x + 'deg) rotateY(' + tilt.y + 'deg)';
      } else if (tilts[i].style.transform) {
        tilts[i].style.transform = '';
        tilts[i].style.setProperty('--glare', '0');
      }
    });
  }

  function frame(t) {
    if (drag && drag.moved) {
      // Trail the finger slightly so dragging feels soft rather than rigid
      pos += (drag.pos - pos) * 0.45;
    } else if (!drag) {
      // Soft, underdamped spring: ~500ms to land with a little elastic give
      vel += (target - pos) * 0.1;
      vel *= 0.72;
      pos += vel;
      if (Math.abs(target - pos) < 0.0005 && Math.abs(vel) < 0.0005) {
        pos = target;
        vel = 0;
      }
    }
    speed += (pos - lastPos - speed) * 0.25;
    lastPos = pos;
    tilt.x += (tilt.tx - tilt.x) * 0.15;
    tilt.y += (tilt.ty - tilt.y) * 0.15;
    render(t);
    requestAnimationFrame(frame);
  }

  // Dots -------------------------------------------------------------------

  var dots = [];
  var winStart = 0;

  cards.forEach(function (_, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'intro-carousel__dot';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', 'Photo ' + (i + 1));
    b.addEventListener('click', function () { goTo(i); });
    dotsEl.appendChild(b);
    dots.push(b);
  });

  function renderDots() {
    var cur = active();
    var size = Math.min(DOT_WINDOW, n);
    if (cur < winStart) winStart = cur;
    if (cur > winStart + size - 1) winStart = cur - size + 1;

    dots.forEach(function (dot, i) {
      var out = i < winStart ? winStart - i : Math.max(0, i - (winStart + size - 1));
      var scale = out === 0 ? 1 : out === 1 ? 0.66 : out === 2 ? 0.4 : 0;
      dot.style.setProperty('--dot-scale', String(scale));
      dot.classList.toggle('is-hidden', scale === 0);
      dot.classList.toggle('is-active', i === cur);
      dot.setAttribute('aria-selected', i === cur ? 'true' : 'false');
      dot.tabIndex = i === cur ? 0 : -1;
    });
  }

  // Drag / swipe -----------------------------------------------------------

  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    drag = {
      id: e.pointerId,
      startX: e.clientX,
      startPos: pos,
      pos: pos,
      lastX: e.clientX,
      lastT: e.timeStamp,
      v: 0,
      moved: false,
      card: cards.indexOf(e.target.closest('.intro-carousel__card'))
    };
    vel = 0;
  });

  stage.addEventListener('pointermove', function (e) {
    if (drag && e.pointerId === drag.id) {
      var dx = e.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) > 6) {
        drag.moved = true;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        root.classList.add('is-dragging');
        tilt.tx = tilt.ty = 0;
      }
      if (drag.moved) {
        var dt = Math.max(1, e.timeStamp - drag.lastT);
        drag.v = 0.8 * ((e.clientX - drag.lastX) / dt) + 0.2 * drag.v;
        drag.lastX = e.clientX;
        drag.lastT = e.timeStamp;
        drag.pos = drag.startPos - dx / stepPx();
      }
      return;
    }
    if (e.pointerType === 'mouse') hoverTilt(e);
  });

  function release(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    root.classList.remove('is-dragging');

    if (!d.moved) {
      if (d.card !== -1 && d.card !== active()) goTo(d.card);
      return;
    }

    // Fling: project the release velocity forward, so a gentle drag moves one
    // card and a hard flick spins through several. Always advance at least one
    // card past a small threshold.
    var step = stepPx();
    var from = Math.round(d.startPos);
    var next = Math.round(d.pos - (d.v * FLING) / step);
    if (next === from && Math.abs(d.pos - d.startPos) > 0.2) next = from + (d.pos > d.startPos ? 1 : -1);
    var reach = Math.min(MAX_FLING, Math.floor((n - 1) / 2));
    target = Math.max(from - reach, Math.min(from + reach, next));
    vel = (-d.v * 8) / step;
    renderDots();
  }

  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  // Hover tilt + glare -----------------------------------------------------

  function hoverTilt(e) {
    var front = active();
    var card = cards[front];
    if (e.target.closest('.intro-carousel__card') !== card) return resetTilt();
    var r = card.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width;
    var y = (e.clientY - r.top) / r.height;
    tilt.ty = (x - 0.5) * MAX_TILT * 2;
    tilt.tx = (0.5 - y) * MAX_TILT * 2;
    tilts[front].style.setProperty('--gx', (x * 100) + '%');
    tilts[front].style.setProperty('--gy', (y * 100) + '%');
    tilts[front].style.setProperty('--glare', '1');
    hoverCard = front;
  }

  function resetTilt() {
    tilt.tx = tilt.ty = 0;
    if (hoverCard !== -1) tilts[hoverCard].style.setProperty('--glare', '0');
    hoverCard = -1;
  }

  stage.addEventListener('pointerleave', resetTilt);

  // Keyboard ---------------------------------------------------------------

  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else return;
    e.preventDefault();
    if (document.activeElement && document.activeElement.classList.contains('intro-carousel__dot')) {
      dots[active()].focus();
    }
  });

  window.addEventListener('resize', measure);

  renderDots();
  requestAnimationFrame(frame);
})();
