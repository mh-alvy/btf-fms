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
        this.init();
    }

    async init() {
        console.log('App initialization started');
        
        // Initialize theme first
        this.initializeTheme();
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Wait for managers to be available
        await this.waitForManagers();
        
        // Initialize login form immediately
        this.initializeLoginForm();
        
        // Check for existing user session
        this.checkUserSession();
        
        // Initialize other components
        this.initializeThemeToggle();
        this.initializeLogout();
        
        console.log('Application initialized successfully');
    }

    async waitForManagers() {
        console.log('Waiting for managers...');
        
        // Wait for storage manager
        let attempts = 0;
        while (!window.storageManager && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
        }
        
        if (!window.storageManager) {
            console.error('StorageManager failed to initialize');
            return;
        }
        
        // Wait for auth manager
        attempts = 0;
        while (!window.authManager && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
        }
        
        if (!window.authManager) {
            console.error('AuthManager failed to initialize');
            return;
        }
        
        console.log('All managers loaded successfully');
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
        console.log('Initializing login form...');
        
        const loginForm = document.getElementById('loginForm');
        const loginButton = document.getElementById('loginButton');
        
        if (loginForm && loginButton) {
            // Handle form submission
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Login form submitted');
                await this.handleLogin();
            });
            
            // Handle button click
            loginButton.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('Login button clicked');
                await this.handleLogin();
            });
            
            console.log('Login form and button event listeners added');
        } else {
            console.error('Login form or button not found');
        }
    }

    async handleLogin() {
        console.log('Login attempt started');
        
        const loginButton = document.getElementById('loginButton');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (!usernameInput || !passwordInput) {
            console.error('Login form inputs not found');
            return;
        }
        
        // Disable button to prevent multiple clicks
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = 'Logging in...';
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        console.log('Login credentials:', { username, hasPassword: !!password });

        if (!username || !password) {
            Utils.showToast('Please enter both username and password', 'error');
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            }
            return;
        }

        if (!window.authManager) {
            console.error('AuthManager not available');
            Utils.showToast('System is still initializing, please wait...', 'warning');
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
                usernameInput.value = '';
                passwordInput.value = '';
                
                // Show main app
                this.showMainApp();
            } else {
                console.log('Login failed:', result.message);
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

// Initialize application
console.log('Starting app initialization...');
window.app = new App();