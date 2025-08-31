// Main application initialization
import './firebase-config.js';
import './firestore-storage.js';
import './utils.js';
import './auth.js';
import './navigation.js';
import './batch-management.js';
import './student-management.js';
import './fee-payment.js';
import './reports.js';
import './user-management.js';
import './reference-management.js';
import './students-database.js';
import './invoice.js';
import './dashboard.js';

class App {
    constructor() {
        this.currentUser = null;
        this.initializationPromise = this.init().catch(console.error);
    }

    async init() {
        // Wait for all managers to be available
        await this.waitForManagers();
        
        // Initialize theme
        this.initializeTheme();
        
        // Check for existing user session
        this.checkUserSession();
        
        // Initialize login form
        this.initializeLoginForm();
        
        // Initialize theme toggle
        this.initializeThemeToggle();
        
        // Initialize logout
        this.initializeLogout();
        
        console.log('Application initialized successfully');
    }

    async waitForManagers() {
        // Wait for storage manager to initialize
        let attempts = 0;
        while (!window.storageManager && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.storageManager && window.storageManager.init) {
            await window.storageManager.init();
        }
        
        // Wait for auth manager to initialize
        attempts = 0;
        while (!window.authManager && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.authManager && window.authManager.init) {
            await window.authManager.init();
        }
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('btf_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = savedTheme === 'light' ? '🌓' : '☀️';
        }
    }

    initializeThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('btf_theme', newTheme);
                themeToggle.textContent = newTheme === 'light' ? '🌓' : '☀️';
            });
        }
    }

    initializeLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    checkUserSession() {
        const currentUser = window.authManager?.getCurrentUser();
        console.log('Checking user session:', currentUser);
        if (currentUser) {
            this.currentUser = currentUser;
            this.showMainApp();
        } else {
            this.showLoginModal();
        }
    }

    initializeLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const loginButton = document.getElementById('loginButton');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleLogin();
            });
        }
        
        if (loginButton) {
            loginButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleLogin();
            });
        }
    }

    async handleLogin() {
        console.log('Login attempt started');
        
        // Prevent multiple submissions
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = 'Logging in...';
        }
        
        if (!window.authManager) {
            console.log('AuthManager not available');
            Utils.showToast('System is still initializing, please wait...', 'warning');
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            }
            return;
        }

        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value.trim();
        
        console.log('Login credentials:', { username, hasPassword: !!password });

        if (!username || !password) {
            Utils.showToast('Please enter both username and password', 'error');
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            }
            return;
        }

        try {
            const result = await window.authManager.login(username, password);
            
            if (result.success) {
                this.currentUser = result.user;
                console.log('Login successful:', result.user);
                Utils.showToast(`Welcome back, ${result.user.username}!`, 'success');
                
                // Clear form
                document.getElementById('loginForm').reset();
                
                // Show main app after a brief delay to ensure UI updates
                setTimeout(() => {
                    this.showMainApp();
                }, 100);
            } else {
                Utils.showToast(result.message || 'Invalid username or password', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            Utils.showToast('An error occurred during login. Please try again.', 'error');
        } finally {
            // Re-enable login button
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            }
        }
    }

    showLoginModal() {
        const loginModal = document.getElementById('loginModal');
        const mainApp = document.getElementById('app');
        
        if (loginModal) {
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Show first-time password if it exists
            const firstTimePassword = localStorage.getItem('btf_first_time_password');
            if (firstTimePassword) {
                const demoCredentials = loginModal.querySelector('.demo-credentials');
                if (demoCredentials) {
                    demoCredentials.innerHTML = `
                        <h4>🔐 First Time Setup:</h4>
                        <p><strong>Username:</strong> admin</p>
                        <p><strong>Password:</strong> ${firstTimePassword}</p>
                        <p style="color: var(--danger-color); font-weight: bold;">⚠️ Please change this password immediately after login!</p>
                    `;
                }
            }
        }
        if (mainApp) {
            mainApp.style.display = 'none';
        }
    }

    showMainApp() {
        const loginModal = document.getElementById('loginModal');
        const mainApp = document.getElementById('app');
        
        if (loginModal) {
            loginModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        if (mainApp) {
            mainApp.style.display = 'flex';
        }
        
        // Clear first-time password after successful login
        localStorage.removeItem('btf_first_time_password');

        // Setup role-based navigation
        if (window.navigationManager) {
            window.navigationManager.setupRoleBasedNavigation();
            window.navigationManager.navigateTo('dashboard');
        }

        // Refresh dashboard
        if (window.dashboardManager) {
            window.dashboardManager.refresh();
        }
    }

    logout() {
        Utils.confirm('Are you sure you want to logout?', () => {
            window.authManager.logout();
            this.currentUser = null;
            this.showLoginModal();
            
            // Reset navigation to dashboard
            window.navigationManager.navigateTo('dashboard');
            
            Utils.showToast('Logged out successfully', 'success');
        });
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    
    // Add a small delay to ensure all scripts are loaded
    setTimeout(() => {
        if (window.app && window.app.initializationPromise) {
            window.app.initializationPromise.catch(console.error);
        }
    }, 100);
    
    // Global logout function
    window.logout = function() {
        if (window.app) {
            window.app.logout();
        }
    };
});