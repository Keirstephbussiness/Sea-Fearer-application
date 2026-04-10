'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   validate.js  —  Enhanced Form Validation for Seafarer Application Form
   ─────────────────────────────────────────────────────────────────────────
   • Drop-in companion to app.js. Does NOT modify or override app.js.
   • Hooks into the existing field IDs and .field / .has-error classes.
   • Overrides the global validateStep() function that app.js calls before
     advancing, so app.js behaviour remains intact.
   • Adds real-time inline feedback (format hints, live character counts,
     pattern checks) for a much richer UX.
   ═══════════════════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────
   CONSTANTS / PATTERNS
   ───────────────────────────────────────────────── */

var RULES = {

  /* Step 1 */
  position : {
    id       : 'position',
    fieldId  : 'f-position',
    label    : 'Position Applied For',
    required : true,
    type     : 'select',
    msg      : 'Please select a position.'
  },
  avail : {
    id       : 'avail',
    fieldId  : 'f-avail',
    label    : 'Availability Date',
    required : true,
    type     : 'date',
    minToday : true,
    msg      : 'Please enter a valid future date.'
  },

  /* Step 2 */
  fname : {
    id       : 'fname',
    fieldId  : 'f-fname',
    label    : 'First Name',
    required : true,
    type     : 'name',
    minLen   : 2,
    maxLen   : 50,
    msg      : 'First name must be 2–50 letters.'
  },
  lname : {
    id       : 'lname',
    fieldId  : 'f-lname',
    label    : 'Last Name',
    required : true,
    type     : 'name',
    minLen   : 2,
    maxLen   : 50,
    msg      : 'Last name must be 2–50 letters.'
  },
  mname : {
    id      : 'mname',
    label   : 'Middle Name',
    type    : 'name',
    maxLen  : 50,
    msg     : 'Middle name must contain valid characters.'
  },
  dob : {
    id       : 'dob',
    fieldId  : 'f-dob',
    label    : 'Date of Birth',
    required : true,
    type     : 'date',
    minAge   : 18,
    maxAge   : 65,
    msg      : 'Applicant must be between 18 and 65 years old.'
  },
  age : {
    id     : 'age',
    label  : 'Age',
    type   : 'integer',
    min    : 18,
    max    : 65,
    msg    : 'Age must be between 18 and 65.'
  },
  address : {
    id       : 'address',
    fieldId  : 'f-address',
    label    : 'Complete Address',
    required : true,
    type     : 'text',
    minLen   : 10,
    maxLen   : 200,
    msg      : 'Please enter your complete address (at least 10 characters).'
  },
  contact : {
    id       : 'contact',
    fieldId  : 'f-contact',
    label    : 'Contact Number',
    required : true,
    type     : 'phone',
    msg      : 'Enter a valid PH mobile number (e.g. +63 9XX XXX XXXX or 09XXXXXXXXX).'
  },
  email : {
    id       : 'email',
    fieldId  : 'f-email',
    label    : 'Email Address',
    required : true,
    type     : 'email',
    msg      : 'Enter a valid email address (e.g. juan@example.com).'
  },
  emname : {
    id     : 'emname',
    label  : 'Emergency Contact Name',
    type   : 'name',
    maxLen : 80,
    msg    : 'Emergency contact name must contain valid characters.'
  },
  emnum : {
    id    : 'emnum',
    label : 'Emergency Contact Number',
    type  : 'phone',
    msg   : 'Enter a valid PH mobile number.'
  }
};

/* Step → field IDs to validate */
var STEP_FIELDS = {
  1 : ['position', 'avail'],
  2 : ['fname', 'mname', 'lname', 'dob', 'age', 'address', 'contact', 'email', 'emname', 'emnum'],
  3 : []   // no required fields — purely optional checkboxes / uploads
};


/* ─────────────────────────────────────────────────
   LOW-LEVEL VALIDATORS
   ───────────────────────────────────────────────── */

