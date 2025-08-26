// Authentication System
class AuthManager {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = null;
        this.maxLoginAttempts = parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5;
        this.loginAttempts = this.loadLoginAttempts();
        this.initializeDefaultUsers();
    }

    initializeDefaultUsers() {
        // Only create default users if none exist and environment variables are set
        if (this.users.length === 0) {
            const defaultUsers = [];
            
            // Add admin user if credentials are provided
            const adminUsername = import.meta.env.VITE_DEFAULT_ADMIN_USERNAME;
            const adminPassword = import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD;
            if (adminUsername && adminPassword) {
                defaultUsers.push({ 
                    username: adminUsername, 
                    password: this.hashPassword(adminPassword), 
                    role: 'admin' 
                });
            }
            
            // Add manager user if credentials are provided
            const managerUsername = import.meta.env.VITE_DEFAULT_MANAGER_USERNAME;
            const managerPassword = import.meta.env.VITE_DEFAULT_MANAGER_PASSWORD;
            if (managerUsername && managerPassword) {
                defaultUsers.push({ 
                    username: managerUsername, 
                    password: this.hashPassword(managerPassword), 
                    role: 'manager' 
                });
            }
            
            // Add developer user if credentials are provided
            const developerUsername = import.meta.env.VITE_DEFAULT_DEVELOPER_USERNAME;
            const developerPassword = import.meta.env.VITE_DEFAULT_DEVELOPER_PASSWORD;
            if (developerUsername && developerPassword) {
                defaultUsers.push({ 
                    username: developerUsername, 
                    password: this.hashPassword(developerPassword), 
                    role: 'developer' 
                });
            }
            
            // If no environment variables are set, create a single admin user with random password
            if (defaultUsers.length === 0) {
                const randomPassword = this.generateRandomPassword();
                defaultUsers.push({ 
                    username: 'admin', 
                    password: this.hashPassword(randomPassword), 
                    role: 'admin' 
                });
                
                // Show the generated password to the user
                console.warn('🔐 IMPORTANT: Default admin user created!');
                console.warn('Username: admin');
                console.warn('Password:', randomPassword);
                console.warn('Please change this password immediately after first login!');
                
                // Also store it temporarily in localStorage for first-time setup
                localStorage.setItem('btf_first_time_password', randomPassword);
            }

            defaultUsers.forEach(user => {
                if (!this.users.find(u => u.username === user.username)) {
                    this.users.push({ ...user, id: this.generateId() });
                }
            });

            this.saveUsers();
        }
    }

    generateRandomPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    // Simple hash function (in production, use bcrypt or similar)
    hashPassword(password) {
        let hash = 0;
        if (password.length === 0) return hash.toString();
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    loadLoginAttempts() {
        return JSON.parse(localStorage.getItem('btf_login_attempts') || '{}');
    }

    saveLoginAttempts() {
        localStorage.setItem('btf_login_attempts', JSON.stringify(this.loginAttempts));
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

    loadUsers() {
        return JSON.parse(localStorage.getItem('btf_users') || '[]');
    }

    saveUsers() {
        localStorage.setItem('btf_users', JSON.stringify(this.users));
    }

    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    login(username, password) {
        // Check if account is locked
        if (this.isAccountLocked(username)) {
            return { 
                success: false, 
                message: 'Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.' 
            };
        }

        const hashedPassword = this.hashPassword(password);
        const user = this.users.find(u => u.username === username && u.password === hashedPassword);
        
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
                this.currentUser = JSON.parse(stored);
            }
        }
        return this.currentUser;
    }

    hasPermission(requiredRoles) {
        if (!this.currentUser) return false;
        if (!requiredRoles || requiredRoles.length === 0) return true;
        return requiredRoles.includes(this.currentUser.role);
    }

    addUser(username, password, role) {
        if (this.users.find(u => u.username === username)) {
            return { success: false, message: 'Username already exists' };
        }

        const newUser = {
            id: this.generateId(),
            username,
            password: this.hashPassword(password),
            role
        };

        this.users.push(newUser);
        this.saveUsers();
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

        // Hash password if it's being updated
        if (updates.password) {
            updates.password = this.hashPassword(updates.password);
        }
        
        this.users[userIndex] = { ...this.users[userIndex], ...updates };
        this.saveUsers();
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
        this.saveUsers();
        return { success: true };
    }

    getAllUsers() {
        return this.users.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role
        }));
    }
}

// Global auth manager instance
window.authManager = new AuthManager();
