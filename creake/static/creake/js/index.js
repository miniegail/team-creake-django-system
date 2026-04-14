var cart = [];
var currentSort = 'name';
var filters = { category: 'all', search: '', maxPrice: 1000, minRating: 0 };

/* ── Auth modal ── */
function openAuthModal(tab) {
  switchAuthTab(tab || 'login');
  document.getElementById('authModalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  document.getElementById('authModalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('authModalOverlay')) closeAuthModal();
}

function switchAuthTab(tab) {
  document.getElementById('panelLogin').classList.toggle('active', tab === 'login');
  document.getElementById('panelSignup').classList.toggle('active', tab === 'signup');
  document.getElementById('authCardTitle').textContent = tab === 'login' ? 'Welcome Back!' : 'Join CREAKE!';
  document.getElementById('authCardSubtitle').textContent = tab === 'login'
    ? 'Sign in to your sweet account \u{1F370}'
    : 'Create your account and start baking \u{1F382}';
}

function togglePassword(id, btn) {
  var i = document.getElementById(id);
  i.type = i.type === 'password' ? 'text' : 'password';
  btn.textContent = i.type === 'password' ? '\u{1F441}\uFE0F' : '\u{1F648}';
}

function checkStrength(pw) {
  var s = document.getElementById('pwStrength');
  var f = document.getElementById('pwFill');
  var l = document.getElementById('pwLabel');
  if (!pw) { s.style.display = 'none'; return; }
  s.style.display = 'block';
  var sc = 0;
  if (pw.length >= 6) sc++;
  if (pw.length >= 10) sc++;
  if (/[A-Z]/.test(pw)) sc++;
  if (/[0-9]/.test(pw)) sc++;
  if (/[^A-Za-z0-9]/.test(pw)) sc++;
  var lv = [
    { w: '15%', bg: '#ff4444', t: 'Very Weak' },
    { w: '35%', bg: '#ff8c00', t: 'Weak' },
    { w: '60%', bg: '#ffc107', t: 'Fair' },
    { w: '80%', bg: '#66bb6a', t: 'Strong' },
    { w: '100%', bg: '#43a047', t: 'Very Strong' }
  ];
  var v = lv[Math.max(0, sc - 1)];
  f.style.width = v.w;
  f.style.background = v.bg;
  l.textContent = v.t;
  l.style.color = v.bg;
}

