'use strict';

/* ─────────────────────────────────────────────────
   STATE
   ───────────────────────────────────────────────── */
let currentStep = 1;
let uploadedFiles = [];
const TOTAL_STEPS = 4;

/* ─────────────────────────────────────────────────
   STEP NAVIGATION
   ───────────────────────────────────────────────── */

function goStep(target) {
  if (target > currentStep && !validateStep(currentStep)) return;
  transitionToStep(target);
}

function jumpToStep(target) {
  if (target < 1 || target > TOTAL_STEPS) return;
  transitionToStep(target);
}

function transitionToStep(target) {
  var current = document.getElementById('panel' + currentStep);
  if (current) current.classList.remove('active');

  currentStep = target;

  var next = document.getElementById('panel' + target);
  if (next) next.classList.add('active');

  if (target === 4) populateReview();

  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
  for (var i = 1; i <= TOTAL_STEPS; i++) {
    var circle = document.getElementById('sc' + i);
    var label  = document.getElementById('sl' + i);

    circle.classList.remove('active', 'done');
    if (label) label.classList.remove('active');

    var numSpan   = circle.querySelector('.sc-num');
    var checkSpan = circle.querySelector('.sc-check');

    if (i < currentStep) {
      circle.classList.add('done');
      if (numSpan)   numSpan.style.display   = 'none';
      if (checkSpan) checkSpan.style.display = 'block';
    } else if (i === currentStep) {
      circle.classList.add('active');
      if (numSpan)   numSpan.style.display   = 'block';
      if (checkSpan) checkSpan.style.display = 'none';
      if (label) label.classList.add('active');
    } else {
      if (numSpan)   numSpan.style.display   = 'block';
      if (checkSpan) checkSpan.style.display = 'none';
    }

    if (i < TOTAL_STEPS) {
      var conn = document.getElementById('conn' + i);
      if (conn) conn.classList.toggle('done', i < currentStep);
    }
  }

  var pct  = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
  var fill = document.getElementById('progressFill');
  var glow = document.getElementById('progressGlow');
  if (fill) fill.style.width = pct + '%';
  if (glow) glow.style.width = pct + '%';
}

/* ─────────────────────────────────────────────────
   VALIDATION
   ───────────────────────────────────────────────── */

function validateStep(s) {
  var valid = true;

  if (s === 1) {
    valid = requireField('position', 'f-position') & valid;
    valid = requireField('avail',    'f-avail')    & valid;
  }

  if (s === 2) {
    valid = requireField('fname',   'f-fname')   & valid;
    valid = requireField('lname',   'f-lname')   & valid;
    valid = requireField('dob',     'f-dob')     & valid;
    valid = requireField('address', 'f-address') & valid;
    valid = requireField('contact', 'f-contact') & valid;
    valid = requireEmail('email',   'f-email')   & valid;
  }

  return !!valid;
}

function requireField(inputId, fieldId) {
  var el    = document.getElementById(inputId);
  var field = document.getElementById(fieldId);
  if (!el || !field) return true;
  if (!el.value.trim()) { field.classList.add('has-error'); return false; }
  field.classList.remove('has-error');
  return true;
}

function requireEmail(inputId, fieldId) {
  var el    = document.getElementById(inputId);
  var field = document.getElementById(fieldId);
  if (!el || !field) return true;
  var valid = el.value.trim() && el.value.includes('@') && el.value.includes('.');
  if (!valid) { field.classList.add('has-error'); return false; }
  field.classList.remove('has-error');
  return true;
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('input, select, textarea').forEach(function (el) {
    el.addEventListener('input', function () {
      var parent = el.closest('.field');
      if (parent) parent.classList.remove('has-error');
    });
  });

  var dobEl = document.getElementById('dob');
  if (dobEl) {
    dobEl.addEventListener('change', function () {
      var dob = new Date(dobEl.value);
      if (!isNaN(dob)) {
        var today = new Date();
        var age = today.getFullYear() - dob.getFullYear();
        var m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        var ageEl = document.getElementById('age');
        if (ageEl && age > 0 && age < 100) ageEl.value = age;
      }
    });
  }

  updateProgress();
});

/* ─────────────────────────────────────────────────
   FILE UPLOAD
   ───────────────────────────────────────────────── */

function handleFiles(input) {
  Array.from(input.files).forEach(function (file) {
    if (!uploadedFiles.find(function (f) { return f.name === file.name; })) {
      uploadedFiles.push(file);
    }
  });
  renderFileList();
}

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('uploadZone').classList.add('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('uploadZone').classList.remove('drag-over');
  Array.from(e.dataTransfer.files).forEach(function (file) {
    if (!uploadedFiles.find(function (f) { return f.name === file.name; })) {
      uploadedFiles.push(file);
    }
  });
  renderFileList();
}

function removeFile(index) {
  uploadedFiles.splice(index, 1);
  renderFileList();
}