var Validators = {

  /** Generic non-empty check */
  required : function (val) {
    return val.trim().length > 0;
  },

  /** Name: letters, spaces, hyphens, apostrophes, dots */
  name : function (val, rule) {
    if (!val && !rule.required) return true;
    var pattern = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-.]+$/;
    if (!pattern.test(val)) return false;
    if (rule.minLen && val.length < rule.minLen) return false;
    if (rule.maxLen && val.length > rule.maxLen) return false;
    return true;
  },

  /** Plain text: allow most characters, just check length */
  text : function (val, rule) {
    if (!val && !rule.required) return true;
    if (rule.minLen && val.trim().length < rule.minLen) return false;
    if (rule.maxLen && val.trim().length > rule.maxLen) return false;
    return true;
  },

  /** Date */
  date : function (val, rule) {
    if (!val) return !rule.required;
    var d = new Date(val);
    if (isNaN(d.getTime())) return false;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    /* Availability date must be today or in the future */
    if (rule.minToday) {
      if (d < today) return false;
    }

    /* Date of birth age range */
    if (rule.minAge !== undefined) {
      var age = _calcAge(d);
      if (age < rule.minAge || age > rule.maxAge) return false;
    }

    return true;
  },

  /** Integer range */
  integer : function (val, rule) {
    if (!val && !rule.required) return true;
    var n = parseInt(val, 10);
    if (isNaN(n)) return false;
    if (rule.min !== undefined && n < rule.min) return false;
    if (rule.max !== undefined && n > rule.max) return false;
    return true;
  },

  /** Philippine mobile/landline numbers */
  phone : function (val, rule) {
    if (!val && !rule.required) return true;
    /* Accept:  +63 9XX XXX XXXX  |  09XXXXXXXXX  |  (02) XXXXXXXX  |  8-digit landlines */
    var cleaned = val.replace(/[\s\-().]/g, '');
    var patterns = [
      /^\+639\d{9}$/,        // +639XXXXXXXXX
      /^09\d{9}$/,           // 09XXXXXXXXX
      /^639\d{9}$/,          // 639XXXXXXXXX (no +)
      /^0[2-9]\d{7,8}$/,     // 02XXXXXXXX landline
      /^\d{7,8}$/            // local 7-8 digit
    ];
    return patterns.some(function (p) { return p.test(cleaned); });
  },

  /** Email */
  email : function (val, rule) {
    if (!val && !rule.required) return true;
    /* RFC-5322 simplified */
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return pattern.test(val.trim());
  },

  /** Select (non-empty value) */
  select : function (val, rule) {
    return val && val.trim() !== '';
  }
};

function _calcAge(dob) {
  var today = new Date();
  var age   = today.getFullYear() - dob.getFullYear();
  var m     = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}


/* ─────────────────────────────────────────────────
   CORE VALIDATE FIELD
   ───────────────────────────────────────────────── */

/**
 * Validates a single field by its rule key.
 * Returns true if valid, false if invalid.
 * Shows / hides error UI accordingly.
 */
function validateField(ruleKey) {
  var rule = RULES[ruleKey];
  if (!rule) return true;

  var el = document.getElementById(rule.id);
  if (!el) return true;   // element absent → skip

  var val    = (el.value || '').trim();
  var type   = rule.type || 'text';
  var valid  = true;

  /* Skip optional empty fields */
  if (!val && !rule.required) {
    _clearError(rule);
    return true;
  }

  /* Required check first */
  if (rule.required && !Validators.required(val)) {
    valid = false;
  } else {
    /* Type-specific check */
    if (Validators[type]) {
      valid = Validators[type](val, rule);
    }
  }

  if (valid) {
    _clearError(rule);
  } else {
    _showError(rule);
  }

  return valid;
}

function _showError(rule) {
  if (rule.fieldId) {
    var field = document.getElementById(rule.fieldId);
    if (field) {
      field.classList.add('has-error');
      _updateErrorMsg(field, rule.msg);
    }
  }
  /* Also mark the element itself for inputs without explicit fieldId wrapper */
  var el = document.getElementById(rule.id);
  if (el) el.setAttribute('aria-invalid', 'true');
}

function _clearError(rule) {
  if (rule.fieldId) {
    var field = document.getElementById(rule.fieldId);
    if (field) field.classList.remove('has-error');
  }
  var el = document.getElementById(rule.id);
  if (el) el.removeAttribute('aria-invalid');
}