/* ── User dropdown ── */
function toggleUserDropdown() {
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

/* ── Notifications ── */
function showNotification(msg, type) {
  type = type || 'success';
  var n = document.createElement('div');
  n.className = 'notification ' + type;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(function() { n.remove(); }, 3000);
}

/* ── Scroll / active nav ── */
function scrollToSection(id) {
  var e = document.getElementById(id);
  if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

var navSections = [
  { id: 'hero-banner', navId: 'homeNav' },
  { id: 'main-content', navId: 'browseNav' }
];

function updateActiveNav() {
  var sp = window.scrollY + 80;
  var cur = navSections[0].navId;
  navSections.forEach(function(s) {
    var e = document.getElementById(s.id);
    if (e && e.offsetTop <= sp) cur = s.navId;
  });
  document.querySelectorAll('.header-nav a[id]').forEach(function(l) {
    l.classList.remove('active');
  });
  var a = document.getElementById(cur);
  if (a) a.classList.add('active');
}

window.addEventListener('scroll', updateActiveNav);
window.addEventListener('load', updateActiveNav);

/* ── Cart ── */
function updateCartCount() {
  document.getElementById('cartCount').textContent = cart.reduce(function(s, i) {
    return s + i.quantity;
  }, 0);
}

/* ── Stars ── */
function generateStars(r) {
  return '\u2B50'.repeat(Math.floor(r));
}

/**
 * Renders clickable star rating HTML for a cake.
 * Shows the user's own previous rating if they've already rated.
 * Falls back to static stars if no cakeId (demo/fallback data).
 */
function renderRatingStars(rating, cakeId) {
  if (!cakeId) {
    return '<span class="stars">' + generateStars(rating) + '</span>';
  }

  // Check if this user has already rated this cake
  var userRating = (typeof userRatings !== 'undefined' && userRatings[String(cakeId)]) ? userRatings[String(cakeId)] : 0;
  var displayRating = userRating > 0 ? userRating : Math.round(rating);
  var label = userRating > 0 ? 'Your rating:' : 'Rate:';

  var stars = '';
  for (var i = 1; i <= 5; i++) {
    var filled = i <= displayRating;
    stars += '<span'
      + ' class="star-btn"'
      + ' data-value="' + i + '"'
      + ' onclick="submitRating(' + cakeId + ',' + i + ')"'
      + ' onmouseover="hoverStars(this,' + i + ',' + cakeId + ')"'
      + ' onmouseout="resetStars(' + cakeId + ',' + displayRating + ')"'
      + ' style="cursor:pointer;font-size:20px;color:' + (filled ? '#f5a623' : '#ddd') + ';transition:color 0.15s;"'
      + '>\u2605</span>';
  }

  return '<div class="cake-rating-stars" data-cake-id="' + cakeId + '" data-current-rating="' + displayRating + '" data-user-rating="' + userRating + '">'
    + '<span class="rate-label">' + label + '</span>'
    + stars
    + '</div>';
}

/** Lights up stars on hover */
function hoverStars(el, value, cakeId) {
  var container = document.querySelector('[data-cake-id="' + cakeId + '"]');
  if (!container) return;
  container.querySelectorAll('.star-btn').forEach(function(star) {
    star.style.color = parseInt(star.dataset.value) <= value ? '#ffb300' : '#ddd';
  });
}

/** Resets stars back to the saved rating after hover */
function resetStars(cakeId, savedRating) {
  var container = document.querySelector('[data-cake-id="' + cakeId + '"]');
  if (!container) return;
  container.querySelectorAll('.star-btn').forEach(function(star) {
    star.style.color = parseInt(star.dataset.value) <= savedRating ? '#f5a623' : '#ddd';
  });
}

/**
 * Custom confirmation dialog — nicer than browser confirm().
 * Calls onConfirm() if user clicks Yes, onCancel() if No.
 */
function showRatingConfirm(cakeId, previousRating, newValue, onConfirm, onCancel) {
  // Remove any existing dialog
  var existing = document.getElementById('ratingConfirmDialog');
  if (existing) existing.remove();

  var dialog = document.createElement('div');
  dialog.id = 'ratingConfirmDialog';
  dialog.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
    'background:rgba(0,0,0,0.5)', 'z-index:9999',
    'display:flex', 'align-items:center', 'justify-content:center',
    'backdrop-filter:blur(3px)'
  ].join(';');

  var stars = function(n) {
    return '\u2605'.repeat(n) + '\u2606'.repeat(5 - n);
  };

  dialog.innerHTML = '<div style="'
    + 'background:white;border-radius:20px;padding:30px 35px;max-width:360px;width:90%;'
    + 'box-shadow:0 20px 60px rgba(0,0,0,0.2);text-align:center;'
    + 'animation:popIn 0.25s ease;font-family:Poppins,sans-serif;">'
    + '<div style="font-size:40px;margin-bottom:12px;">\u{1F370}</div>'
    + '<h3 style="color:#d7736b;margin:0 0 8px;font-size:17px;font-weight:700;">You already rated this cake!</h3>'
    + '<p style="color:#888;font-size:13px;margin:0 0 6px;">Your previous rating: '
    + '<strong style="color:#f5a623;">' + stars(previousRating) + '</strong></p>'
    + '<p style="color:#888;font-size:13px;margin:0 0 20px;">Change to: '
    + '<strong style="color:#ffb300;">' + stars(newValue) + '</strong></p>'
    + '<div style="display:flex;gap:10px;justify-content:center;">'
    + '<button id="ratingConfirmNo" style="'
    + 'flex:1;padding:11px;border:2px solid #ffe4f6;background:white;color:#d7736b;'
    + 'border-radius:10px;cursor:pointer;font-weight:700;font-family:Poppins,sans-serif;font-size:13px;">'
    + 'Keep ' + previousRating + ' \u2605</button>'
    + '<button id="ratingConfirmYes" style="'
    + 'flex:1;padding:11px;border:none;background:linear-gradient(135deg,#d7736b,#c9605a);color:white;'
    + 'border-radius:10px;cursor:pointer;font-weight:700;font-family:Poppins,sans-serif;font-size:13px;">'
    + 'Change to ' + newValue + ' \u2605</button>'
    + '</div></div>';

  document.body.appendChild(dialog);

  document.getElementById('ratingConfirmYes').onclick = function() {
    dialog.remove();
    onConfirm();
  };
  document.getElementById('ratingConfirmNo').onclick = function() {
    dialog.remove();
    onCancel();
  };
  dialog.addEventListener('click', function(e) {
    if (e.target === dialog) { dialog.remove(); onCancel(); }
  });
}

/**
 * Submits a user star rating to the Django backend.
 * If user already rated, shows a confirmation dialog first.
 * Prompts login modal if the user is not authenticated.
 */
function submitRating(cakeId, value) {
  if (typeof isLoggedIn === 'undefined' || !isLoggedIn) {
    openAuthModal('login');
    return;
  }

  var container = document.querySelector('[data-cake-id="' + cakeId + '"]');
  var previousRating = container ? parseInt(container.dataset.userRating) : 0;

  // If already rated, show confirmation dialog
  if (previousRating > 0) {
    showRatingConfirm(cakeId, previousRating, value,
      function() { doSubmitRating(cakeId, value, container); },  // confirmed
      function() { resetStars(cakeId, previousRating); }         // cancelled
    );
    return;
  }

  doSubmitRating(cakeId, value, container);
}

/** Actually sends the rating to the server */
function doSubmitRating(cakeId, value, container) {
  // Optimistically update UI
  if (container) {
    container.querySelectorAll('.star-btn').forEach(function(star) {
      star.style.color = parseInt(star.dataset.value) <= value ? '#f5a623' : '#ddd';
    });
    container.dataset.currentRating = value;
    container.dataset.userRating = value;
    // Update label to "Your rating:"
    var label = container.querySelector('.rate-label');
    if (label) label.textContent = 'Your rating:';
  }

  // Read CSRF token from cookie (most reliable method)
  var csrf = (function() {
    var match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : (typeof csrfToken !== 'undefined' ? csrfToken : '');
  })();

  fetch('/rate-cake/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrf
    },
    body: JSON.stringify({ cake_id: cakeId, rating: value })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      showNotification('Rating saved! \u2B50', 'success');
      var newRating = Math.round(data.new_rating);
      if (container) {
        container.querySelectorAll('.star-btn').forEach(function(star) {
          star.style.color = parseInt(star.dataset.value) <= newRating ? '#f5a623' : '#ddd';
        });
        container.dataset.currentRating = newRating;
        // Update review count
        var reviewEl = container.parentElement.querySelector('.review-count');
        if (reviewEl) reviewEl.textContent = '(' + data.review_count + ')';
      }
      // Update local userRatings so re-rate detection works without page refresh
      if (typeof userRatings !== 'undefined') userRatings[String(cakeId)] = value;
    } else {
      showNotification('Could not save rating.', 'error');
    }
  })
  .catch(function() {
    showNotification('Something went wrong. Please try again.', 'error');
  });
}

