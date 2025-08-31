class UserManagementManager {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this.bindEvents();
        this.refresh();
    }

    bindEvents() {
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addUser();
            });
        }
    }

    refresh() {
        this.displayUsers();
    }

    displayUsers() {
        const users = window.authManager.getAllUsers();
        const usersList = document.getElementById('usersList');
        
        if (!usersList) return;

        if (users.length === 0) {
            usersList.innerHTML = '<p class="text-center">No users found</p>';
            return;
        }

        const currentUser = window.authManager.getCurrentUser();
        
        usersList.innerHTML = users.map(user => `
            <div class="user-item">
                <div class="user-info">
                    <h4>${user.username}</h4>
                    <span class="user-role ${user.role.toLowerCase()}">${user.role}</span>
                </div>
                <div class="user-actions">
                    ${this.canManageUser(currentUser, user) ? `
                        <button class="btn btn-small btn-outline" onclick="userManagementManager.editUser('${user.id}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="userManagementManager.deleteUser('${user.id}')">Delete</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    canManageUser(currentUser, targetUser) {
        if (!currentUser || currentUser.role !== 'developer') return false;
        if (currentUser.id === targetUser.id) return false; // Can't manage self
        return true;
    }

    async addUser() {
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value.trim();
        const role = document.getElementById('newUserRole').value;

        if (!username || !password || !role) {
            Utils.showToast('Please fill all fields', 'error');
            return;
        }

        const result = await window.authManager.addUser(username, password, role);
        
        if (result.success) {
            Utils.showToast('User created successfully!', 'success');
            document.getElementById('addUserForm').reset();
            this.refresh();
        } else {
            Utils.showToast(result.message, 'error');
        }
    }

    editUser(userId) {
        const users = window.authManager.getAllUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            Utils.showToast('User not found', 'error');
            return;
        }

        const editForm = `
            <form id="editUserForm">
                <div class="form-group">
                    <label for="editUsername">Username</label>
                    <input type="text" id="editUsername" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label for="editPassword">New Password (leave blank to keep current)</label>
                    <input type="password" id="editPassword">
                </div>
                <div class="form-group">
                    <label for="editRole">Role</label>
                    <select id="editRole" required>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                        <option value="developer" ${user.role === 'developer' ? 'selected' : ''}>Developer</option>
                    </select>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Update User</button>
                    <button type="button" class="btn btn-outline" onclick="navigationManager.closeModal(document.getElementById('editModal'))">Cancel</button>
                </div>
            </form>
        `;

        window.navigationManager.showModal('editModal', 'Edit User', editForm);

        document.getElementById('editUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateUser(userId);
        });
    }

    async updateUser(userId) {
        const username = document.getElementById('editUsername').value.trim();
        const password = document.getElementById('editPassword').value.trim();
        const role = document.getElementById('editRole').value;

        if (!username || !role) {
            Utils.showToast('Please fill all required fields', 'error');
            return;
        }

        const updates = { username, role };
        if (password) {
            updates.password = password;
        }

        const result = await window.authManager.updateUser(userId, updates);
        
        if (result.success) {
            Utils.showToast('User updated successfully!', 'success');
            window.navigationManager.closeModal(document.getElementById('editModal'));
            this.refresh();
        } else {
            Utils.showToast(result.message, 'error');
        }
    }

    async deleteUser(userId) {
        const users = window.authManager.getAllUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            Utils.showToast('User not found', 'error');
            return;
        }

        Utils.confirm(`Are you sure you want to delete user "${user.username}"?`, async () => {
            const result = await window.authManager.deleteUser(userId);
            
            if (result.success) {
                Utils.showToast('User deleted successfully!', 'success');
                this.refresh();
            } else {
                Utils.showToast(result.message, 'error');
            }
        });
    }
}

// Global user management manager instance
window.userManagementManager = new UserManagementManager();