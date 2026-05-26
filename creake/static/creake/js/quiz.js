var qzStep = 0;
var qzAnswers = {};
var qzDir = 'right';

/* ── Floating emojis disabled ── */
function initQuizEmojis() {}

/* ── Open / close ── */
function openQuizModal() {
  document.getElementById('qzIntro').style.display = 'block';
  document.getElementById('qzStepWrap').style.display = 'none';
  document.getElementById('qzResults').classList.remove('active');
  qzStep = 0;
  qzAnswers = {};
  document.getElementById('quizOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function qzCloseShop() {
  document.getElementById('quizOverlay').classList.remove('active');
  document.body.style.overflow = '';
  var shop = document.querySelector('.main-content');
  if (shop) shop.scrollIntoView({ behavior: 'smooth' });
}

function qzRetake() {
  document.getElementById('qzResults').classList.remove('active');
  document.getElementById('qzIntro').style.display = 'block';
  qzStep = 0;
  qzAnswers = {};
}

function qzStart() {
  document.getElementById('qzIntro').style.display = 'none';
  document.getElementById('qzStepWrap').style.display = 'block';
  qzDir = 'right';
  renderQzStep();
}

/* ── Progress dots ── */
function renderQzDots() {
  document.getElementById('qzDots').innerHTML = QZ_QUESTIONS.map(function(_, i) {
    var c = 'qz-dot';
    if (i < qzStep) c += ' done';
    if (i === qzStep) c += ' active';
    return '<div class="' + c + '"></div>';
  }).join('');
}

/* ── Render a question card ── */
function renderQzStep() {
  var q = QZ_QUESTIONS[qzStep];
  document.getElementById('qzStepText').textContent = 'Step ' + (qzStep + 1) + ' of ' + QZ_QUESTIONS.length;
  document.getElementById('qzFill').style.width = ((qzStep + 1) / QZ_QUESTIONS.length * 100) + '%';
  renderQzDots();

  var sel = qzAnswers[q.id];
  var card = document.getElementById('qzQCard');
  card.className = 'qz-q-card ' + (qzDir === 'right' ? 'ar' : 'al');

  var optsHtml = q.opts.map(function(o) {
    return '<button class="qq-opt ' + (sel === o.v ? 'sel' : '') + '" onclick="qzSelectOpt(\'' + q.id + '\',\'' + o.v + '\',this)">'
      + '<div class="qq-opt-icon">' + o.ic + '</div>'
      + '<div><span class="qq-opt-lbl">' + o.lb + '</span><span class="qq-opt-desc">' + o.ds + '</span></div>'
      + '<div class="qq-check">\u2713</div>'
      + '</button>';
  }).join('');

  var isLast = qzStep === QZ_QUESTIONS.length - 1;

  card.innerHTML = ''
    + '<div class="qq-tag">\u{1F382} ' + q.tag + '</div>'
    + '<h3 class="qq-title">' + q.title + '</h3>'
    + '<p class="qq-sub">' + q.sub + '</p>'
    + '<div class="qq-opts ' + q.layout + '">' + optsHtml + '</div>'
    + '<div class="qq-nav">'
    +   '<button class="qq-back" onclick="qzBack()" ' + (qzStep === 0 ? 'disabled' : '') + '>&#8592; Back</button>'
    +   '<button class="qq-next" id="qzNextBtn" onclick="qzNext()" ' + (sel ? '' : 'disabled') + '>'
    +     (isLast ? 'See My Cakes \u{1F382}' : 'Next &#8594;')
    +   '</button>'
    + '</div>'
    + '<div class="qq-skip" onclick="qzSkip()">Skip this question</div>';
}

/* ── Option selection ── */
function qzSelectOpt(qId, val, btn) {
  qzAnswers[qId] = val;
  document.querySelectorAll('.qq-opt').forEach(function(b) { b.classList.remove('sel'); });
  btn.classList.add('sel');
  document.getElementById('qzNextBtn').disabled = false;
}

/* ── Navigation ── */
function qzNext() {
  if (qzStep < QZ_QUESTIONS.length - 1) {
    qzDir = 'right';
    qzStep++;
    renderQzStep();
  } else {
    showQzResults();
  }
}

function qzBack() {
  if (qzStep > 0) {
    qzDir = 'left';
    qzStep--;
    renderQzStep();
  }
}

function qzSkip() {
  if (qzStep < QZ_QUESTIONS.length - 1) {
    qzDir = 'right';
    qzStep++;
    renderQzStep();
  } else {
    showQzResults();
  }
}

/* ── Results ── */
function showQzResults() {
  document.getElementById('qzStepWrap').style.display = 'none';

  var uTags = Object.values(qzAnswers);

  // FIX: Score cakes by actual tag matches only — no random padding
  var scored = QZ_CAKES.map(function(c) {
    var matchCount = c.tags.filter(function(t) { return uTags.includes(t); }).length;
    return Object.assign({}, c, { matchCount: matchCount });
  }).sort(function(a, b) { return b.matchCount - a.matchCount; }).slice(0, 3);

  var prof = QZ_PROFILES[qzAnswers['mood']] || QZ_PROFILES['bold'];

  document.getElementById('qrConfetti').textContent = prof.cf;
  document.getElementById('qrTitle').textContent = prof.name;
  document.getElementById('qrDesc').textContent = prof.desc;
  document.getElementById('qrTags').innerHTML = prof.tags.map(function(t) {
    return '<span class="qr-tag">' + t + '</span>';
  }).join('');

  // FIX: Calculate real match percentage from actual answers
  document.getElementById('qrGrid').innerHTML = scored.map(function(c, i) {
    var pct = uTags.length > 0 ? Math.round(c.matchCount / uTags.length * 100) : 0;
    return '<div class="qr-card ' + (i === 0 ? 'top-pick' : '') + '" onclick="qzCloseShop()">'
      + '<div class="qr-img">'
      +   '<img src="' + c.img + '" alt="' + c.name + '" onerror="this.parentElement.style.background=\'linear-gradient(135deg,#ffe4f6,#fff0f6)\'">'
      +   (i === 0 ? '<div class="qr-pick-badge">\u2B50 Top Pick</div>' : '')
      +   '<div class="qr-match-pct">' + pct + '% match</div>'
      + '</div>'
      + '<div class="qr-info">'
      +   '<div class="qr-name">' + c.name + '</div>'
      +   '<div class="qr-why">' + c.why + '</div>'
      +   '<div class="qr-price">&#8369;' + c.price + '</div>'
      +   '<button class="qr-add" onclick="event.stopPropagation();addToCart(\'' + c.name + '\',' + c.price + ',\'' + c.img + '\')">Add to Cart</button>'
      + '</div>'
      + '</div>';
  }).join('');

  document.getElementById('qzResults').classList.add('active');
}