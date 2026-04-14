var cart = [];
var currentSort = 'name';
var filters = { category: 'all', search: '', maxPrice: 1000, minRating: 0 };

/* ── localStorage cart helpers ── */
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
  try {
    var stored = localStorage.getItem('cart');
    cart = stored ? JSON.parse(stored) : [];
  } catch(e) {
    cart = [];
  }
}

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

/* ── Cart count ── */
function updateCartCount() {
  var total = cart.reduce(function(s, i) { return s + i.quantity; }, 0);
  // Update all .cart-count badges on the page
  document.querySelectorAll('.cart-count, #cartCount').forEach(function(el) {
    el.textContent = total;
  });
  saveCart();
}

/* ── Stars — read-only display only ── */
function renderRatingStars(rating) {
  var displayRating = Math.round(rating) || 0;
  var stars = '';
  for (var i = 1; i <= 5; i++) {
    stars += '<span style="font-size:16px;color:' + (i <= displayRating ? '#f5a623' : '#ddd') + ';">★</span>';
  }
  return '<div style="display:inline-flex;align-items:center;gap:2px;">' + stars + '</div>';
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
    var wishlisted = typeof wishlistIds !== 'undefined' && wishlistIds.has(c.id);
    card.innerHTML = '<div class="cake-image-wrapper" style="position:relative;">'
      + '<img src="' + c.img + '" alt="' + c.name + '">'
      + (c.badge ? '<div class="cake-badge">' + c.badge + '</div>' : '')
      + '</div>'
      + '<div class="cake-content">'
      + '<h3>' + c.name + '</h3>'
      + '<p class="cake-desc">' + c.desc + '</p>'
      + '<div class="cake-rating">'
      +   renderRatingStars(c.rating)
      +   '<span class="review-count">(' + c.reviews + ')</span>'
      + '</div>'
      + '<div class="cake-price">&#8369;' + c.price + '</div>'
      + '<div class="cake-actions" style="display:flex;gap:8px;align-items:center;">'
      + '<button class="add-to-cart-btn" style="flex:1;">Add to Cart</button>'
      + '<button class="card-wishlist-btn" data-id="' + c.id + '" style="background:white;border:1.5px solid #f0b9b5;border-radius:10px;width:38px;height:38px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:' + (wishlisted ? '#d7736b' : '#ccc') + ';flex-shrink:0;">'
      + (wishlisted ? '&#9829;' : '&#9825;')
      + '</button>'
      + '</div></div>';
    var wishBtn = card.querySelector('.card-wishlist-btn');
    wishBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var cakeId = c.id;
      if (!isLoggedIn) { showNotification('Please log in to save to wishlist.', 'error'); return; }
      fetch('/wishlist/toggle/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ cake_id: cakeId }),
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          if (data.wishlisted) {
            wishlistIds.add(cakeId);
            wishBtn.innerHTML = '&#9829;';
            wishBtn.style.color = '#d7736b';
            showNotification(c.name + ' added to wishlist! ♡');
          } else {
            wishlistIds.delete(cakeId);
            wishBtn.innerHTML = '&#9825;';
            wishBtn.style.color = '#999';
            showNotification(c.name + ' removed from wishlist.');
          }
        }
      })
      .catch(function() { showNotification('Could not update wishlist.', 'error'); });
    });
    wishBtn.style.color = wishlisted ? '#d7736b' : '#999';

    var btn = card.querySelector('.add-to-cart-btn');
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      addToCart(c.name, c.price, c.img, c.id);
    });
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() {
      openCakeDetail(c);
    });
    g.appendChild(card);
  });
}

/* ── Cart actions ── */
function addToCart(name, price, img, id) {
  // Match by id if available, fallback to name (for wishlist items that have id)
  var ex = cart.find(function(i) {
    return id ? i.id === id : i.name === name;
  });
  if (ex) {
    ex.quantity++;
  } else {
    cart.push({ id: id || null, name: name, price: price, img: img || '', quantity: 1 });
  }
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
    else { renderCart(); saveCart(); }
  }
}