function renderFileList() {
  var listEl = document.getElementById('fileList');
  if (!listEl) return;
  listEl.innerHTML = uploadedFiles.map(function (file, i) {
    return (
      '<div class="file-item">' +
        '<span>' + escapeHtml(file.name) + '</span>' +
        '<button onclick="removeFile(' + i + ')" title="Remove">&#10005;</button>' +
      '</div>'
    );
  }).join('');
}

/* ─────────────────────────────────────────────────
   REVIEW
   ───────────────────────────────────────────────── */

function populateReview() {
  setText('rv-position', getVal('position'));
  setText('rv-avail',    formatDate(getVal('avail')));
  setText('rv-contract', getVal('contract'));
  setText('rv-exp',      getVal('experience'));
  setText('rv-notes',    getVal('notes1') || '—');

  var parts = [getVal('fname'), getVal('mname'), getVal('lname'), getVal('suffix')].filter(Boolean);
  setText('rv-name', parts.join(' ') || '—');

  setText('rv-dob',     formatDate(getVal('dob')));
  var ageStr = getVal('age')   ? getVal('age') + ' yrs'  : '';
  var civStr = getVal('civil') ? getVal('civil')          : '';
  setText('rv-civil',   [ageStr, civStr].filter(Boolean).join(', ') || '—');
  setText('rv-address', getVal('address'));
  setText('rv-contact', getVal('contact'));
  setText('rv-email',   getVal('email'));
  setText('rv-emname',  getVal('emname') || '—');
  setText('rv-emnum',   getVal('emnum')  || '—');

  renderTags('rv-docs', getChecked('.doc-cb'));
  renderTags('rv-trn',  getChecked('.trn-cb'));
}

function renderTags(containerId, items) {
  var el = document.getElementById(containerId);
  if (!el) return;
  if (!items.length) {
    el.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">None selected</span>';
    return;
  }
  el.innerHTML = items.map(function (item) {
    return '<span class="rv-tag">' + escapeHtml(item) + '</span>';
  }).join('');
}

/* ─────────────────────────────────────────────────
   SUBMIT & RESET
   ───────────────────────────────────────────────── */

function submitForm() {
  document.getElementById('panel4').classList.remove('active');
  document.getElementById('panelSuccess').classList.add('active');

  for (var i = 1; i <= TOTAL_STEPS; i++) {
    var circle = document.getElementById('sc' + i);
    circle.classList.remove('active');
    circle.classList.add('done');

    var numSpan   = circle.querySelector('.sc-num');
    var checkSpan = circle.querySelector('.sc-check');
    if (numSpan)   numSpan.style.display   = 'none';
    if (checkSpan) checkSpan.style.display = 'block';

    var label = document.getElementById('sl' + i);
    if (label) label.classList.remove('active');

    if (i < TOTAL_STEPS) {
      var conn = document.getElementById('conn' + i);
      if (conn) conn.classList.add('done');
    }
  }

  var fill = document.getElementById('progressFill');
  var glow = document.getElementById('progressGlow');
  if (fill) fill.style.width = '100%';
  if (glow) glow.style.width = '100%';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  location.reload();
}

/* ─────────────────────────────────────────────────
   PDF GENERATION
   ───────────────────────────────────────────────── */

