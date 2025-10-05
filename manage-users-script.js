// Users data
let users = JSON.parse(localStorage.getItem('users')) || [];
let deleteUserId = null;

// Initialize when DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add admin user if not exists
    initializeAdminUser();
    loadUsers();
    updateUserStats();
    setupUserEventListeners();
});

// Initialize admin user
function initializeAdminUser() {
    const adminExists = users.find(u => u.email === 'admin@gmail.com');
    
    if (!adminExists) {
        const adminUser = {
            id: 1,
            name: 'Admin User',
            email: 'admin@gmail.com',
            phone: '+63 123 456 7890',
            role: 'Admin',
            status: 'Active',
            registeredAt: new Date().toISOString()
        };
        
        users.unshift(adminUser); // Add admin as first user
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Setup event listeners
function setupUserEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', filterUsers);
    }
}

// Load users
function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    const noDataMessage = document.getElementById('noDataMessage');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        noDataMessage.classList.remove('d-none');
        return;
    }
    
    noDataMessage.classList.add('d-none');
    
    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

// Create user row
function createUserRow(user) {
    const tr = document.createElement('tr');
    
    const statusBadge = user.status === 'Active' 
        ? '<span class="badge bg-success">Active</span>'
        : '<span class="badge bg-secondary">Inactive</span>';
    
    const roleBadge = `<span class="badge bg-info text-dark">${user.role}</span>`;
    
    tr.innerHTML = `
        <td>${user.id}</td>
        <td><strong>${user.name}</strong></td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td>${new Date(user.registeredAt).toLocaleDateString()}</td>
        <td class="action-buttons">
            <button class="btn btn-sm btn-primary btn-action" onclick="editUser(${user.id})" title="Edit">
                <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-sm btn-danger btn-action" onclick="deleteUser(${user.id})" title="Delete">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    
    return tr;
}

// Save user
function saveUser() {
    const form = document.getElementById('userForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const userId = document.getElementById('userId').value;
    const userData = {
        id: userId ? parseInt(userId) : Date.now(),
        name: document.getElementById('userName').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        phone: document.getElementById('userPhone').value.trim(),
        role: document.getElementById('userRole').value,
        status: document.getElementById('userStatus').value,
        registeredAt: userId ? getUserById(parseInt(userId)).registeredAt : new Date().toISOString()
    };
    
    if (userId) {
        const index = users.findIndex(u => u.id === parseInt(userId));
        if (index !== -1) {
            users[index] = userData;
            showNotification('User updated successfully!', 'success');
        }
    } else {
        users.push(userData);
        showNotification('User added successfully!', 'success');
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
    modal.hide();
    
    loadUsers();
    updateUserStats();
}

// Edit user
function editUser(id) {
    const user = getUserById(id);
    
    if (!user) {
        showNotification('User not found!', 'error');
        return;
    }
    
    document.getElementById('modalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userPhone').value = user.phone;
    document.getElementById('userRole').value = user.role;
    document.getElementById('userStatus').value = user.status;
    
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    modal.show();
}

// Delete user
function deleteUser(id) {
    const user = getUserById(id);
    
    if (!user) {
        showNotification('User not found!', 'error');
        return;
    }
    
    deleteUserId = id;
    document.getElementById('deleteUserName').textContent = user.name;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

// Confirm delete
function confirmDeleteUser() {
    if (!deleteUserId) return;
    
    users = users.filter(u => u.id !== deleteUserId);
    localStorage.setItem('users', JSON.stringify(users));
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    modal.hide();
    
    showNotification('User deleted successfully!', 'success');
    loadUsers();
    updateUserStats();
    
    deleteUserId = null;
}

// Reset form
function resetUserForm() {
    document.getElementById('modalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
}

// Get user by ID
function getUserById(id) {
    return users.find(u => u.id === id);
}

// Filter users
function filterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const filteredUsers = users.filter(user => {
        return user.name.toLowerCase().includes(searchTerm) ||
               user.email.toLowerCase().includes(searchTerm);
    });
    
    displayFilteredUsers(filteredUsers);
}

// Display filtered users
function displayFilteredUsers(filteredUsers) {
    const tbody = document.getElementById('usersTableBody');
    const noDataMessage = document.getElementById('noDataMessage');
    
    tbody.innerHTML = '';
    
    if (filteredUsers.length === 0) {
        noDataMessage.classList.remove('d-none');
        return;
    }
    
    noDataMessage.classList.add('d-none');
    
    filteredUsers.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

// Update stats
function updateUserStats() {
    const totalUsersEl = document.getElementById('totalUsers');
    const activeUsersEl = document.getElementById('activeUsers');
    const newUsersEl = document.getElementById('newUsers');
    
    if (totalUsersEl) totalUsersEl.textContent = users.length;
    
    const activeCount = users.filter(u => u.status === 'Active').length;
    if (activeUsersEl) activeUsersEl.textContent = activeCount;
    
    // New users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCount = users.filter(u => new Date(u.registeredAt) > thirtyDaysAgo).length;
    if (newUsersEl) newUsersEl.textContent = newCount;
}

// Add sample users
function addSampleUsers() {
    const sampleUsers = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@email.com',
            phone: '+63 912 345 6789',
            role: 'Customer',
            status: 'Active',
            registeredAt: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@email.com',
            phone: '+63 923 456 7890',
            role: 'Customer',
            status: 'Active',
            registeredAt: new Date().toISOString()
        }
    ];
    
    users = sampleUsers;
    localStorage.setItem('users', JSON.stringify(users));
    loadUsers();
    updateUserStats();
    showNotification('Sample users added!', 'success');
}

console.log('%cUser Management', 'color: #00bfa6; font-size: 16px; font-weight: bold;');
console.log('Use addSampleUsers() to add sample data');