
/* =====================================================
   CREAKE — Dashboard Shared JavaScript
   Used by: base_dashboard.html and all dashboard pages
   ===================================================== */

/* ── User dropdown ── */
function toggleDropdown() {
  var d = document.getElementById('userDropdown');
  if (d) d.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  var w = document.querySelector('.user-dropdown-wrap');
  if (w && !w.contains(e.target)) {
    var d = document.getElementById('userDropdown');
    if (d) d.classList.remove('open');
  }
});

/* ── Toast notification ── */
function toast(msg) {
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 2800);
}

/* ── Wishlist remove (used on wishlist page) ── */
function removeWish(btn) {
  var card = btn.closest('.wish-card');
  card.style.transition = 'all 0.3s';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.8)';
  setTimeout(function() { card.remove(); }, 300);
  toast('Removed from wishlist!');
}

/* ── Profile notification toggle ── */
function toggleNotif(el, fieldId) {
  el.classList.toggle('on');
  var input = document.getElementById(fieldId);
  if (input) input.value = el.classList.contains('on') ? 'on' : '';
}