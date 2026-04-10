'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   tutorial.js  —  Stepper Highlight Tutorial for Seafarer Application Form
   ─────────────────────────────────────────────────────────────────────────
   • Highlights ONLY the stepper nav (below the header) with a tooltip
     that tells the user they can click the steps to jump between sections.
   • Shows once on first visit. A floating "?" button re-triggers it.
   • Fully standalone — does not touch app.js or validate.js.
   ═══════════════════════════════════════════════════════════════════════════ */

var STORAGE_KEY = 'ggsms_stepper_tip_done';

/* ─────────────────────────────────────────────────
   STYLES
   ───────────────────────────────────────────────── */
function _injectStyles() {
  if (document.getElementById('ttr-style')) return;

  var css = [
    /* Dark overlay */
    '#ttr-overlay{',
      'position:fixed;inset:0;z-index:9000;',
      'background:rgba(5,15,35,.70);',
      'backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);',
      'opacity:0;transition:opacity .35s;pointer-events:none;',
    '}',
    '#ttr-overlay.show{opacity:1;pointer-events:auto;}',

    /* Spotlight cut-out around the stepper */
    '#ttr-spotlight{',
      'position:fixed;z-index:9001;pointer-events:none;',
      'border-radius:12px;display:none;',
      'box-shadow:0 0 0 9999px rgba(5,15,35,.70),',
                 '0 0 0 3px #C9A84C,',
                 '0 0 24px 4px rgba(201,168,76,.45);',
      'transition:all .4s cubic-bezier(.4,0,.2,1);',
    '}',
    '@keyframes ttrPulse{',
      '0%,100%{box-shadow:0 0 0 9999px rgba(5,15,35,.70),0 0 0 3px #C9A84C,0 0 24px 4px rgba(201,168,76,.45);}',
      '50%{box-shadow:0 0 0 9999px rgba(5,15,35,.70),0 0 0 6px #e0bc5a,0 0 36px 10px rgba(201,168,76,.65);}',
    '}',
    '#ttr-spotlight.pulse{animation:ttrPulse 1.8s ease-in-out infinite;}',

    /* Tooltip bubble */
    '#ttr-bubble{',
      'position:fixed;z-index:9010;display:none;',
      'width:310px;max-width:calc(100vw - 32px);',
      'background:#fff;border-radius:14px;overflow:visible;',
      'box-shadow:0 16px 48px rgba(0,0,0,.28),0 2px 8px rgba(0,0,0,.12);',
      'font-family:"Barlow",sans-serif;',
      'opacity:0;transform:translateY(10px);',
      'transition:opacity .3s,transform .3s;',
    '}',
    '#ttr-bubble.show{opacity:1;transform:none;}',

    /* Arrow pointing UP toward stepper */
    '#ttr-bubble::before{',
      'content:"";position:absolute;',
      'top:-8px;left:50%;transform:translateX(-50%) rotate(45deg);',
      'width:16px;height:16px;background:#0A1628;',
      'border-radius:2px;z-index:-1;',
    '}',

    /* Bubble header */
    '#ttr-bubble .ttr-head{',
      'background:linear-gradient(135deg,#0A1628 0%,#1a2f5e 100%);',
      'border-radius:14px 14px 0 0;',
      'padding:14px 18px 12px;',
      'display:flex;align-items:center;gap:10px;',
    '}',
    '#ttr-bubble .ttr-icon{font-size:22px;line-height:1;flex-shrink:0;}',
    '#ttr-bubble .ttr-title{',
      'color:#fff;font-size:14.5px;font-weight:700;letter-spacing:.2px;',
    '}',

    /* Gold strip */
    '#ttr-bubble .ttr-strip{height:3px;background:linear-gradient(90deg,#C9A84C,#f0d070);}',

    /* Body */
    '#ttr-bubble .ttr-body{',
      'padding:16px 18px 8px;',
      'font-size:13.5px;line-height:1.7;color:#253455;',
    '}',
    '#ttr-bubble .ttr-body strong{color:#0A1628;}',

    /* Step pill previews */
    '#ttr-bubble .ttr-pills{',
      'display:flex;flex-wrap:wrap;gap:6px;',
      'padding:10px 18px 14px;',
    '}',
    '.ttr-pill{',
      'display:flex;align-items:center;gap:5px;',
      'background:#f0f4fb;border-radius:20px;',
      'padding:4px 10px 4px 6px;',
      'font-size:12px;font-weight:600;color:#3a4a6b;',
    '}',
    '.ttr-pill-num{',
      'width:20px;height:20px;border-radius:50%;',
      'background:linear-gradient(135deg,#0A1628,#1a2f5e);',
      'color:#C9A84C;font-size:11px;font-weight:800;',
      'display:flex;align-items:center;justify-content:center;flex-shrink:0;',
    '}',

    /* Footer */
    '#ttr-bubble .ttr-foot{',
      'padding:4px 18px 16px;display:flex;justify-content:flex-end;',
    '}',
    '#ttr-bubble .ttr-btn{',
      'border:none;cursor:pointer;border-radius:8px;',
      'background:linear-gradient(135deg,#C9A84C,#e0bc5a);',
      'color:#0A1628;font-size:13.5px;font-weight:800;',
      'padding:9px 24px;font-family:inherit;',
      'box-shadow:0 3px 10px rgba(201,168,76,.4);',
      'transition:all .2s;',
    '}',
    '#ttr-bubble .ttr-btn:hover{transform:translateY(-1px);box-shadow:0 5px 16px rgba(201,168,76,.55);}',

    /* Floating help button */
    '#ttr-help{',
      'position:fixed;bottom:24px;right:24px;z-index:8000;',
      'width:46px;height:46px;border-radius:50%;border:none;',
      'background:linear-gradient(135deg,#0A1628,#1a2f5e);',
      'color:#C9A84C;font-size:20px;font-weight:800;cursor:pointer;',
      'box-shadow:0 4px 18px rgba(0,0,0,.35),0 0 0 3px rgba(201,168,76,.3);',
      'display:none;align-items:center;justify-content:center;',
      'font-family:"Barlow Condensed","Barlow",sans-serif;',
      'transition:all .25s;',
    '}',
    '#ttr-help:hover{transform:scale(1.1);box-shadow:0 6px 24px rgba(0,0,0,.4),0 0 0 4px rgba(201,168,76,.5);}',
    '#ttr-help-tip{',
      'position:absolute;right:54px;',
      'background:#0A1628;color:#fff;',
      'font-size:11px;font-weight:600;white-space:nowrap;',
      'padding:5px 10px;border-radius:6px;',
      'opacity:0;pointer-events:none;transition:opacity .2s;',
      'font-family:"Barlow",sans-serif;',
    '}',
    '#ttr-help:hover #ttr-help-tip{opacity:1;}',
  ].join('');

  var s = document.createElement('style');
  s.id = 'ttr-style';
  s.textContent = css;
  document.head.appendChild(s);
}


