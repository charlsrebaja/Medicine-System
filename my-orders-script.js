// My Orders Script - User-specific order viewing

// Check if user is logged in
function checkAuth() {
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const isUserLoggedIn = localStorage.getItem('isUserLoggedIn');
    
    if (!isAdminLoggedIn && !isUserLoggedIn) {
        alert('Please login to view your orders');
        window.location.href = 'index.html';
    }
}

// Get current user's email
function getCurrentUserEmail() {
    return localStorage.getItem('userEmail') || localStorage.getItem('adminEmail');
}

// Get current user's orders only
function getUserOrders() {
    const allOrders = StorageUtils.get('orders', []);
    const userEmail = getCurrentUserEmail();
    
    // Filter orders for current user
    return allOrders.filter(order => order.customerEmail === userEmail);
}

// Load and display user's orders
function loadOrders() {
    const orders = getUserOrders();
    const container = document.getElementById('ordersContainer');
    const noOrdersMessage = document.getElementById('noOrdersMessage');
    
    // Update stats
    const totalOrdersEl = document.getElementById('totalOrdersCount');
    const pendingOrdersEl = document.getElementById('pendingOrdersCount');
    const completedOrdersEl = document.getElementById('completedOrders Count');
    
    if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
    if (pendingOrdersEl) pendingOrdersEl.textContent = orders.filter(o => o.status === 'Pending').length;
    if (completedOrdersEl) completedOrdersEl.textContent = orders.filter(o => o.status === 'Completed').length;
    
    // Apply filters
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    let filteredOrders = orders;
    
    if (searchTerm) {
        filteredOrders = filteredOrders.filter(o =>
            o.id.toLowerCase().includes(searchTerm) ||
            o.items.some(item => item.productName.toLowerCase().includes(searchTerm))
        );
    }
    
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
    }
    
    // Sort by date (newest first)
    filteredOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    if (filteredOrders.length === 0) {
        container.innerHTML = '';
        noOrdersMessage.classList.remove('d-none');
        return;
    }
    
    noOrdersMessage.classList.add('d-none');
    
    // Display orders as cards
    container.innerHTML = filteredOrders.map(order => {
        const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Status badge
        let statusBadge = '';
        let statusClass = '';
        switch (order.status) {
            case 'Pending':
                statusBadge = '<span class="badge bg-warning text-dark">Pending</span>';
                statusClass = 'border-warning';
                break;
            case 'Processing':
                statusBadge = '<span class="badge bg-info">Processing</span>';
                statusClass = 'border-info';
                break;
            case 'Shipped':
                statusBadge = '<span class="badge bg-primary">Shipped</span>';
                statusClass = 'border-primary';
                break;
            case 'Completed':
                statusBadge = '<span class="badge bg-success">Completed</span>';
                statusClass = 'border-success';
                break;
            case 'Cancelled':
                statusBadge = '<span class="badge bg-danger">Cancelled</span>';
                statusClass = 'border-danger';
                break;
            default:
                statusBadge = `<span class="badge bg-secondary">${order.status}</span>`;
                statusClass = 'border-secondary';
        }
        
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 ${statusClass}" style="border-left: 4px solid;">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h6 class="mb-1">${order.id}</h6>
                                <small class="text-muted">${orderDate}</small>
                            </div>
                            ${statusBadge}
                        </div>
                        <div class="mb-3">
                            <p class="mb-1"><i class="bi bi-box-seam me-2 text-primary"></i><strong>${order.items.length} item(s)</strong></p>
                            <small class="text-muted">${order.items[0].productName}${order.items.length > 1 ? ' +' + (order.items.length - 1) + ' more' : ''}</small>
                        </div>
                        <div class="mb-3">
                            <p class="mb-1"><i class="bi bi-credit-card me-2 text-primary"></i>${order.paymentMethod}</p>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0 text-primary">₱${order.total.toFixed(2)}</h5>
                            <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails('${order.id}')">
                                <i class="bi bi-eye me-1"></i>View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// View order details
function viewOrderDetails(orderId) {
    const orders = getUserOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    document.getElementById('modalOrderId').textContent = order.id;
    document.getElementById('modalOrderDate').textContent = new Date(order.orderDate).toLocaleString();
    document.getElementById('modalOrderStatus').innerHTML = getStatusBadge(order.status);
    document.getElementById('modalCustomerPhone').textContent = order.customerPhone;
    document.getElementById('modalDeliveryAddress').textContent = order.deliveryAddress;
    document.getElementById('modalPaymentMethod').textContent = order.paymentMethod;
    
    // Order notes
    if (order.orderNotes) {
        document.getElementById('modalOrderNotes').textContent = order.orderNotes;
        document.getElementById('modalOrderNotesContainer').classList.remove('d-none');
    } else {
        document.getElementById('modalOrderNotesContainer').classList.add('d-none');
    }
    
    // Populate items
    const itemsList = document.getElementById('modalOrderItems');
    itemsList.innerHTML = order.items.map(item => `
        <tr>
            <td>${item.productName}</td>
            <td>₱${item.price.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>₱${item.subtotal.toFixed(2)}</td>
        </tr>
    `).join('');
    
    document.getElementById('modalOrderTotal').textContent = `₱${order.total.toFixed(2)}`;
    
    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    modal.show();
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'Pending': '<span class="badge bg-warning text-dark">Pending</span>',
        'Processing': '<span class="badge bg-info">Processing</span>',
        'Shipped': '<span class="badge bg-primary">Shipped</span>',
        'Completed': '<span class="badge bg-success">Completed</span>',
        'Cancelled': '<span class="badge bg-danger">Cancelled</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

// Clear filters
function clearFilters() {
    if (document.getElementById('searchInput')) {
        document.getElementById('searchInput').value = '';
    }
    if (document.getElementById('statusFilter')) {
        document.getElementById('statusFilter').value = '';
    }
    loadOrders();
}

// Check login status and update navbar
function checkLoginStatus() {
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const isUserLoggedIn = localStorage.getItem('isUserLoggedIn');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    const adminEmail = localStorage.getItem('adminEmail');

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

// Logout
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
            window.location.href = 'index.html';
        }
    });
}

// Cart button
const cartBtn = document.getElementById('cartBtn');
if (cartBtn) {
    cartBtn.addEventListener('click', function() {
        window.location.href = 'shop.html';
    });
}

// Update cart count
function updateCartCount() {
    const cart = CartUtils.getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    checkLoginStatus();
    updateCartCount();
    loadOrders();
    
    // Add event listeners
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.addEventListener('input', loadOrders);
    if (statusFilter) statusFilter.addEventListener('change', loadOrders);
});