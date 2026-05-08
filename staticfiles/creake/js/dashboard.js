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

/* ── CSRF helper ── */
function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    document.cookie.split(';').forEach(function(cookie) {
      var c = cookie.trim();
      if (c.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(c.slice(name.length + 1));
      }
    });
  }
  return cookieValue;
}

/* ── Toast notification ── */
function toast(msg) {
  var t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 2800);
}

/* ── Cart badge sync from localStorage ── */
function syncCartBadge() {
  try {
    var cart = JSON.parse(localStorage.getItem('cart') || '[]');
    var total = cart.reduce(function(s, i) { return s + i.quantity; }, 0);
    document.querySelectorAll('.cart-count').forEach(function(el) {
      el.textContent = total;
    });
  } catch(e) {}
}
document.addEventListener('DOMContentLoaded', syncCartBadge);

/* ── Wishlist remove — calls Django, then animates card out ── */
function removeWish(btn) {
  var card = btn.closest('.wish-card');
  var cakeId = card.dataset.cakeId;

  fetch('/wishlist/toggle/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken'),
    },
    body: JSON.stringify({ cake_id: parseInt(cakeId) }),
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      setTimeout(function() {
        card.remove();
        // Update sidebar wishlist badge
        var badge = document.getElementById('wishlist-side-count');
        if (badge) badge.textContent = Math.max(0, parseInt(badge.textContent || '0') - 1);
        // Show empty state if no cards left
        var grid = document.querySelector('.wishlist-grid');
        if (grid && !grid.querySelector('.wish-card')) {
          grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">'
            + '<div style="font-size:48px;margin-bottom:16px;">&#128150;</div>'
            + '<h3 style="color:var(--coral)">Your Wishlist is Empty</h3>'
            + '<p style="color:var(--text-muted);font-size:13px;margin-bottom:20px;">Save cakes you love and come back to order them anytime.</p>'
            + '<a href="/#main-content" style="background:linear-gradient(135deg,var(--coral),var(--coral-dark));color:white;padding:12px 28px;border-radius:25px;text-decoration:none;font-weight:700;font-size:13px;">&#127874; Browse Cakes</a>'
            + '</div>';
        }
      }, 300);
      toast('Removed from wishlist!');
    } else {
      toast('Could not remove. Please try again.');
    }
  })
  .catch(function() {
    toast('Could not remove. Please try again.');
  });
}

/* ── Add to cart from wishlist (writes to localStorage) ── */
function addToCartFromWishlist(name, price, cakeId) {
  try {
    var cart = JSON.parse(localStorage.getItem('cart') || '[]');
    var existing = cart.find(function(i) { return i.id === cakeId; });
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: cakeId, name: name, price: price, img: '', quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    syncCartBadge();
    toast('\uD83D\uDED2 ' + name + ' added to cart!');
  } catch(e) {
    toast('Could not add to cart.');
  }
}

/* ── Profile notification toggle ── */
function toggleNotif(el, fieldId) {
  el.classList.toggle('on');
  var input = document.getElementById(fieldId);
  if (input) input.value = el.classList.contains('on') ? 'on' : '';
}