/**
 * Update the .field-error span text inside a .field wrapper.
 * Falls back gracefully if the span does not exist.
 */
function _updateErrorMsg(fieldEl, msg) {
  var span = fieldEl.querySelector('.field-error');
  if (span && msg) span.textContent = '⚠ ' + msg;
}


/* ─────────────────────────────────────────────────
   STEP-LEVEL VALIDATION  (overrides app.js version)
   ───────────────────────────────────────────────── */

/**
 * This replaces validateStep() in app.js.
 * app.js calls validateStep(currentStep) before advancing — so as long as
 * this file is loaded AFTER app.js, this definition wins.
 */
window.validateStep = function (step) {
  var fields = STEP_FIELDS[step] || [];
  var allValid = true;

  fields.forEach(function (key) {
    var result = validateField(key);
    if (!result) allValid = false;
  });

  /* Scroll to first error */
  if (!allValid) {
    var firstError = document.querySelector('.field.has-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    _showStepErrorBanner(step);
  } else {
    _hideStepErrorBanner();
  }

  return allValid;
};


/* ─────────────────────────────────────────────────
   ERROR BANNER
   ───────────────────────────────────────────────── */

function _showStepErrorBanner(step) {
  var banner = document.getElementById('vld-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'vld-banner';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:10px',
      'background:#fff0f0',
      'border:1.5px solid #e53e3e',
      'border-radius:8px',
      'padding:10px 16px',
      'margin:0 0 18px',
      'font-size:13.5px',
      'color:#c0392b',
      'font-weight:500',
      'animation:vldShake .3s ease'
    ].join(';');

    /* inject shake keyframe once */
    if (!document.getElementById('vld-style')) {
      var s = document.createElement('style');
      s.id = 'vld-style';
      s.textContent = '@keyframes vldShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}';
      document.head.appendChild(s);
    }
  }

  var msgs = {
    1 : 'Please select a position and enter a valid future availability date.',
    2 : 'Please correct the highlighted fields before continuing.'
  };

  banner.innerHTML = '<span style="font-size:18px;">⚠</span>' +
    '<span>' + (msgs[step] || 'Please fix the errors above.') + '</span>';

  /* Re-trigger animation */
  banner.style.animation = 'none';
  var panel = document.getElementById('panel' + step);
  if (panel) {
    var navRow = panel.querySelector('.nav-row');
    if (navRow) {
      panel.insertBefore(banner, navRow);
    } else {
      panel.appendChild(banner);
    }
  }
  requestAnimationFrame(function () {
    banner.style.animation = 'vldShake .3s ease';
  });
}

function _hideStepErrorBanner() {
  var banner = document.getElementById('vld-banner');
  if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
}


/* ─────────────────────────────────────────────────
   REAL-TIME / LIVE VALIDATION
   ───────────────────────────────────────────────── */

/**
 * Attach blur and input listeners to every known field so errors appear
 * as soon as the user leaves a field (blur) and clear as soon as valid (input).
 */
function _attachLiveValidation() {
  Object.keys(RULES).forEach(function (key) {
    var rule = RULES[key];
    var el   = document.getElementById(rule.id);
    if (!el) return;

    /* On blur → full validate */
    el.addEventListener('blur', function () {
      validateField(key);
    });

    /* On input/change → clear error if now valid, re-validate quietly */
    var eventType = (el.tagName === 'SELECT') ? 'change' : 'input';
    el.addEventListener(eventType, function () {
      /* Clear error immediately so user gets positive feedback */
      _clearError(rule);
      /* Revalidate only if field has content (avoid screaming at empty optional fields) */
      if ((el.value || '').trim()) {
        validateField(key);
      }
    });
  });
}


/* ─────────────────────────────────────────────────
   EXTRA UX ENHANCEMENTS
   ───────────────────────────────────────────────── */

/**
 * Format phone number on blur for readability (PH format).
 */
