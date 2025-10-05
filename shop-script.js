// Products data now loaded from products-data.js

// Cart Array
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Current filter
let currentFilter = 'all';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    displayProducts(productsData);
    updateCartCount();
    setupEventListeners();
});

// Check login status and update navbar
function checkLoginStatus() {
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const isUserLoggedIn = localStorage.getItem('isUserLoggedIn');
    const adminEmail = localStorage.getItem('adminEmail');
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');

    const loginBtnContainer = document.getElementById('loginBtnContainer');
    const profileDropdownContainer = document.getElementById('profileDropdownContainer');
    const profileUserName = document.getElementById('profileUserName');
    const dashboardLinkItem = document.getElementById('dashboardLinkItem');

    if (isAdminLoggedIn) {
        loginBtnContainer.classList.add('d-none');
        profileDropdownContainer.classList.remove('d-none');
        profileUserName.textContent = 'Admin';
        dashboardLinkItem.classList.remove('d-none');
    } else if (isUserLoggedIn) {
        loginBtnContainer.classList.add('d-none');
        profileDropdownContainer.classList.remove('d-none');
        profileUserName.textContent = userName || userEmail.split('@')[0];
        dashboardLinkItem.classList.add('d-none');
    } else {
        loginBtnContainer.classList.remove('d-none');
        profileDropdownContainer.classList.add('d-none');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
    
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    searchBtn.addEventListener('click', handleSearch);

    // Cart button
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCart = document.getElementById('closeCart');

    cartBtn.addEventListener('click', openCart);
    closeCart.addEventListener('click', closeCartSidebar);
    cartOverlay.addEventListener('click', closeCartSidebar);

    // Checkout and clear cart buttons
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);

    // Login button
    const loginBtn = document.getElementById('loginBtn');
    const loginSidebar = document.getElementById('loginSidebar');
    const loginOverlay = document.getElementById('loginOverlay');
    const closeLogin = document.getElementById('closeLogin');

    loginBtn.addEventListener('click', openLogin);
    closeLogin.addEventListener('click', closeLoginSidebar);
    loginOverlay.addEventListener('click', closeLoginSidebar);

    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Login functionality would be implemented here.');
        closeLoginSidebar();
    });

    // Logout from profile dropdown
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('isAdminLoggedIn');
                localStorage.removeItem('isUserLoggedIn');
                localStorage.removeItem('adminEmail');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                window.location.reload();
            }
        });
    }

    // Back to top button
    const backToTopBtn = document.getElementById('backToTop');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Display Products with smooth animation
function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    const noResults = document.getElementById('noResults');
    const productCount = document.getElementById('productCount');

    // Clear container with fade out
    container.style.opacity = '0';
    
    setTimeout(() => {
        container.innerHTML = '';

        if (products.length === 0) {
            noResults.classList.remove('d-none');
            productCount.textContent = '0';
            container.style.opacity = '1';
            return;
        }

        noResults.classList.add('d-none');
        productCount.textContent = products.length;

        products.forEach((product, index) => {
            const productCard = createProductCard(product, index);
            container.appendChild(productCard);
        });

        container.style.opacity = '1';
    }, 200);
}