function renderCart() {
  var list = document.getElementById('cartItemsList');
  if (!list) return;
  if (!cart.length) {
    list.innerHTML = '<div class="cart-empty">'
      + '<div class="cart-empty-icon">\u{1F6D2}</div>'
      + '<p><strong>Your cart is empty!</strong></p>'
      + '<p style="font-size:12px;color:#999;margin-top:10px;">Add some delicious cakes to get started.</p>'
      + '</div>';
    var btn = document.getElementById('checkoutBtn');
    if (btn) btn.disabled = true;
    updateTotals();
    return;
  }
  var btn = document.getElementById('checkoutBtn');
  if (btn) btn.disabled = false;
  list.innerHTML = cart.map(function(i) {
    // Fallback image — if img is empty (added from wishlist page), look it up from cakesData
    var imgSrc = i.img;
    if (!imgSrc && typeof cakesData !== 'undefined') {
      var match = cakesData.find(function(c) { return c.id === i.id || c.name === i.name; });
      if (match) imgSrc = match.img;
    }
    return '<div class="cart-item">'
      + (imgSrc ? '<img src="' + imgSrc + '" alt="' + i.name + '" class="cart-item-img">' : '')
      + '<div class="cart-item-info">'
      + '<h4>' + i.name + '</h4>'
      + '<p>&#8369;' + i.price + '</p>'
      + '<div class="cart-item-qty">'
      + '<button onclick="updateQuantity(\'' + i.name.replace(/'/g, "\\'") + '\',-1)">\u2212</button>'
      + '<span>' + i.quantity + '</span>'
      + '<button onclick="updateQuantity(\'' + i.name.replace(/'/g, "\\'") + '\',1)">+</button>'
      + '</div></div>'
      + '<button class="remove-item" onclick="removeFromCart(\'' + i.name.replace(/'/g, "\\'") + '\')">&#10005;</button>'
      + '</div>';
  }).join('');
  updateTotals();
}

function updateTotals() {
  var sub = cart.reduce(function(s, i) { return s + (i.price * i.quantity); }, 0);
  if (document.getElementById('subtotal')) document.getElementById('subtotal').textContent = '&#8369;' + sub.toFixed(2);
  if (document.getElementById('delivery')) document.getElementById('delivery').textContent = '&#8369;0.00';
  if (document.getElementById('total'))    document.getElementById('total').textContent    = '&#8369;' + sub.toFixed(2);
}

function updateDelivery() {
  var sub = cart.reduce(function(s, i) { return s + (i.price * i.quantity); }, 0);
  var dt  = document.getElementById('deliveryType') ? document.getElementById('deliveryType').value : '';
  var del = dt === 'standard' ? 50 : dt === 'express' ? 150 : dt === 'sameday' ? 300 : 0;
  if (document.getElementById('delivery'))  document.getElementById('delivery').textContent  = '&#8369;' + del.toFixed(2);
  if (document.getElementById('delivery2')) document.getElementById('delivery2').textContent = '&#8369;' + del.toFixed(2);
  if (document.getElementById('total'))     document.getElementById('total').textContent     = '&#8369;' + (sub + del).toFixed(2);
  if (document.getElementById('total2'))    document.getElementById('total2').textContent    = '&#8369;' + (sub + del).toFixed(2);
}

function toggleCart() { document.getElementById('cartModal').classList.toggle('active'); }
function openCheckout() { document.getElementById('checkoutModal').classList.add('active'); renderCheckoutSummary(); }
function closeCheckout() { document.getElementById('checkoutModal').classList.remove('active'); }

function renderCheckoutSummary() {
  var s = document.getElementById('checkoutSummary');
  if (!s) return;
  if (!cart.length) { s.innerHTML = '<p>No items in cart.</p>'; return; }
  var sub = cart.reduce(function(t, i) { return t + i.price * i.quantity; }, 0);
  s.innerHTML = '<h3>Order Summary</h3>'
    + cart.map(function(i) {
        return '<div class="order-item"><span>' + i.name + ' \xD7 ' + i.quantity + '</span>'
          + '<span>&#8369;' + (i.price * i.quantity).toFixed(2) + '</span></div>';
      }).join('')
    + '<div class="order-total"><span>Total</span><span>&#8369;' + sub.toFixed(2) + '</span></div>';
  if (document.getElementById('subtotal2')) document.getElementById('subtotal2').textContent = '&#8369;' + sub.toFixed(2);
  if (document.getElementById('delivery2')) document.getElementById('delivery2').textContent = '&#8369;0.00';
  if (document.getElementById('total2'))    document.getElementById('total2').textContent    = '&#8369;' + sub.toFixed(2);
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

/* ── Reviews ── */
var allReviews = [];
var reviewPage = 1;
var reviewsPerPage = 5;
var selectedRating = 0;

function loadReviews(cakeId) {
  document.getElementById('reviewsList').innerHTML = '<div style="text-align:center;color:#bbb;font-size:13px;padding:20px 0;">Loading reviews...</div>';
  fetch('/cakes/' + cakeId + '/reviews/')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      allReviews = data.reviews;
      reviewPage = 1;
      renderReviewMeta(data.avg, data.count);
      renderReviewsPage();
    })
    .catch(function() {
      document.getElementById('reviewsList').innerHTML = '<div style="text-align:center;color:#bbb;font-size:13px;padding:20px 0;">Could not load reviews.</div>';
    });
}

function renderReviewMeta(avg, count) {
  document.getElementById('reviewCountLabel').textContent = '(' + count + ')';
  var avgEl = document.getElementById('reviewAvgNum');
  var starsEl = document.getElementById('reviewAvgStars');
  if (count === 0) { avgEl.textContent = ''; starsEl.innerHTML = ''; return; }
  avgEl.textContent = avg.toFixed(1);
  var stars = '';
  for (var i = 1; i <= 5; i++) {
    stars += '<span style="color:' + (i <= Math.round(avg) ? '#f5a623' : '#ddd') + ';">★</span>';
  }
  starsEl.innerHTML = stars;
}

function renderReviewsPage() {
  var list = document.getElementById('reviewsList');
  var slice = allReviews.slice(0, reviewPage * reviewsPerPage);
  if (!allReviews.length) {
    list.innerHTML = '<div style="text-align:center;color:#bbb;font-size:13px;padding:24px 0;">No reviews yet. Be the first to review!</div>';
    document.getElementById('loadMoreWrap').style.display = 'none';
    return;
  }
  list.innerHTML = slice.map(function(r) {
    var stars = '';
    for (var i = 1; i <= 5; i++) {
      stars += '<span style="color:' + (i <= r.rating ? '#f5a623' : '#ddd') + ';font-size:13px;">★</span>';
    }
    return '<div style="background:#fafafa;border:1px solid #f0eded;border-radius:14px;padding:14px 16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">'
      + '<div>'
      + '<div style="font-weight:700;font-size:13px;color:#333;">'
      + (r.is_mine ? '👤 You' : '&#128100; ' + r.user)
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:4px;margin-top:2px;">' + stars + '<span style="font-size:11px;color:#bbb;margin-left:4px;">' + r.created_at + '</span></div>'
      + '</div>'
      + (r.is_mine
          ? '<button onclick="deleteReview()" style="background:none;border:none;color:#ccc;font-size:12px;cursor:pointer;padding:2px 6px;border-radius:6px;" title="Delete my review">&#128465;</button>'
          : '')
      + '</div>'
      + '<p style="margin:0;font-size:13px;color:#555;line-height:1.6;">' + escapeHtml(r.comment) + '</p>'
      + '</div>';
  }).join('');
  document.getElementById('loadMoreWrap').style.display =
    allReviews.length > reviewPage * reviewsPerPage ? 'block' : 'none';
}

function loadMoreReviews() {
  reviewPage++;
  renderReviewsPage();
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function setStarPicker(val) {
  selectedRating = val;
  document.querySelectorAll('.star-pick').forEach(function(s) {
    s.style.color = parseInt(s.dataset.v) <= val ? '#f5a623' : '#ddd';
  });
}

function initStarPicker() {
  // Clone each star to wipe all previously stacked event listeners
  document.querySelectorAll('.star-pick').forEach(function(s) {
    var fresh = s.cloneNode(true);
    s.parentNode.replaceChild(fresh, s);
  });
  // Re-attach listeners on the fresh nodes
  document.querySelectorAll('.star-pick').forEach(function(s) {
    s.addEventListener('mouseover', function() {
      document.querySelectorAll('.star-pick').forEach(function(x) {
        x.style.color = parseInt(x.dataset.v) <= parseInt(s.dataset.v) ? '#f5a623' : '#ddd';
      });
    });
    s.addEventListener('mouseout', function() { setStarPicker(selectedRating); });
    s.addEventListener('click', function() {
      setStarPicker(parseInt(s.dataset.v));
    });
  });
}

function submitReview() {
  if (!detailCake) return;
  if (!selectedRating) { showNotification("Please select a star rating.", "error"); return; }
  var comment = document.getElementById("reviewComment").value.trim();
  if (!comment) { showNotification("Please write something about this cake.", "error"); return; }
  var csrf = (function() {
    var match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : "";
  })();
  fetch("/cakes/" + detailCake.id + "/reviews/submit/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
    body: JSON.stringify({ rating: selectedRating, comment: comment }),
  })
  .then(function(r) {
    if (!r.ok) { return r.text().then(function(t) { throw new Error("Server " + r.status + ": " + t); }); }
    return r.json();
  })
  .then(function(data) {
    if (data.success) {
      showNotification(data.created ? "Review posted!" : "Review updated!");
      document.getElementById("reviewComment").value = "";
      selectedRating = 0;
      setStarPicker(0);
      var idx = allReviews.findIndex(function(r) { return r.is_mine; });
      if (idx > -1) allReviews.splice(idx, 1);
      allReviews.unshift(data.review);
      renderReviewMeta(data.new_avg, data.count);
      renderReviewsPage();
    } else {
      showNotification(data.error || "Could not post review.", "error");
    }
  })
  .catch(function(err) {
    console.error("Review submit error:", err);
    showNotification("Could not post review. Check console for details.", "error");
  });
}

function deleteReview() {
  if (!detailCake) return;
  if (!confirm('Delete your review?')) return;
  fetch('/cakes/' + detailCake.id + '/reviews/delete/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
    body: JSON.stringify({}),
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      showNotification('Review deleted.');
      allReviews = allReviews.filter(function(r) { return !r.is_mine; });
      renderReviewMeta(data.new_avg, data.count);
      renderReviewsPage();
    }
  })
  .catch(function() { showNotification('Could not delete review.', 'error'); });
}

