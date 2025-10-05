// My Account Script - User profile management

// Check if user is logged in
function checkAuth() {
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const isUserLoggedIn = localStorage.getItem('isUserLoggedIn');
    
    if (!isAdminLoggedIn && !isUserLoggedIn) {
        alert('Please login to access your account');
        window.location.href = 'index.html';
    }
}

// Get current user data
function getCurrentUser() {
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const adminEmail = localStorage.getItem('adminEmail');
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    
    if (isAdminLoggedIn) {
        return {
            name: 'Admin',
            email: adminEmail,
            phone: '+63 123 456 7890',
            role: 'Administrator',
            memberSince: 'January 1, 2025',
            isAdmin: true
        };
    } else {
        // Get user from users array
        const users = StorageUtils.get('users', []);
        const user = users.find(u => u.email === userEmail);
        
        if (user) {
            return {
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role || 'Customer',
                memberSince: new Date(user.registeredAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                password: user.password,
                isAdmin: false,
                userId: user.id
            };
        }
    }
    
    return null;
}

// Load and display profile
function loadProfile() {
    const user = getCurrentUser();
    
    if (!user) {
        alert('User data not found');
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('displayName').textContent = user.name;
    document.getElementById('displayEmail').textContent = user.email;
    document.getElementById('displayPhone').textContent = user.phone;
    document.getElementById('displayRole').textContent = user.role;
    document.getElementById('displayMemberSince').textContent = user.memberSince;
    
    // Pre-fill edit form
    document.getElementById('editName').value = user.name;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editPhone').value = user.phone;
}

// Save profile changes
function saveProfile() {
    const form = document.getElementById('editProfileForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const user = getCurrentUser();
    
    if (user.isAdmin) {
        alert('Admin profile cannot be edited from this page');
        return;
    }
    
    const newName = document.getElementById('editName').value.trim();
    const newPhone = document.getElementById('editPhone').value.trim();
    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();
    
    // Validate password change if attempted
    if (currentPassword || newPassword || confirmNewPassword) {
        if (!currentPassword) {
            alert('Please enter your current password to change it');
            return;
        }
        
        if (btoa(currentPassword) !== user.password) {
            alert('Current password is incorrect');
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters');
            return;
        }
    }
    
    // Update user in users array
    let users = StorageUtils.get('users', []);
    const userIndex = users.findIndex(u => u.id === user.userId);
    
    if (userIndex !== -1) {
        users[userIndex].name = newName;
        users[userIndex].phone = newPhone;
        
        if (newPassword) {
            users[userIndex].password = btoa(newPassword);
        }
        
        users[userIndex].updatedAt = new Date().toISOString();
        
        StorageUtils.set('users', users);
        
        // Update session storage
        localStorage.setItem('userName', newName);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        modal.hide();
        
        // Reload profile
        loadProfile();
        
        // Update navbar
        checkLoginStatus();
        
        // Show success
        showNotification('Profile updated successfully!');
        
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
    notification.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        <i class="bi bi-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Check login status and update navbar
function checkLoginStatus() {
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const isUserLoggedIn = localStorage.getItem('isUserLoggedIn');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

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
    loadProfile();
});