function _attachPhoneFormatter(fieldId) {
  var el = document.getElementById(fieldId);
  if (!el) return;
  el.addEventListener('blur', function () {
    var raw = el.value.replace(/\D/g, '');
    if (raw.length === 11 && raw.startsWith('09')) {
      /* 09XX XXX XXXX */
      el.value = raw.slice(0, 4) + ' ' + raw.slice(4, 7) + ' ' + raw.slice(7);
    } else if (raw.length === 12 && raw.startsWith('639')) {
      el.value = '+' + raw.slice(0, 2) + ' ' + raw.slice(2, 5) + ' ' + raw.slice(5, 8) + ' ' + raw.slice(8);
    }
  });
}

/**
 * Capitalise name fields on blur.
 */
function _attachNameCapitalizer(fieldId) {
  var el = document.getElementById(fieldId);
  if (!el) return;
  el.addEventListener('blur', function () {
    el.value = el.value.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  });
}

/**
 * Availability date: set min attribute to today so the browser date picker
 * can't select past dates either.
 */
function _setAvailMinDate() {
  var el = document.getElementById('avail');
  if (!el) return;
  var today = new Date();
  var yyyy  = today.getFullYear();
  var mm    = String(today.getMonth() + 1).padStart(2, '0');
  var dd    = String(today.getDate()).padStart(2, '0');
  el.setAttribute('min', yyyy + '-' + mm + '-' + dd);
}

/**
 * DOB: set a max attribute (must be at least 18 years old) and min (max 65).
 */
function _setDOBRange() {
  var el = document.getElementById('dob');
  if (!el) return;
  var today = new Date();
  var maxDOB = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  var minDOB = new Date(today.getFullYear() - 65, today.getMonth(), today.getDate());
  el.setAttribute('max', maxDOB.toISOString().split('T')[0]);
  el.setAttribute('min', minDOB.toISOString().split('T')[0]);
}

/**
 * Address character counter hint.
 */
function _attachCharCounter(fieldId, max) {
  var el = document.getElementById(fieldId);
  if (!el) return;
  var hint = el.parentElement && el.parentElement.querySelector('.field-hint');
  el.addEventListener('input', function () {
    var len = el.value.length;
    if (hint) {
      hint.textContent = len + ' / ' + max + ' characters';
      hint.style.color = len > max ? '#e53e3e' : '';
    }
  });
}

/**
 * Age field — only allow numbers, max 2 digits.
 */
function _restrictAgeInput() {
  var el = document.getElementById('age');
  if (!el) return;
  el.addEventListener('input', function () {
    el.value = el.value.replace(/[^\d]/g, '').slice(0, 2);
  });
}

/**
 * Inject inline hint text under fields if they don't already have one.
 */
function _injectHint(fieldId, hintText) {
  var el = document.getElementById(fieldId);
  if (!el) return;
  var parent = el.closest('.field');
  if (!parent) return;
  if (parent.querySelector('.field-hint')) return; // already has one
  var hint = document.createElement('div');
  hint.className = 'field-hint';
  hint.textContent = hintText;
  parent.appendChild(hint);
}


/* ─────────────────────────────────────────────────
   BOOTSTRAP
   ───────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {

  /* Date constraints */
  _setAvailMinDate();
  _setDOBRange();

  /* Name capitalisation */
  ['fname', 'mname', 'lname', 'emname'].forEach(_attachNameCapitalizer);

  /* Phone formatters */
  ['contact', 'emnum'].forEach(_attachPhoneFormatter);

  /* Character counter for address */
  _attachCharCounter('address', 200);

  /* Restrict age to numbers only */
  _restrictAgeInput();

  /* Hints */
  _injectHint('contact', 'Format: 09XX XXX XXXX or +63 9XX XXX XXXX');
  _injectHint('emnum',   'Format: 09XX XXX XXXX or +63 9XX XXX XXXX');
  _injectHint('fname',   'As it appears on your official ID or Seaman Book.');
  _injectHint('email',   'We will send confirmation to this address.');

  /* Live validation listeners */
  _attachLiveValidation();

  /* Clear banner when user starts fixing anything */
  document.querySelectorAll('input, select, textarea').forEach(function (el) {
    el.addEventListener('input', function () {
      var banner = document.getElementById('vld-banner');
      if (banner) {
        var anyError = document.querySelector('.field.has-error');
        if (!anyError && banner.parentNode) banner.parentNode.removeChild(banner);
      }
    });
  });

});