/* ── Cake detail modal ── */
var detailCake = null;

function openCakeDetail(cake) {
  detailCake = cake;
  document.getElementById("detailImg").src          = cake.img;
  document.getElementById("detailImg").alt          = cake.name;
  document.getElementById("detailName").textContent = cake.name;
  document.getElementById("detailDesc").textContent = cake.desc;
  document.getElementById("detailPrice").textContent = "u20B1" + cake.price.toLocaleString();
  document.getElementById("detailStars").innerHTML   = renderRatingStars(cake.rating);
  document.getElementById("detailReviews").textContent = "(" + cake.reviews + " reviews)";
  document.getElementById("detailCategory").textContent = cake.category;
  var badge = document.getElementById("detailBadge");
  if (cake.badge) { badge.textContent = cake.badge; badge.style.display = "inline-block"; }
  else            { badge.style.display = "none"; }
  var newTag = document.getElementById("detailNew");
  newTag.style.display = cake.new ? "inline-block" : "none";
  updateWishlistBtn(typeof wishlistIds !== "undefined" && wishlistIds.has(cake.id));
  var reviewBadge = document.getElementById("detailReviewsBadge");
  if (reviewBadge) reviewBadge.textContent = cake.reviews + " reviews";
  document.getElementById("detailPanel").style.display = "block";
  document.getElementById("reviewsPanel").style.display = "none";
  document.getElementById("cakeDetailOverlay").style.display = "flex";
  document.body.style.overflow = "hidden";
  loadReviews(cake.id);
  selectedRating = 0;
}

