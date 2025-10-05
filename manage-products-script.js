// Product Management Script for Admin Dashboard

// Initialize products from products-data.js if localStorage is empty
function initializeProducts() {
    const existingProducts = localStorage.getItem('products');
    if (!existingProducts && typeof productsData !== 'undefined') {
        // Add stock field to products if not present
        const productsWithStock = productsData.map(product => ({
            ...product,
            stock: product.stock || 100, // Default stock
            featured: product.featured || false
        }));
        localStorage.setItem('products', JSON.stringify(productsWithStock));
        console.log('Products initialized in localStorage');
    }
}

// Get all products from localStorage
function getProducts() {
    const products = localStorage.getItem('products');
    return products ? JSON.parse(products) : [];
}

// Save products to localStorage
function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
}

// Load and display products
function loadProducts() {
    const products = getProducts();
    const tbody = document.getElementById('productsTableBody');
    const noDataMessage = document.getElementById('noDataMessage');
    
    // Update stats
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('inStockProducts').textContent = products.filter(p => p.stock > 10).length;
    document.getElementById('lowStockProducts').textContent = products.filter(p => p.stock <= 10 && p.stock > 0).length;
    
    // Apply filters
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let filteredProducts = products;
    
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);
    }
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = '';
        noDataMessage.classList.remove('d-none');
        return;
    }
    
    noDataMessage.classList.add('d-none');
    
    tbody.innerHTML = filteredProducts.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${product.image}" alt="${product.name}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; margin-right: 10px;"
                         onerror="this.src='https://via.placeholder.com/50'">
                    <strong>${product.name}</strong>
                </div>
            </td>
            <td><span class="badge bg-primary">${product.category}</span></td>
            <td>₱${product.price.toFixed(2)}</td>
            <td>
                <span class="badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}">
                    ${product.stock} units
                </span>
            </td>
            <td>${product.description ? product.description.substring(0, 50) + '...' : 'No description'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct(${product.id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.id})" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Reset form
function resetForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productImage').value = '';
}

// Edit product
function editProduct(id) {
    const products = getProducts();
    const product = products.find(p => p.id === id);
    
    if (!product) return;
    
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productFeatured').checked = product.featured || false;
    
    document.getElementById('modalTitle').textContent = 'Edit Product';
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// Save product (Add or Update)
function saveProduct() {
    const form = document.getElementById('productForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const products = getProducts();
    const id = document.getElementById('productId').value;
    
    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value,
        image: document.getElementById('productImage').value || `https://via.placeholder.com/300x300/072b4e/ffffff?text=${encodeURIComponent(document.getElementById('productName').value)}`,
        featured: document.getElementById('productFeatured').checked
    };
    
    if (id) {
        // Update existing product
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            products[index] = { ...products[index], ...productData };
        }
    } else {
        // Add new product
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, ...productData });
    }
    
    saveProducts(products);
    loadProducts();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    modal.hide();
    
    showNotification(id ? 'Product updated successfully!' : 'Product added successfully!', 'success');
}

// Delete product
let deleteProductId = null;

function deleteProduct(id) {
    const products = getProducts();
    const product = products.find(p => p.id === id);
    
    if (!product) return;
    
    deleteProductId = id;
    document.getElementById('deleteProductName').textContent = product.name;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

function confirmDelete() {
    if (!deleteProductId) return;
    
    let products = getProducts();
    products = products.filter(p => p.id !== deleteProductId);
    
    saveProducts(products);
    loadProducts();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    modal.hide();
    
    showNotification('Product deleted successfully!', 'success');
    deleteProductId = null;
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    loadProducts();
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
    initializeProducts();
    loadProducts();
    
    // Add event listeners
    document.getElementById('searchInput').addEventListener('input', loadProducts);
    document.getElementById('categoryFilter').addEventListener('change', loadProducts);
});