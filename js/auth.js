// Authentication System
import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    getDocs,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.maxLoginAttempts = 5;
        this.loginAttempts = this.loadLoginAttempts();
        this.useFirebase = true;
        this.init();
    }

    async init() {
        try {
            // Try to initialize Firebase Auth
            await this.initializeFirebaseAuth();
        } catch (error) {
            console.error('Firebase Auth initialization failed, falling back to localStorage:', error);
            this.useFirebase = false;
        }
        
        this.loadUsers();
        this.ensureDefaultUsers();
    }

    async initializeFirebaseAuth() {
        return new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    // User is signed in, get user data from Firestore
                    try {
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        if (userDoc.exists()) {
                            this.currentUser = {
                                id: user.uid,
                                email: user.email,
                                ...userDoc.data()
                            };
                        }
                    } catch (error) {
                        console.error('Error getting user data:', error);
                    }
                } else {
                    this.currentUser = null;
                }
                unsubscribe();
                resolve();
            }, reject);
        });
    }

    loadUsers() {
        if (this.useFirebase) {
            // Users are loaded from Firestore via storageManager
            this.users = window.storageManager?.getUsers() || [];
        } else {
            try {
                const storedUsers = localStorage.getItem('btf_users');
                if (storedUsers) {
                    this.users = JSON.parse(storedUsers);
                } else {
                    this.users = [];
                }
            } catch (e) {
                console.error('Error loading users:', e);
                this.users = [];
            }
        }
    }

    async ensureDefaultUsers() {
        // Only create default users if no users exist
        if (!this.users || this.users.length === 0) {
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
                username: 'admin',
                password: 'admin123', // Plain text for demo
                role: 'admin',
                email: 'admin@breakthefear.com'
            },
            {
                username: 'manager',
                password: 'manager123', // Plain text for demo
                role: 'manager',
                email: 'manager@breakthefear.com'
            },
            {
                username: 'developer',
                password: 'dev123', // Plain text for demo
                role: 'developer',
                email: 'developer@breakthefear.com'
            }
        ];

        if (this.useFirebase) {
            // Create users in Firestore
            for (const userData of defaultUsers) {
                try {
                    const user = await window.storageManager.addUser(userData);
                    this.users.push(user);
                } catch (error) {
                    console.error('Error creating default user:', error);
                }
            }
        } else {
            // Create users in localStorage
            this.users = defaultUsers.map(user => ({
                ...user,
                id: this.generateId(),
                createdAt: new Date().toISOString()
            }));
            this.saveUsers();
        }
        
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

    saveUsers() {
        if (!this.useFirebase) {
            localStorage.setItem('btf_users', JSON.stringify(this.users));
        }
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

    async login(username, password) {
        console.log('Login attempt:', { username, password });
        
        // Prevent any potential form submission issues
        if (!username || !password) {
            return { success: false, message: 'Username and password are required' };
        }
        
        // Ensure users are loaded
        if (!this.users || this.users.length === 0) {
            console.log('Loading users...');
            this.loadUsers();
            await this.ensureDefaultUsers();
        }
        
        console.log('Available users for login:', this.users.map(u => ({ username: u.username, role: u.role })));
        
        // Check if account is locked
        if (this.isAccountLocked(username)) {
            return { 
                success: false, 
                message: 'Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.' 
            };
        }

        // Find user and verify credentials
        const user = this.users.find(u => u.username === username);
        
        if (!user) {
            console.log('User not found:', username);
            this.recordLoginAttempt(username, false);
            return { success: false, message: 'Invalid credentials' };
        }
        
        // Check password
        if (user.password !== password) {
            console.log('Invalid password for user:', username);
            this.recordLoginAttempt(username, false);
            return { success: false, message: 'Invalid credentials' };
        }
        
        console.log('Login successful for user:', user);
        this.recordLoginAttempt(username, true);
        this.currentUser = user;
        localStorage.setItem('btf_current_user', JSON.stringify(user));
        return { success: true, user };
    }

    async logout() {
        if (this.useFirebase) {
            try {
                await signOut(auth);
            } catch (error) {
                console.error('Firebase logout error:', error);
            }
        }
        
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
        // Check if user exists
        const existingUser = this.useFirebase ? 
            window.storageManager?.getUsers().find(u => u.username === username) :
            this.users.find(u => u.username === username);
            
        if (existingUser) {
            return { success: false, message: 'Username already exists' };
        }

        const newUser = {
            username,
            password, // Store as plain text for demo
            role,
            email: `${username}@breakthefear.com`
        };

        if (this.useFirebase) {
            try {
                const savedUser = await window.storageManager.addUser(newUser);
                this.users = window.storageManager.getUsers();
                return { success: true, user: savedUser };
            } catch (error) {
                console.error('Error adding user to Firestore:', error);
                return { success: false, message: 'Failed to create user' };
            }
        } else {
            newUser.id = this.generateId();
            newUser.createdAt = new Date().toISOString();
            this.users.push(newUser);
            this.saveUsers();
        }
        
        return { success: true, user: newUser };
    }

    async updateUser(id, updates) {
        if (this.useFirebase) {
            try {
                const updatedUser = await window.storageManager.updateUser(id, updates);
                if (updatedUser) {
                    this.users = window.storageManager.getUsers();
                    return { success: true, user: updatedUser };
                }
                return { success: false, message: 'User not found' };
            } catch (error) {
                console.error('Error updating user in Firestore:', error);
                return { success: false, message: 'Failed to update user' };
            }
        } else {
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
            this.saveUsers();
        }
        
        return { success: true, user: this.users[userIndex] };
    }

    async deleteUser(id) {
        if (this.useFirebase) {
            try {
                const users = window.storageManager.getUsers();
                const user = users.find(u => u.id === id);
                
                if (!user) {
                    return { success: false, message: 'User not found' };
                }

                // Prevent deleting the last developer
                if (user.role === 'developer') {
                    const developerCount = users.filter(u => u.role === 'developer').length;
                    if (developerCount <= 1) {
                        return { success: false, message: 'Cannot delete the last developer account' };
                    }
                }

                const result = await window.storageManager.deleteUser(id);
                if (result.success) {
                    this.users = window.storageManager.getUsers();
                }
                return result;
            } catch (error) {
                console.error('Error deleting user from Firestore:', error);
                return { success: false, message: 'Failed to delete user' };
            }
        } else {
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
            this.saveUsers();
        }
        
        return { success: true };
    }

    getAllUsers() {
        const users = this.useFirebase ? window.storageManager?.getUsers() || [] : this.users;
        return users.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role
        }));
    }
}

// Global auth manager instance
window.authManager = new AuthManager();