/* ── Filters ── */
function applyFilters() {
  filters.category  = document.getElementById('categoryFilter').value;
  filters.search    = document.getElementById('searchCake').value.toLowerCase();
  filters.maxPrice  = parseInt(document.getElementById('priceRange').value);
  filters.minRating = parseFloat(document.getElementById('ratingFilter').value);
  renderCakes(getFilteredAndSortedCakes());
  if (window.innerWidth <= 1024) {
    document.querySelector('.filters-panel').classList.remove('mobile-active');
  }
}

function clearFilters() {
  document.getElementById('categoryFilter').value = 'all';
  document.getElementById('searchCake').value = '';
  document.getElementById('priceRange').value = '1000';
  document.getElementById('ratingFilter').value = '0';
  document.getElementById('priceDisplay').textContent = '1000';
  filters = { category: 'all', search: '', maxPrice: 1000, minRating: 0 };
  renderCakes(getFilteredAndSortedCakes());
}

function toggleMobileFilters() {
  document.querySelector('.filters-panel').classList.toggle('mobile-active');
}

function getFilteredAndSortedCakes() {
  var f = cakesData.filter(function(c) {
    return (filters.category === 'all' || c.category === filters.category)
      && c.name.toLowerCase().includes(filters.search)
      && c.price <= filters.maxPrice
      && c.rating >= filters.minRating;
  });
  if (currentSort === 'price-low')       f.sort(function(a, b) { return a.price - b.price; });
  else if (currentSort === 'price-high') f.sort(function(a, b) { return b.price - a.price; });
  else if (currentSort === 'rating')     f.sort(function(a, b) { return b.rating - a.rating; });
  else if (currentSort === 'newest')     f.sort(function(a, b) { return b.new - a.new; });
  else                                   f.sort(function(a, b) { return a.name.localeCompare(b.name); });
  return f;
}

