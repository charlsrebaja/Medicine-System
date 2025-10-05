// Initialize products from products-data.js if localStorage is empty
function initializeProducts() {
    const existingProducts = localStorage.getItem('products');
    if (!existingProducts && typeof productsData !== 'undefined') {
        const productsWithStock = productsData.map(product => ({
            ...product,
            stock: product.stock || 100,
            featured: product.featured || false
        }));
        localStorage.setItem('products', JSON.stringify(productsWithStock));
        console.log('Products initialized in localStorage');
    }
}

// Initialize data from localStorage or create empty arrays
let products = JSON.parse(localStorage.getItem('products')) || [];
let deleteProductId = null;

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeProducts();
    products = JSON.parse(localStorage.getItem('products')) || [];
    initializeDashboard();
    setupEventListeners();
});

// Check if user is authenticated
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (!isLoggedIn) {
        // Redirect to homepage if not logged in
        window.location.href = 'index.html';
    }
}

// Logout functionality
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear login status
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminEmail');
        
        // Show logout animation
        showNotification('Logging out...', 'info');
        
        // Redirect to homepage after short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Initialize dashboard
function initializeDashboard() {
    loadProducts();
    // Only update stats if elements exist (on dashboard page)
    if (document.getElementById('totalProducts')) {
        updateStats();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    sidebarToggle.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('active');
        } else {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', filterProducts);

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.addEventListener('change', filterProducts);

    // Close sidebar on navigation link click (mobile)
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });

}

// Load products from localStorage and display
function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    const noDataMessage = document.getElementById('noDataMessage');
    
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        noDataMessage.classList.remove('d-none');
        return;
    }
    
    noDataMessage.classList.add('d-none');
    
    products.forEach(product => {
        const row = createProductRow(product);
        tbody.appendChild(row);
    });
}

// Create product row
function createProductRow(product) {
    const tr = document.createElement('tr');
    
    // Stock badge color based on quantity
    let stockBadge = '';
    if (product.stock === 0) {
        stockBadge = '<span class="badge bg-danger">Out of Stock</span>';
    } else if (product.stock < 10) {
        stockBadge = `<span class="badge bg-warning text-dark">${product.stock} units</span>`;
    } else {
        stockBadge = `<span class="badge bg-success">${product.stock} units</span>`;
    }
    
    tr.innerHTML = `
        <td>${product.id}</td>
        <td>
            <div class="d-flex align-items-center">
                <img src="${product.image || 'https://via.placeholder.com/50'}" alt="${product.name}"
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; margin-right: 10px;"
                     onerror="this.src='https://via.placeholder.com/50'">
                <strong>${product.name}</strong>
            </div>
        </td>
        <td><span class="badge bg-primary">${product.category}</span></td>
        <td class="price-tag">₱${parseFloat(product.price).toFixed(2)}</td>
        <td>${stockBadge}</td>
        <td>${product.description ? product.description.substring(0, 50) + '...' : 'No description'}</td>
        <td class="action-buttons">
            <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct(${product.id})" title="Edit">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.id})" title="Delete">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    
    return tr;
}

// Save product (Create or Update)
function saveProduct() {
    const form = document.getElementById('productForm');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const productId = document.getElementById('productId').value;
    const productName = document.getElementById('productName').value.trim();
    const imageUrl = document.getElementById('productImage').value.trim();
    
    const productData = {
        id: productId ? parseInt(productId) : Date.now(),
        name: productName,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value.trim(),
        image: imageUrl || `https://via.placeholder.com/300x300/072b4e/ffffff?text=${encodeURIComponent(productName)}`,
        featured: document.getElementById('productFeatured').checked,
        createdAt: productId ? getProductById(parseInt(productId)).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (productId) {
        // Update existing product
        const index = products.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
            products[index] = productData;
            showNotification('Product updated successfully!', 'success');
        }
    } else {
        // Create new product
        products.push(productData);
        showNotification('Product added successfully!', 'success');
    }
    
    // Save to localStorage
    localStorage.setItem('products', JSON.stringify(products));
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    modal.hide();
    
    // Reload products and update stats
    loadProducts();
    updateStats();
}