function generatePDF() {
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({ unit: 'mm', format: 'a4' });

  var W      = 210;
  var margin = 18;

  var NAVY  = [10,  22,  40];
  var GOLD  = [201, 168, 76];
  var CREAM = [250, 248, 243];
  var WHITE = [255, 255, 255];
  var DARK  = [10,  22,  40];
  var MID   = [58,  74,  107];
  var MUTED = [107, 122, 154];

  var y = 0;

  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(0, 0, W, 2.5, 'F');
  y = 2.5;

  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(0, y, W, 38, 'F');

  doc.setFillColor(20, 32, 64);
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y + 9, 46, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.text('YOUR LOGO HERE', margin + 23, y + 21, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.text('Golden Galleon Ship Management Services, Inc.', margin + 52, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.text('SEAFARER APPLICATION FORM', margin + 52, y + 24);
  doc.setFontSize(7.5);
  doc.setTextColor(180, 195, 220);
  var submittedDate = new Date().toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  doc.text('Submitted: ' + submittedDate, margin + 52, y + 31);

  y += 40.5;

  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(0, y, W, 1.5, 'F');
  y += 8;

  function checkNewPage() {
    if (y > 264) { doc.addPage(); y = 20; }
  }

  function sectionHeader(title) {
    checkNewPage();
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(margin, y, W - margin * 2, 8.5, 'F');
    doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.rect(margin, y, 3.5, 8.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.text(title.toUpperCase(), margin + 7, y + 6);
    y += 13;
  }

  function fieldLabel(lbl, x) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(lbl.toUpperCase(), x, y);
  }

  function fieldValue(val, x, maxWidth) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    var lines = doc.splitTextToSize(val || '—', maxWidth);
    doc.text(lines, x, y + 5);
    return lines.length;
  }

  function twoCol(label1, val1, label2, val2) {
    checkNewPage();
    var half = (W - margin * 2 - 8) / 2;
    fieldLabel(label1, margin);
    var lines1 = fieldValue(val1, margin, half);
    fieldLabel(label2, margin + half + 8);
    var lines2 = fieldValue(val2, margin + half + 8, half);
    y += Math.max(lines1, lines2) * 4.8 + 9;
  }

  function oneCol(label, val) {
    checkNewPage();
    fieldLabel(label, margin);
    var lines = fieldValue(val, margin, W - margin * 2);
    y += lines * 4.8 + 9;
  }

  sectionHeader('1. Position Details');
  twoCol('Position Applied For', getVal('position'), 'Availability Date', formatDate(getVal('avail')));
  twoCol('Contract Duration', getVal('contract'), 'Sea Experience', getVal('experience'));
  oneCol('Remarks / Notes', getVal('notes1') || '—');
  y += 2;

  sectionHeader('2. Personal Information');
  var fullName = [getVal('fname'), getVal('mname'), getVal('lname'), getVal('suffix')].filter(Boolean).join(' ') || '—';
  oneCol('Full Name', fullName);
  twoCol('Date of Birth', formatDate(getVal('dob')), 'Age', getVal('age') ? getVal('age') + ' years old' : '—');
  twoCol('Civil Status', getVal('civil') || '—', 'Emergency Contact', getVal('emname') || '—');
  oneCol('Complete Address', getVal('address'));
  twoCol('Contact Number', getVal('contact'), 'Email Address', getVal('email'));
  if (getVal('emnum')) twoCol('Emergency Contact Name', getVal('emname'), 'Emergency Number', getVal('emnum'));
  y += 2;

  sectionHeader('3. Documents & Training Certificates');
  var docs = getChecked('.doc-cb');
  var trns = getChecked('.trn-cb');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(MID[0], MID[1], MID[2]);
  doc.text('DOCUMENTS HELD:', margin, y);
  y += 5.5;
  renderPDFList(docs, doc, margin, y, W, GOLD, DARK, MID);
  y += Math.ceil(docs.length / 2) * 5.5 + (docs.length ? 4 : 8);

  checkNewPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(MID[0], MID[1], MID[2]);
  doc.text('TRAINING CERTIFICATES:', margin, y);
  y += 5.5;
  renderPDFList(trns, doc, margin, y, W, GOLD, DARK, MID);
  y += Math.ceil(trns.length / 2) * 5.5 + (trns.length ? 4 : 8);

  y += 10;
  checkNewPage();

  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 70, y);
  doc.line(W - margin - 50, y, W - margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text("Applicant's Signature over Printed Name", margin, y + 4.5);
  doc.text('Date', W - margin - 20, y + 4.5);
  y += 16;

  checkNewPage();
  doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
  doc.rect(margin, y, W - margin * 2, 16, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(MID[0], MID[1], MID[2]);
  var declaration =
    'I hereby certify that all information provided in this application form is true and accurate ' +
    'to the best of my knowledge. I understand that any misrepresentation may result in ' +
    'disqualification or termination of employment.';
  var declLines = doc.splitTextToSize(declaration, W - margin * 2 - 10);
  doc.text(declLines, margin + 5, y + 5.5);
  y += 20;

  var pageCount = doc.internal.getNumberOfPages();
  for (var p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.rect(0, 285, W, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text('Golden Galleon Ship Management Services, Inc.', margin, 291.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(170, 185, 210);
    doc.text('+63 (2) 8533-2791  |  Room 312–313 Intramuros Corporate Plaza, Manila 1002', margin, 295);
    doc.setTextColor(130, 145, 170);
    doc.text('Page ' + p + ' of ' + pageCount, W - margin, 291.5, { align: 'right' });
  }

  var lastName  = getVal('lname')  || 'Applicant';
  var firstName = getVal('fname')  || '';
  doc.save('GGSMS_Application_' + lastName + '_' + firstName + '.pdf');
}

function renderPDFList(items, doc, margin, startY, W, GOLD, DARK, MID) {
  if (!items.length) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(MID[0], MID[1], MID[2]);
    doc.text('None selected', margin, startY);
    return;
  }
  var cols = 2;
  var colW = (W - margin * 2) / cols;
  var row  = 0;
  var col  = 0;

  items.forEach(function (item) {
    var x  = margin + col * colW;
    var yy = startY + row * 5.5;
    doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.circle(x + 2, yy - 1.2, 0.9, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(item, x + 5.5, yy);
    col++;
    if (col >= cols) { col = 0; row++; }
  });
}

/* ─────────────────────────────────────────────────
   UTILITIES
   ───────────────────────────────────────────────── */

function getVal(id) {
  var el = document.getElementById(id);
  return el ? (el.value || '').trim() : '';
}

function getChecked(selector) {
  return Array.from(document.querySelectorAll(selector + ':checked'))
    .map(function (el) { return el.value; });
}

function setText(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value || '—';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  var d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
