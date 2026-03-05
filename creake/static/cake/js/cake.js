// ===================== GLOBAL STATE =====================
let cart = [];
let currentSort = "name";
let currentGridColumns = 3;
let filters = {
    category: "all",
    search: "",
    maxPrice: 1000,
    minRating: 0
};

// ===================== UTILITIES =====================
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cartCount").textContent = count;
}

function showNotification(message, type = "success") {
    const notif = document.createElement("div");
    notif.className = `notification ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    return "⭐".repeat(fullStars);
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ===================== CART FUNCTIONS =====================
function addToCart(cakeId, name, price, img) {
    const existingItem = cart.find(item => item.id === cakeId);
    
    if(existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id: cakeId, name, price, img, quantity: 1 });
    }
    
    updateCartCount();
    renderCart();
    showNotification(`${name} added to cart! 🎂`);
}

function removeFromCart(cakeId) {
    cart = cart.filter(item => item.id !== cakeId);
    updateCartCount();
    renderCart();
}

function updateQuantity(cakeId, change) {
    const item = cart.find(i => i.id === cakeId);
    if(item) {
        item.quantity += change;
        if(item.quantity <= 0) {
            removeFromCart(cakeId);
        } else {
            renderCart();
        }
    }
}

function renderCart() {
    const cartList = document.getElementById("cartItemsList");
    
    if(cart.length === 0) {
        cartList.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p><strong>Your cart is empty!</strong></p>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">Add some delicious cakes to get started.</p>
            </div>
        `;
        document.getElementById("checkoutBtn").disabled = true;
        updateTotals();
        return;
    }
    
    document.getElementById("checkoutBtn").disabled = false;
    cartList.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.img}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>₱${item.price}</p>
                <div class="cart-item-qty">
                    <button onclick="updateQuantity(${item.id}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <button class="remove-item" onclick="removeFromCart(${item.id})">✕</button>
        </div>
    `).join("");
    
    updateTotals();
}

function updateTotals() {
    // Guard clause: return early if deliveryType element doesn't exist
    const deliveryTypeElement = document.getElementById("deliveryType");
    if(!deliveryTypeElement) {
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryType = deliveryTypeElement.value;
    let delivery = 0;
    
    if(deliveryType === "standard") delivery = 50;
    else if(deliveryType === "express") delivery = 150;
    else if(deliveryType === "sameday") delivery = 300;
    
    const total = subtotal + delivery;
    
    document.getElementById("subtotal").textContent = `₱${subtotal.toFixed(2)}`;
    document.getElementById("delivery").textContent = `₱${delivery.toFixed(2)}`;
    document.getElementById("total").textContent = `₱${total.toFixed(2)}`;
}

function updateDelivery() {
    updateTotals();
}

function toggleCart() {
    const modal = document.getElementById("cartModal");
    modal.classList.toggle("active");
}

function openCheckout() {
    document.getElementById("checkoutModal").classList.add("active");
    renderCheckoutSummary();
}

function closeCheckout() {
    document.getElementById("checkoutModal").classList.remove("active");
}

function renderCheckoutSummary() {
    const summary = document.getElementById("checkoutSummary");
    if(cart.length === 0) {
        summary.innerHTML = "<p>No items in cart.</p>";
        return;
    }

    let itemsHTML = cart.map(item => `
        <div class="order-item">
            <span>${item.name} × ${item.quantity}</span>
            <span>₱${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join("");

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryTypeElement = document.getElementById("deliveryType");
    let delivery = 0;
    
    // Guard clause for deliveryType element
    if(deliveryTypeElement) {
        const deliveryType = deliveryTypeElement.value;
        
        if(deliveryType === "standard") delivery = 50;
        else if(deliveryType === "express") delivery = 150;
        else if(deliveryType === "sameday") delivery = 300;
    }

    summary.innerHTML = `
        <h3>Order Summary</h3>
        ${itemsHTML}
        <div class="order-total">
            <span>Subtotal</span>
            <span>₱${subtotal.toFixed(2)}</span>
        </div>
        <div class="order-total">
            <span>Delivery</span>
            <span>₱${delivery.toFixed(2)}</span>
        </div>
        <div class="order-total">
            <span>Total</span>
            <span>₱${(subtotal + delivery).toFixed(2)}</span>
        </div>
    `;
}

// ===================== FILTERS =====================
function applyFilters() {
    filters.category = document.getElementById("categoryFilter").value;
    filters.search = document.getElementById("searchCake").value.toLowerCase();
    filters.maxPrice = parseInt(document.getElementById("priceRange").value);
    filters.minRating = parseFloat(document.getElementById("ratingFilter").value);
    
    loadCakes();
    
    if(window.innerWidth <= 1024) {
        document.querySelector(".filters-panel").classList.remove("mobile-active");
    }
}

function clearFilters() {
    document.getElementById("categoryFilter").value = "all";
    document.getElementById("searchCake").value = "";
    document.getElementById("priceRange").value = "1000";
    document.getElementById("ratingFilter").value = "0";
    document.getElementById("priceDisplay").textContent = "1000";
    
    filters = {
        category: "all",
        search: "",
        maxPrice: 1000,
        minRating: 0
    };
    
    loadCakes();
}