// Create Product Card
function createProductCard(product) {
    const col = document.createElement('div');
    col.className = 'col-lg-3 col-md-4 col-sm-6';
    
    col.innerHTML = `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                <span class="product-badge">${product.category}</span>
            </div>
            <div class="product-body">
                <h5 class="product-title">${product.name}</h5>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-actions">
                        <button class="btn-view-details" onclick="viewProduct(${product.id})" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn-add-cart" onclick="addToCart(${product.id})" title="Add to Cart">
                            <i class="bi bi-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    return col;
}

// Filter by Category
function filterByCategory(category) {
    currentFilter = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.category-btn').classList.add('active');

    // Filter products
    let filteredProducts = category === 'all' 
        ? productsData 
        : productsData.filter(p => p.category === category);

    // Apply search if there's a search term
    const searchTerm = document.getElementById('searchInput').value;
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    displayProducts(filteredProducts);
}

// Handle Search
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredProducts = currentFilter === 'all'
        ? productsData
        : productsData.filter(p => p.category === currentFilter);

    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }

    displayProducts(filteredProducts);
}

// View Product Details
function viewProduct(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalProductImage').src = product.image;
    document.getElementById('modalProductImage').alt = product.name;
    document.getElementById('modalProductCategory').textContent = product.category;
    document.getElementById('modalProductPrice').textContent = product.price.toFixed(2);
    document.getElementById('modalProductDescription').textContent = product.description;
    document.getElementById('modalQuantity').value = 1;
    document.getElementById('modalQuantity').dataset.productId = productId;

    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// Quantity Controls
function increaseQuantity() {
    const input = document.getElementById('modalQuantity');
    input.value = parseInt(input.value) + 1;
}

function decreaseQuantity() {
    const input = document.getElementById('modalQuantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

// Add to Cart
function addToCart(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart();
    updateCartCount();
    showNotification('Product added to cart!');
}

// Add to Cart from Modal
function addToCartFromModal() {
    const productId = parseInt(document.getElementById('modalQuantity').dataset.productId);
    const quantity = parseInt(document.getElementById('modalQuantity').value);
    
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            ...product,
            quantity: quantity
        });
    }

    saveCart();
    updateCartCount();
    showNotification(`Added ${quantity} item(s) to cart!`);

    const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    modal.hide();
}

// Cart Functions
function openCart() {
    updateCartDisplay();
    document.getElementById('cartSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartSidebar() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function updateCartDisplay() {
    const cartBody = document.getElementById('cartBody');
    const cartTotal = document.getElementById('cartTotal');

    if (cart.length === 0) {
        cartBody.innerHTML = '<div class="empty-cart text-center py-5"><i class="bi bi-cart-x" style="font-size: 4rem; color: #ccc"></i><p class="mt-3 text-muted">Your cart is empty</p></div>';
        cartTotal.textContent = '$0.00';
    } else {
        cartBody.innerHTML = '';
        let total = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const cartItemHTML = `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h6>${item.name}</h6>
                        <p class="cart-item-price mb-1">$${item.price.toFixed(2)} x ${item.quantity}</p>
                        <div class="d-flex align-items-center gap-2 mt-2">
                            <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                            <span class="fw-bold">${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-secondary" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="cart-item-price fw-bold">$${itemTotal.toFixed(2)}</div>
                        <button class="btn-remove-cart mt-2" onclick="removeFromCart(${item.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            cartBody.insertAdjacentHTML('beforeend', cartItemHTML);
        });

        cartTotal.textContent = '$' + total.toFixed(2);
    }
}

function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCartDisplay();
        updateCartCount();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartDisplay();
    updateCartCount();
    showNotification('Item removed from cart');
}

function clearCart() {
    if (cart.length > 0 && confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCart();
        updateCartDisplay();
        updateCartCount();
        showNotification('Cart cleared');
    }
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    alert(`Proceeding to checkout...\n\nTotal: $${total.toFixed(2)}`);
    // Add your checkout logic here
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Login Functions
function openLogin() {
    document.getElementById('loginSidebar').classList.add('active');
    document.getElementById('loginOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLoginSidebar() {
    document.getElementById('loginSidebar').classList.remove('active');
    document.getElementById('loginOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// Show Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `<i class="bi bi-check-circle me-2"></i>${message}`;
    document.body.appendChild(notification);

    // Notification styles (add to CSS if not present)
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: -300px;
        background: linear-gradient(135deg, #00bfa6 0%, #01957e 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0, 191, 166, 0.4);
        z-index: 2000;
        transition: right 0.4s ease;
        font-weight: 600;
        display: flex;
        align-items: center;
    `;

    setTimeout(() => {
        notification.style.right = '20px';
    }, 10);

    setTimeout(() => {
        notification.style.right = '-300px';
        setTimeout(() => notification.remove(), 400);
    }, 2500);
}

// Console helper
console.log('%cMoving Medicine Shop', 'color: #00bfa6; font-size: 20px; font-weight: bold;');
console.log('%cTotal Products:', 'color: #01957e; font-size: 14px;', productsData.length);
console.log('Categories:', [...new Set(productsData.map(p => p.category))].join(', '));