/* ─────────────────────────────────────────────────
   BUILD DOM
   ───────────────────────────────────────────────── */
function _buildDOM() {
  /* Overlay */
  var overlay = document.createElement('div');
  overlay.id = 'ttr-overlay';
  overlay.addEventListener('click', _dismiss);
  document.body.appendChild(overlay);

  /* Spotlight */
  var spotlight = document.createElement('div');
  spotlight.id = 'ttr-spotlight';
  document.body.appendChild(spotlight);

  /* Bubble */
  var bubble = document.createElement('div');
  bubble.id = 'ttr-bubble';
  bubble.setAttribute('role', 'tooltip');
  bubble.innerHTML = [
    '<div class="ttr-head">',
      '<span class="ttr-icon">🗺️</span>',
      '<span class="ttr-title">How to navigate this form</span>',
    '</div>',
    '<div class="ttr-strip"></div>',
    '<div class="ttr-body">',
      '👆 <strong>Click any numbered circle</strong> above to jump directly to that section and check its requirements anytime.',
    '</div>',
    '<div class="ttr-pills">',
      '<div class="ttr-pill"><span class="ttr-pill-num">1</span>Position</div>',
      '<div class="ttr-pill"><span class="ttr-pill-num">2</span>Personal</div>',
      '<div class="ttr-pill"><span class="ttr-pill-num">3</span>Documents</div>',
      '<div class="ttr-pill"><span class="ttr-pill-num">4</span>Review</div>',
    '</div>',
    '<div class="ttr-foot">',
      '<button class="ttr-btn" id="ttr-got-it">Got it! ✓</button>',
    '</div>',
  ].join('');
  document.body.appendChild(bubble);

  document.getElementById('ttr-got-it').addEventListener('click', _dismiss);

  /* Stop overlay click from dismissing when clicking the bubble */
  bubble.addEventListener('click', function (e) { e.stopPropagation(); });

  /* Floating help button */
  var helpBtn = document.createElement('button');
  helpBtn.id = 'ttr-help';
  helpBtn.setAttribute('aria-label', 'Show navigation tip');
  helpBtn.innerHTML = '?<span id="ttr-help-tip">How to navigate</span>';
  helpBtn.addEventListener('click', _show);
  document.body.appendChild(helpBtn);

  /* Keyboard dismiss */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') _dismiss();
  });

  /* Re-position on resize */
  window.addEventListener('resize', function () {
    if (document.getElementById('ttr-overlay').classList.contains('show')) {
      _positionElements();
    }
  });
}