function updateWishlistBtn(wishlisted) {
  var btn = document.getElementById('detailWishlistBtn');
  if (!btn) return;
  btn.innerHTML        = wishlisted ? '&#9829;' : '&#9825;';
  btn.style.color      = '#d7736b';
  btn.style.background = wishlisted ? '#fff0ef' : 'white';
}

function toggleWishlistFromDetail() {
  if (!isLoggedIn) { showNotification('Please log in to save to wishlist.', 'error'); return; }
  if (!detailCake) return;
  fetch('/wishlist/toggle/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
    body: JSON.stringify({ cake_id: detailCake.id }),
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      if (data.wishlisted) {
        wishlistIds.add(detailCake.id);
        showNotification(detailCake.name + ' added to wishlist! ♡');
      } else {
        wishlistIds.delete(detailCake.id);
        showNotification(detailCake.name + ' removed from wishlist.');
      }
      updateWishlistBtn(data.wishlisted);
    }
  })
  .catch(function() { showNotification('Could not update wishlist.', 'error'); });
}

function closeCakeDetail() {
  document.getElementById("cakeDetailOverlay").style.display = "none";
  document.getElementById("detailPanel").style.display = "block";
  document.getElementById("reviewsPanel").style.display = "none";
  document.body.style.overflow = "";
  detailCake = null;
  reviewPage = 1;
  allReviews = [];
  selectedRating = 0;
}

function handleDetailOverlayClick(e) {
  if (e.target === document.getElementById('cakeDetailOverlay')) closeCakeDetail();
}

