// Authentication System
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.init();
    }

    init() {
        console.log('AuthManager initializing...');
        this.loadUsers();
        this.createDefaultUsers();
        console.log('AuthManager initialized with users:', this.users.map(u => u.username));
    }

    loadUsers() {
        try {
            const stored = localStorage.getItem('btf_users');
            if (stored) {
                this.users = JSON.parse(stored);
                console.log('Loaded existing users:', this.users.map(u => u.username));
            } else {
                this.users = [];
                console.log('No existing users found');
            }
        } catch (e) {
            console.error('Error loading users:', e);
            this.users = [];
        }
    }

    createDefaultUsers() {
        // Only create default users if none exist
        if (this.users.length === 0) {
            console.log('Creating default users...');
            
            this.users = [
                {
                    id: 'admin_001',
                    username: 'admin',
                    password: 'admin123',
                    role: 'admin',
                    email: 'admin@breakthefear.com',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'manager_001',
                    username: 'manager',
                    password: 'manager123',
                    role: 'manager',
                    email: 'manager@breakthefear.com',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'developer_001',
                    username: 'developer',
                    password: 'dev123',
                    role: 'developer',
                    email: 'developer@breakthefear.com',
                    createdAt: new Date().toISOString()
                }
            ];
            
            // Save to localStorage
            localStorage.setItem('btf_users', JSON.stringify(this.users));
            console.log('Default users created and saved');
        } else {
            console.log('Users already exist, skipping default creation');
        }
    }

    login(username, password) {
        console.log('Login attempt for username:', username);
        console.log('Available users:', this.users.map(u => u.username));
        
        if (!username || !password) {
            console.log('Missing credentials');
            return { success: false, message: 'Username and password are required' };
        }
        
        // Find user
        const user = this.users.find(u => u.username === username);
        console.log('User found:', user ? `${user.username} (${user.role})` : 'none');
        
        if (!user) {
            console.log('User not found');
            return { success: false, message: 'Invalid username or password' };
        }
        
        // Check password
        if (user.password !== password) {
            console.log('Invalid password for user:', username);
            return { success: false, message: 'Invalid username or password' };
        }
        
        // Login successful
        console.log('Login successful for:', user.username);
        this.currentUser = user;
        localStorage.setItem('btf_current_user', JSON.stringify(user));
        return { success: true, user };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('btf_current_user');
        console.log('User logged out');
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const stored = localStorage.getItem('btf_current_user');
            if (stored) {
                try {
                    this.currentUser = JSON.parse(stored);
                    console.log('Restored user session:', this.currentUser.username);
                } catch (e) {
                    console.error('Error restoring user session:', e);
                    localStorage.removeItem('btf_current_user');
                }
            }
        }
        return this.currentUser;
    }

    hasPermission(requiredRoles) {
        if (!this.currentUser) return false;
        if (!requiredRoles || requiredRoles.length === 0) return true;
        return requiredRoles.includes(this.currentUser.role);
    }

    getAllUsers() {
        return this.users.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role
        }));
    }

    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    addUser(username, password, role) {
        // Check if user exists
        const existingUser = this.users.find(u => u.username === username);
        if (existingUser) {
            return { success: false, message: 'Username already exists' };
        }

        const newUser = {
            id: this.generateId(),
            username,
            password,
            role,
            email: `${username}@breakthefear.com`,
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        localStorage.setItem('btf_users', JSON.stringify(this.users));
        
        return { success: true, user: newUser };
    }

    updateUser(id, updates) {
        const userIndex = this.users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }

        // Check if username already exists (for other users)
        if (updates.username && this.users.find(u => u.username === updates.username && u.id !== id)) {
            return { success: false, message: 'Username already exists' };
        }
    
        this.users[userIndex] = { 
            ...this.users[userIndex], 
            ...updates,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('btf_users', JSON.stringify(this.users));
        
        return { success: true, user: this.users[userIndex] };
    }

    deleteUser(id) {
        const userIndex = this.users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }

        // Prevent deleting the last developer
        const user = this.users[userIndex];
        if (user.role === 'developer') {
            const developerCount = this.users.filter(u => u.role === 'developer').length;
            if (developerCount <= 1) {
                return { success: false, message: 'Cannot delete the last developer account' };
            }
        }

        this.users.splice(userIndex, 1);
        localStorage.setItem('btf_users', JSON.stringify(this.users));
        
        return { success: true };
    }
}

// Global auth manager instance
window.authManager = new AuthManager();

// Initialize application
console.log('Starting app initialization...');
window.app = new App();