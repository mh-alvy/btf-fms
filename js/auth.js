// Authentication System - Updated to use Firestore
import { FirestoreStorageManager } from './firestore-storage.js';

class AuthManager {
    constructor() {
        this.firestoreManager = new FirestoreStorageManager();
        this.currentUser = null;
        this.maxLoginAttempts = 5;
        this.loginAttempts = this.loadLoginAttempts();
        this.init();
    }

    async init() {
        await this.loadUsers();
        await this.ensureDefaultUsers();
    }

    async loadUsers() {
        try {
            // Try to load from Firestore first
            if (this.firestoreManager.cache.users) {
                this.users = this.firestoreManager.cache.users;
            } else {
                // Fallback to localStorage
                const storedUsers = localStorage.getItem('btf_users');
                if (storedUsers) {
                    this.users = JSON.parse(storedUsers);
                } else {
                    this.users = [];
                }
            }
        } catch (e) {
            console.error('Error loading users:', e);
            this.users = [];
        }
    }

    async ensureDefaultUsers() {
        // Only create default users if no users exist
        if (this.users.length === 0) {
            await this.createDefaultUsers();
            console.log('Created default demo users');
        } else {
            console.log('Existing users found, skipping default user creation');
        }
    }

    async createDefaultUsers() {
        // Create default users with plain text passwords for demo
        const defaultUsers = [
            {
                id: 'user_admin_001',
                username: 'admin',
                password: 'admin123', // Plain text for demo
                role: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 'user_manager_001',
                username: 'manager',
                password: 'manager123', // Plain text for demo
                role: 'manager',
                createdAt: new Date().toISOString()
            },
            {
                id: 'user_developer_001',
                username: 'developer',
                password: 'dev123', // Plain text for demo
                role: 'developer',
                createdAt: new Date().toISOString()
            }
        ];

        // Add users to Firestore
        for (const user of defaultUsers) {
            try {
                await this.firestoreManager.addUser(user);
            } catch (error) {
                console.error('Error creating default user:', error);
                // Fallback to localStorage
                this.users.push(user);
            }
        }
        
        this.users = this.firestoreManager.getUsers();
        this.saveUsersToLocalStorage();
        console.log('Default users created:', this.users.map(u => ({ username: u.username, role: u.role })));
    }

    loadLoginAttempts() {
        try {
            return JSON.parse(localStorage.getItem('btf_login_attempts') || '{}');
        } catch (e) {
            return {};
        }
    }

    saveLoginAttempts() {
        localStorage.setItem('btf_login_attempts', JSON.stringify(this.loginAttempts));
    }

    saveUsersToLocalStorage() {
        localStorage.setItem('btf_users', JSON.stringify(this.users));
    }

    isAccountLocked(username) {
        const attempts = this.loginAttempts[username];
        if (!attempts) return false;
        
        const now = Date.now();
        const lockoutTime = 15 * 60 * 1000; // 15 minutes
        
        if (attempts.count >= this.maxLoginAttempts) {
            if (now - attempts.lastAttempt < lockoutTime) {
                return true;
            }
            // Reset attempts after lockout period
            delete this.loginAttempts[username];
            this.saveLoginAttempts();
        }
        return false;
    }

    recordLoginAttempt(username, success) {
        if (success) {
            // Clear failed attempts on successful login
            delete this.loginAttempts[username];
        } else {
            // Record failed attempt
            if (!this.loginAttempts[username]) {
                this.loginAttempts[username] = { count: 0, lastAttempt: 0 };
            }
            this.loginAttempts[username].count++;
            this.loginAttempts[username].lastAttempt = Date.now();
        }
        this.saveLoginAttempts();
    }

    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    login(username, password) {
        console.log('Login attempt:', { username, password });
        
        // Ensure users are loaded
        this.users = this.firestoreManager.getUsers();
        
        // Check if account is locked
        if (this.isAccountLocked(username)) {
            return { 
                success: false, 
                message: 'Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.' 
            };
        }

        // Simple direct comparison for demo credentials
        const user = this.users.find(u => u.username === username && u.password === password);
        
        console.log('Available users:', this.users);
        console.log('Found user:', user);
        
        if (user) {
            this.recordLoginAttempt(username, true);
            this.currentUser = user;
            localStorage.setItem('btf_current_user', JSON.stringify(user));
            return { success: true, user };
        }
        
        this.recordLoginAttempt(username, false);
        return { success: false, message: 'Invalid credentials' };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('btf_current_user');
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const stored = localStorage.getItem('btf_current_user');
            if (stored) {
                try {
                    this.currentUser = JSON.parse(stored);
                } catch (e) {
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

    async addUser(username, password, role) {
        // Check if user exists in current cache
        if (this.users.find(u => u.username === username)) {
            return { success: false, message: 'Username already exists' };
        }

        const newUser = {
            id: this.generateId(),
            username,
            password, // Store as plain text for demo
            role,
            createdAt: new Date().toISOString()
        };

        try {
            await this.firestoreManager.addUser(newUser);
            this.users = this.firestoreManager.getUsers();
            this.saveUsersToLocalStorage();
        } catch (error) {
            console.error('Error adding user to Firestore:', error);
            // Fallback to localStorage
            this.users.push(newUser);
            this.saveUsersToLocalStorage();
        }
        
        return { success: true, user: newUser };
    }

    async updateUser(id, updates) {
        const userIndex = this.users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }

        // Check if username already exists (for other users)
        if (updates.username && this.users.find(u => u.username === updates.username && u.id !== id)) {
            return { success: false, message: 'Username already exists' };
        }
        
        try {
            await this.firestoreManager.updateUser(id, updates);
            this.users = this.firestoreManager.getUsers();
            this.saveUsersToLocalStorage();
        } catch (error) {
            console.error('Error updating user in Firestore:', error);
            // Fallback to localStorage
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            this.saveUsersToLocalStorage();
        }
        
        return { success: true, user: this.users[userIndex] };
    }

    async deleteUser(id) {
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

        try {
            await this.firestoreManager.deleteUser(id);
            this.users = this.firestoreManager.getUsers();
            this.saveUsersToLocalStorage();
        } catch (error) {
            console.error('Error deleting user from Firestore:', error);
            // Fallback to localStorage
            this.users.splice(userIndex, 1);
            this.saveUsersToLocalStorage();
        }
        
        return { success: true };
    }

    getAllUsers() {
        this.users = this.firestoreManager.getUsers();
        return this.users.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role
        }));
    }
}

// Global auth manager instance
window.authManager = new AuthManager();