function addToCartFromDetail() {
  if (!detailCake) return;
  addToCart(detailCake.name, detailCake.price, detailCake.img, detailCake.id);
  closeCakeDetail();
}

/* ── Saved-address checkout ── */
function submitSavedAddressOrder() {
  var deliveryType  = document.getElementById('deliveryType').value;
  var paymentMethod = document.getElementById('paymentMethod').value;
  if (!deliveryType)  { showNotification('Please select a delivery option.', 'error'); return; }
  if (!paymentMethod) { showNotification('Please select a payment method.', 'error'); return; }

  var csrf = (function() {
    var match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
  })();

  var payload = {
    cart: cart.map(function(i) {
      return { name: i.name, price: i.price, quantity: i.quantity };
    }),
    delivery_type:     deliveryType,
    payment_method:    paymentMethod,
    use_saved_address: true,
    notes: document.getElementById('notes') ? document.getElementById('notes').value : '',
  };

  fetch('/checkout/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
    body: JSON.stringify(payload),
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.success) {
      showNotification('🎉 Order placed successfully!');
      cart = [];
      updateCartCount();
      renderCart();
      closeCheckout();
      localStorage.removeItem('cart');
    } else {
      showNotification(data.error || 'Something went wrong.', 'error');
    }
  })
  .catch(function() {
    showNotification('Could not place order. Please try again.', 'error');
  });
}

/* ── Init ── */
function initShop() {
  // Load cart from localStorage first (picks up items added from wishlist page)
  loadCart();

  document.querySelectorAll('.header-nav a[href^="#"]').forEach(function(l) {
    l.addEventListener('click', function(e) {
      e.preventDefault();
      var el = document.getElementById(this.getAttribute('href').substring(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  var sortEl = document.getElementById('sortBy');
  if (sortEl) sortEl.addEventListener('change', function() {
    currentSort = this.value;
    renderCakes(getFilteredAndSortedCakes());
  });

  var rangeEl = document.getElementById('priceRange');
  if (rangeEl) rangeEl.addEventListener('input', function() {
    document.getElementById('priceDisplay').textContent = this.value;
  });

  var startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.addEventListener('click', function() {
    document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
  });

  var checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) checkoutForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var csrf = (function() {
      var match = document.cookie.match(/csrftoken=([^;]+)/);
      return match ? match[1] : '';
    })();

    var deliveryType  = document.getElementById('deliveryType').value;
    var paymentMethod = document.getElementById('paymentMethod') ? document.getElementById('paymentMethod').value : 'cash';

    var payload = {
      cart: cart.map(function(i) {
        return { name: i.name, price: i.price, quantity: i.quantity };
      }),
      delivery_type:  deliveryType,
      payment_method: paymentMethod,
      address:  document.getElementById('address')    ? document.getElementById('address').value    : '',
      city:     document.getElementById('city')       ? document.getElementById('city').value       : '',
      zip_code: document.getElementById('postalCode') ? document.getElementById('postalCode').value : '',
      phone:    document.getElementById('phoneField') ? document.getElementById('phoneField').value : '',
      notes:    document.getElementById('notes')      ? document.getElementById('notes').value      : '',
    };

    fetch('/checkout/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
      body: JSON.stringify(payload),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        showNotification('🎉 Order placed successfully!');
        cart = [];
        updateCartCount();
        renderCart();
        closeCheckout();
        toggleCart();
        checkoutForm.reset();
        localStorage.removeItem('cart');
      } else {
        showNotification(data.error || 'Something went wrong.', 'error');
      }
    })
    .catch(function() {
      showNotification('Could not place order. Please try again.', 'error');
    });
  });

  if (typeof initQuizEmojis === 'function') initQuizEmojis();

  renderCakes(getFilteredAndSortedCakes());
  updateCartCount();
  renderCart();
}

/* ── Reviews panel open/close ── */
function openReviewsPanel() {
  document.getElementById('detailPanel').style.display = 'none';
  document.getElementById('reviewsPanel').style.display = 'block';
  // Scroll modal back to top
  document.getElementById('cakeDetailBox').scrollTop = 0;
  // Init star picker fresh each time panel opens
  initStarPicker();
  setStarPicker(0);
  var ta = document.getElementById('reviewComment');
  if (ta) ta.value = '';
}

function closeReviewsPanel() {
  document.getElementById('reviewsPanel').style.display = 'none';
  document.getElementById('detailPanel').style.display = 'block';
  document.getElementById('cakeDetailBox').scrollTop = 0;
}