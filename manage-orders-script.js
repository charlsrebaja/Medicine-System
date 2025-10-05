// Order Management Script for Admin Dashboard

// Get all orders from localStorage
function getOrders() {
    const orders = localStorage.getItem('orders');
    return orders ? JSON.parse(orders) : [];
}

// Save orders to localStorage
function saveOrders(orders) {
    localStorage.setItem('orders', JSON.stringify(orders));
}

// Load and display orders
function loadOrders() {
    const orders = getOrders();
    const tbody = document.getElementById('ordersTableBody');
    const noDataMessage = document.getElementById('noOrdersMessage');
    
    // Update stats
    const totalOrdersEl = document.getElementById('totalOrdersCount');
    const pendingOrdersEl = document.getElementById('pendingOrders');
    const completedOrdersEl = document.getElementById('completedOrders');
    const totalRevenueEl = document.getElementById('ordersRevenue');
    
    if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
    if (pendingOrdersEl) pendingOrdersEl.textContent = orders.filter(o => o.status === 'Pending').length;
    if (completedOrdersEl) completedOrdersEl.textContent = orders.filter(o => o.status === 'Completed').length;
    if (totalRevenueEl) {
        const revenue = orders.reduce((sum, order) => sum + order.total, 0);
        totalRevenueEl.textContent = revenue.toFixed(2);
    }
    
    // Apply filters
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    let filteredOrders = orders;
    
    if (searchTerm) {
        filteredOrders = filteredOrders.filter(o => 
            o.id.toLowerCase().includes(searchTerm) ||
            o.customerName.toLowerCase().includes(searchTerm) ||
            o.customerEmail.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
    }
    
    // Sort by date (newest first)
    filteredOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    if (filteredOrders.length === 0) {
        tbody.innerHTML = '';
        if (noDataMessage) noDataMessage.classList.remove('d-none');
        return;
    }
    
    if (noDataMessage) noDataMessage.classList.add('d-none');
    
    tbody.innerHTML = filteredOrders.map(order => {
        const orderDate = new Date(order.orderDate).toLocaleDateString();
        const orderTime = new Date(order.orderDate).toLocaleTimeString();
        
        // Status badge
        let statusBadge = '';
        switch (order.status) {
            case 'Pending':
                statusBadge = '<span class="badge bg-warning text-dark">Pending</span>';
                break;
            case 'Processing':
                statusBadge = '<span class="badge bg-info">Processing</span>';
                break;
            case 'Shipped':
                statusBadge = '<span class="badge bg-primary">Shipped</span>';
                break;
            case 'Completed':
                statusBadge = '<span class="badge bg-success">Completed</span>';
                break;
            case 'Cancelled':
                statusBadge = '<span class="badge bg-danger">Cancelled</span>';
                break;
            default:
                statusBadge = `<span class="badge bg-secondary">${order.status}</span>`;
        }
        
        // Items summary
        const itemsSummary = order.items.length === 1 
            ? order.items[0].productName 
            : `${order.items.length} items`;
        
        return `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>
                    <div>${order.customerName}</div>
                    <small class="text-muted">${order.customerEmail}</small>
                </td>
                <td>
                    <div>${itemsSummary}</div>
                    <small class="text-muted">${order.items.reduce((sum, item) => sum + item.quantity, 0)} total items</small>
                </td>
                <td><strong>₱${order.total.toFixed(2)}</strong></td>
                <td>
                    <div>${orderDate}</div>
                    <small class="text-muted">${orderTime}</small>
                </td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="viewOrder('${order.id}')" title="View Details">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success me-1" onclick="updateOrderStatus('${order.id}', 'Completed')" title="Mark Complete">
                        <i class="bi bi-check-circle"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder('${order.id}')" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// View order details
function viewOrder(orderId) {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    document.getElementById('viewOrderId').textContent = order.id;
    document.getElementById('viewCustomerName').textContent = order.customerName;
    document.getElementById('viewCustomerEmail').textContent = order.customerEmail;
    document.getElementById('viewCustomerPhone').textContent = order.customerPhone;
    document.getElementById('viewDeliveryAddress').textContent = order.deliveryAddress;
    document.getElementById('viewPaymentMethod').textContent = order.paymentMethod;
    document.getElementById('viewOrderNotes').textContent = order.orderNotes || 'None';
    document.getElementById('viewOrderDate').textContent = new Date(order.orderDate).toLocaleString();
    document.getElementById('viewOrderStatus').textContent = order.status;
    
    // Populate items
    const itemsList = document.getElementById('viewOrderItems');
    itemsList.innerHTML = order.items.map(item => `
        <tr>
            <td>${item.productName}</td>
            <td>₱${item.price.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>₱${item.subtotal.toFixed(2)}</td>
        </tr>
    `).join('');
    
    document.getElementById('viewOrderTotal').textContent = `₱${order.total.toFixed(2)}`;
    
    const modal = new bootstrap.Modal(document.getElementById('viewOrderModal'));
    modal.show();
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
    let orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) return;
    
    orders[orderIndex].status = newStatus;
    orders[orderIndex].updatedAt = new Date().toISOString();
    
    saveOrders(orders);
    loadOrders();
    showNotification(`Order ${orderId} marked as ${newStatus}`, 'success');
}

// Delete order
let deleteOrderId = null;

function deleteOrder(orderId) {
    deleteOrderId = orderId;
    const modal = new bootstrap.Modal(document.getElementById('deleteOrderModal'));
    modal.show();
}

function confirmDeleteOrder() {
    if (!deleteOrderId) return;
    
    let orders = getOrders();
    orders = orders.filter(o => o.id !== deleteOrderId);
    
    saveOrders(orders);
    loadOrders();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteOrderModal'));
    modal.hide();
    
    showNotification('Order deleted successfully', 'success');
    deleteOrderId = null;
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

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    
    // Add event listeners if elements exist
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.addEventListener('input', loadOrders);
    if (statusFilter) statusFilter.addEventListener('change', loadOrders);
});