function toggleMobileFilters() {
    document.querySelector(".filters-panel").classList.toggle("mobile-active");
}

// ===================== LOAD CAKES FROM API =====================
function loadCakes() {
    const params = new URLSearchParams({
        category: filters.category,
        search: filters.search,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating,
        sortBy: currentSort
    });

    fetch(`/api/cakes/?${params}`)
        .then(response => response.json())
        .then(data => {
            renderCakes(data.cakes);
            document.getElementById("resultsCount").textContent = data.count;
        })
        .catch(error => {
            console.error('Error loading cakes:', error);
            showNotification('Error loading cakes', 'error');
        });
}

// ===================== RENDER CAKES =====================
function renderCakes(cakeArray) {
    const cakeGrid = document.getElementById("cakeGrid");
    cakeGrid.innerHTML = "";

    if(cakeArray.length === 0) {
        cakeGrid.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3 class="no-results-title">No cakes found</h3>
                <p class="no-results-text">Try adjusting your filters</p>
            </div>
        `;
        return;
    }

    cakeArray.forEach(cake => {
        const cakeCard = document.createElement("div");
        cakeCard.className = "cake-card";
        cakeCard.innerHTML = `
            <div class="cake-image-wrapper">
                <img src="${cake.img}" alt="${cake.name}">
                ${cake.badge ? `<div class="cake-badge">${cake.badge}</div>` : ""}
            </div>
            <div class="cake-content">
                <h3>${cake.name}</h3>
                <p class="cake-desc">${cake.desc}</p>
                <div class="cake-rating">
                    <span class="stars">${generateStars(cake.rating)}</span>
                    <span>(${cake.reviews})</span>
                </div>
                <div class="cake-price">₱${cake.price}</div>
                <div class="cake-actions">
                    <button class="add-to-cart-btn" onclick="addToCart(${cake.id}, '${cake.name.replace(/'/g, "\\'")}', ${cake.price}, '${cake.img}')">Add to Cart</button>
                </div>
            </div>
        `;
        cakeGrid.appendChild(cakeCard);
    });
}

// ===================== SORT & VIEW =====================
document.addEventListener("DOMContentLoaded", function() {
    const sortByElement = document.getElementById("sortBy");
    if(sortByElement) {
        sortByElement.addEventListener("change", function() {
            currentSort = this.value;
            loadCakes();
        });
    }
});

function setGridView(columns) {
    currentGridColumns = columns;

    document.querySelectorAll(".view-toggle button").forEach(btn => {
        btn.classList.remove("active");
    });

    document.querySelector(`.view-toggle button:nth-child(${4 - columns})`)
        .classList.add("active");

    const grid = document.getElementById("cakeGrid");

    if(columns === 1) {
        grid.style.gridTemplateColumns = "1fr";
    } else if(columns === 2) {
        grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(300px, 1fr))";
    } else {
        grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";
    }
}

// ===================== PRICE RANGE DISPLAY =====================
document.addEventListener("DOMContentLoaded", function() {
    const priceRangeElement = document.getElementById("priceRange");
    if(priceRangeElement) {
        priceRangeElement.addEventListener("input", function() {
            document.getElementById("priceDisplay").textContent = this.value;
        });
    }
});

// ===================== CHECKOUT FORM =====================
document.addEventListener("DOMContentLoaded", function() {
    const checkoutForm = document.getElementById("checkoutForm");
    if(checkoutForm) {
        checkoutForm.addEventListener("submit", function(e) {
            e.preventDefault();

            const deliveryTypeElement = document.getElementById("deliveryType");
            let delivery = 0;
            
            // Guard clause for deliveryType element
            if(deliveryTypeElement) {
                const deliveryType = deliveryTypeElement.value;
                
                if(deliveryType === "standard") delivery = 50;
                else if(deliveryType === "express") delivery = 150;
                else if(deliveryType === "sameday") delivery = 300;
            }

            const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const total = subtotal + delivery;

            const orderData = {
                fullName: document.getElementById("fullName").value,
                email: document.getElementById("email").value,
                phone: document.getElementById("phone").value,
                address: document.getElementById("address").value,
                city: document.getElementById("city").value,
                postalCode: document.getElementById("postalCode").value,
                deliveryType: deliveryTypeElement ? deliveryTypeElement.value : "standard",
                paymentMethod: document.getElementById("paymentMethod").value,
                notes: document.getElementById("notes").value,
                cartItems: cart,
                total: total
            };

            fetch('/api/order/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(orderData)
            })
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    showNotification(`🎉 Order placed successfully! Order #${data.orderId}`);
                    cart = [];
                    updateCartCount();
                    renderCart();
                    closeCheckout();
                    toggleCart();
                    checkoutForm.reset();
                } else {
                    showNotification(`Error: ${data.message}`, 'error');
                }
            })
            .catch(error => {
                showNotification('Error placing order', 'error');
                console.error('Error:', error);
            });
        });
    }
});

// ===================== CSRF TOKEN HELPER =====================
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", function() {
    loadCakes();
    updateCartCount();
    renderCart();
    
    // Only update totals if the delivery element exists
    if(document.getElementById("deliveryType")) {
        updateTotals();
    }
});