/* ── Cake grid render ── */
function renderCakes(arr) {
  var g = document.getElementById('cakeGrid');
  g.innerHTML = '';
  document.getElementById('resultsCount').textContent = arr.length;
  if (!arr.length) {
    g.innerHTML = '<div class="no-results">'
      + '<div class="no-results-icon">\u{1F50D}</div>'
      + '<h3 class="no-results-title">No cakes found</h3>'
      + '<p class="no-results-text">Try adjusting your filters</p>'
      + '</div>';
    return;
  }
  arr.forEach(function(c) {
    var card = document.createElement('div');
    card.className = 'cake-card';
    card.innerHTML = '<div class="cake-image-wrapper">'
      + '<img src="' + c.img + '" alt="' + c.name + '">'
      + (c.badge ? '<div class="cake-badge">' + c.badge + '</div>' : '')
      + '</div>'
      + '<div class="cake-content">'
      + '<h3>' + c.name + '</h3>'
      + '<p class="cake-desc">' + c.desc + '</p>'
      + '<div class="cake-rating">'
      +   renderRatingStars(c.rating, c.id)
      +   '<span class="review-count">(' + c.reviews + ')</span>'
      + '</div>'
      + '<div class="cake-price">&#8369;' + c.price + '</div>'
      + '<div class="cake-actions">'
      + '<button class="add-to-cart-btn" onclick="addToCart(\'' + c.name + '\',' + c.price + ',\'' + c.img + '\')">Add to Cart</button>'
      + '</div></div>';
    g.appendChild(card);
  });
}

/* ── Cart actions ── */
function addToCart(name, price, img) {
  var ex = cart.find(function(i) { return i.name === name; });
  if (ex) ex.quantity++;
  else cart.push({ name: name, price: price, img: img, quantity: 1 });
  updateCartCount();
  renderCart();
  showNotification(name + ' added to cart! \u{1F382}');
}

function removeFromCart(name) {
  cart = cart.filter(function(i) { return i.name !== name; });
  updateCartCount();
  renderCart();
}

function updateQuantity(name, change) {
  var i = cart.find(function(x) { return x.name === name; });
  if (i) {
    i.quantity += change;
    if (i.quantity <= 0) removeFromCart(name);
    else renderCart();
  }
}

function renderCart() {
  var list = document.getElementById('cartItemsList');
  if (!cart.length) {
    list.innerHTML = '<div class="cart-empty">'
      + '<div class="cart-empty-icon">\u{1F6D2}</div>'
      + '<p><strong>Your cart is empty!</strong></p>'
      + '<p style="font-size:12px;color:#999;margin-top:10px;">Add some delicious cakes to get started.</p>'
      + '</div>';
    document.getElementById('checkoutBtn').disabled = true;
    updateTotals();
    return;
  }
  document.getElementById('checkoutBtn').disabled = false;
  list.innerHTML = cart.map(function(i) {
    return '<div class="cart-item">'
      + '<img src="' + i.img + '" alt="' + i.name + '" class="cart-item-img">'
      + '<div class="cart-item-info">'
      + '<h4>' + i.name + '</h4>'
      + '<p>&#8369;' + i.price + '</p>'
      + '<div class="cart-item-qty">'
      + '<button onclick="updateQuantity(\'' + i.name + '\',-1)">\u2212</button>'
      + '<span>' + i.quantity + '</span>'
      + '<button onclick="updateQuantity(\'' + i.name + '\',1)">+</button>'
      + '</div></div>'
      + '<button class="remove-item" onclick="removeFromCart(\'' + i.name + '\')">&#10005;</button>'
      + '</div>';
  }).join('');
  updateTotals();
}