// Edit product
function editProduct(id) {
    const product = getProductById(id);
    
    if (!product) {
        showNotification('Product not found!', 'error');
        return;
    }
    
    // Populate form
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productFeatured').checked = product.featured || false;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// Delete product
function deleteProduct(id) {
    const product = getProductById(id);
    
    if (!product) {
        showNotification('Product not found!', 'error');
        return;
    }
    
    deleteProductId = id;
    document.getElementById('deleteProductName').textContent = product.name;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

// Confirm delete
function confirmDelete() {
    if (!deleteProductId) return;
    
    products = products.filter(p => p.id !== deleteProductId);
    localStorage.setItem('products', JSON.stringify(products));
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    modal.hide();
    
    showNotification('Product deleted successfully!', 'success');
    loadProducts();
    updateStats();
    
    deleteProductId = null;
}

// Reset form
function resetForm() {
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
}

// Get product by ID
function getProductById(id) {
    return products.find(p => p.id === id);
}

// Filter products (search and category)
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    });
    
    displayFilteredProducts(filteredProducts);
}

// Display filtered products
function displayFilteredProducts(filteredProducts) {
    const tbody = document.getElementById('productsTableBody');
    const noDataMessage = document.getElementById('noDataMessage');
    
    tbody.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        noDataMessage.classList.remove('d-none');
        noDataMessage.querySelector('p').textContent = 'No products match your search criteria.';
        return;
    }
    
    noDataMessage.classList.add('d-none');
    
    filteredProducts.forEach(product => {
        const row = createProductRow(product);
        tbody.appendChild(row);
    });
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    loadProducts();
}

// Update statistics
function updateStats() {
    // Check if stats elements exist (they're only on dashboard page)
    const totalProductsEl = document.getElementById('totalProducts');
    const totalUsersEl = document.getElementById('totalUsers');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');
    
    // Total Products - Real data
    if (totalProductsEl) {
        totalProductsEl.textContent = products.length;
    }
    
    // Total Users - Real data from localStorage
    if (totalUsersEl) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        totalUsersEl.textContent = users.length;
    }
    
    // Total Orders - Real data from localStorage
    if (totalOrdersEl) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        totalOrdersEl.textContent = orders.length;
    }
    
    // Total Revenue - Real data from orders
    if (totalRevenueEl) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const totalRevenue = orders.reduce((sum, order) => {
            return sum + (order.total || 0);
        }, 0);
        totalRevenueEl.textContent = totalRevenue.toFixed(2);
    }
    
    // Update manage products stats if they exist
    const inStockEl = document.getElementById('inStockProducts');
    const lowStockEl = document.getElementById('lowStockProducts');
    
    if (inStockEl) {
        inStockEl.textContent = products.filter(p => p.stock > 10).length;
    }
    
    if (lowStockEl) {
        lowStockEl.textContent = products.filter(p => p.stock <= 10 && p.stock > 0).length;
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const bgColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
    
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgColor} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
    toast.show();
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// Add sample data (for testing purposes)
function addSampleData() {
    const sampleProducts = [
        {
            id: 1,
            name: 'Amoxicillin 500mg',
            category: 'Medicine',
            price: 12.99,
            stock: 150,
            description: 'Antibiotic medication for bacterial infections',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Vitamin D3 1000 IU',
            category: 'Supplements',
            price: 18.99,
            stock: 200,
            description: 'Daily vitamin D supplement for bone health',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 3,
            name: 'Blood Pressure Monitor',
            category: 'Diagnostics',
            price: 45.99,
            stock: 25,
            description: 'Digital blood pressure monitoring device',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 4,
            name: 'Essential Oil Set',
            category: 'Wellness',
            price: 29.99,
            stock: 80,
            description: 'Aromatherapy essential oils for relaxation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 5,
            name: 'Omega-3 Fish Oil',
            category: 'Supplements',
            price: 24.99,
            stock: 0,
            description: 'Heart health supplement with EPA and DHA',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    products = sampleProducts;
    localStorage.setItem('products', JSON.stringify(products));
    loadProducts();
    updateStats();
    showNotification('Sample data added successfully!', 'success');
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        products = [];
        localStorage.removeItem('products');
        loadProducts();
        updateStats();
        showNotification('All data cleared!', 'success');
    }
}

// Export data as JSON
function exportData() {
    const dataStr = JSON.stringify(products, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products-backup-' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Data exported successfully!', 'success');
}

// Import data from JSON
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                products = importedData;
                localStorage.setItem('products', JSON.stringify(products));
                loadProducts();
                updateStats();
                showNotification('Data imported successfully!', 'success');
            } else {
                showNotification('Invalid data format!', 'error');
            }
        } catch (error) {
            showNotification('Error parsing JSON file!', 'error');
        }
    };
    reader.readAsText(file);
}

// Console helper - Access these functions from browser console
console.log('%cAdmin Panel Dashboard', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%cAvailable Functions:', 'color: #764ba2; font-size: 14px; font-weight: bold;');
console.log('- addSampleData() - Add sample products');
console.log('- clearAllData() - Clear all data');
console.log('- exportData() - Export data as JSON');
console.log('- products - View all products array');