/* ─────────────────────────────────────────────────
   POSITION SPOTLIGHT + BUBBLE ON THE STEPPER
   ───────────────────────────────────────────────── */
function _positionElements() {
  var stepper = document.querySelector('.stepper');
  if (!stepper) return;

  var rect = stepper.getBoundingClientRect();
  var pad  = 12;

  /* Spotlight */
  var sp = document.getElementById('ttr-spotlight');
  sp.style.top    = (rect.top  - pad) + 'px';
  sp.style.left   = (rect.left - pad) + 'px';
  sp.style.width  = (rect.width  + pad * 2) + 'px';
  sp.style.height = (rect.height + pad * 2) + 'px';

  /* Bubble — centered below the stepper */
  var bubble = document.getElementById('ttr-bubble');
  var bW = 310;
  var vW = window.innerWidth;

  var bLeft = rect.left + rect.width / 2 - bW / 2;
  bLeft = Math.max(12, Math.min(bLeft, vW - bW - 12));

  bubble.style.top  = (rect.bottom + pad + 14) + 'px';
  bubble.style.left = bLeft + 'px';
}


/* ─────────────────────────────────────────────────
   SHOW / DISMISS
   ───────────────────────────────────────────────── */
function _show() {
  document.getElementById('ttr-help').style.display = 'none';

  _positionElements();

  /* Fade in overlay */
  document.getElementById('ttr-overlay').classList.add('show');

  /* Show + pulse spotlight */
  var sp = document.getElementById('ttr-spotlight');
  sp.style.display = 'block';
  requestAnimationFrame(function () {
    sp.classList.add('pulse');
  });

  /* Slide in bubble */
  var bubble = document.getElementById('ttr-bubble');
  bubble.style.display = 'block';
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      bubble.classList.add('show');
    });
  });
}

function _dismiss() {
  var overlay = document.getElementById('ttr-overlay');
  var bubble  = document.getElementById('ttr-bubble');
  var sp      = document.getElementById('ttr-spotlight');
  var help    = document.getElementById('ttr-help');

  overlay.classList.remove('show');
  bubble.classList.remove('show');
  sp.classList.remove('pulse');

  setTimeout(function () {
    sp.style.display     = 'none';
    bubble.style.display = 'none';
    help.style.display   = 'flex';
  }, 350);

  try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
}


/* ─────────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  _injectStyles();
  _buildDOM();

  var done = false;
  try { done = !!localStorage.getItem(STORAGE_KEY); } catch (e) {}

  if (!done) {
    setTimeout(_show, 800);
  } else {
    document.getElementById('ttr-help').style.display = 'flex';
  }
});