function updateTotals() {
  var sub = cart.reduce(function(s, i) { return s + (i.price * i.quantity); }, 0);
  var dt  = document.getElementById('deliveryType').value;
  var del = dt === 'standard' ? 50 : dt === 'express' ? 150 : dt === 'sameday' ? 300 : 0;
  document.getElementById('subtotal').textContent = '&#8369;' + sub.toFixed(2);
  document.getElementById('delivery').textContent = '&#8369;' + del.toFixed(2);
  document.getElementById('total').textContent    = '&#8369;' + (sub + del).toFixed(2);
}

function updateDelivery() { updateTotals(); }
function toggleCart() { document.getElementById('cartModal').classList.toggle('active'); }
function openCheckout() { document.getElementById('checkoutModal').classList.add('active'); renderCheckoutSummary(); }
function closeCheckout() { document.getElementById('checkoutModal').classList.remove('active'); }

function renderCheckoutSummary() {
  var s = document.getElementById('checkoutSummary');
  if (!cart.length) { s.innerHTML = '<p>No items in cart.</p>'; return; }
  var sub = cart.reduce(function(t, i) { return t + i.price * i.quantity; }, 0);
  s.innerHTML = '<h3>Order Summary</h3>'
    + cart.map(function(i) {
        return '<div class="order-item"><span>' + i.name + ' \xD7 ' + i.quantity + '</span>'
          + '<span>&#8369;' + (i.price * i.quantity).toFixed(2) + '</span></div>';
      }).join('')
    + '<div class="order-total"><span>Total</span><span>&#8369;' + sub.toFixed(2) + '</span></div>';
}

function setGridView(cols) {
  document.querySelectorAll('.view-toggle button').forEach(function(b) { b.classList.remove('active'); });
  document.querySelector('.view-toggle button:nth-child(' + (4 - cols) + ')').classList.add('active');
  document.getElementById('cakeGrid').style.gridTemplateColumns = cols === 1
    ? '1fr'
    : cols === 2
      ? 'repeat(auto-fill,minmax(300px,1fr))'
      : 'repeat(auto-fill,minmax(220px,1fr))';
}

/* ── Init — called after inline data block in index.html ── */
function initShop() {
  /* Smooth scroll nav links */
  document.querySelectorAll('.header-nav a[href^="#"]').forEach(function(l) {
    l.addEventListener('click', function(e) {
      e.preventDefault();
      var el = document.getElementById(this.getAttribute('href').substring(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* Sort dropdown */
  var sortEl = document.getElementById('sortBy');
  if (sortEl) sortEl.addEventListener('change', function() {
    currentSort = this.value;
    renderCakes(getFilteredAndSortedCakes());
  });

  /* Price range */
  var rangeEl = document.getElementById('priceRange');
  if (rangeEl) rangeEl.addEventListener('input', function() {
    document.getElementById('priceDisplay').textContent = this.value;
  });

  /* Start button */
  var startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.addEventListener('click', function() {
    document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
  });

  /* Checkout form */
  var checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) checkoutForm.addEventListener('submit', function(e) {
    e.preventDefault();
    showNotification('\u{1F389} Order placed successfully!');
    cart = [];
    updateCartCount();
    renderCart();
    closeCheckout();
    toggleCart();
    this.reset();
  });

  /* Init quiz emojis */
  if (typeof initQuizEmojis === 'function') initQuizEmojis();

  /* Render shop */
  renderCakes(getFilteredAndSortedCakes());
  updateCartCount();
}