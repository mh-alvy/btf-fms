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

    init() {
        console.log('App initialization started');
        
        // Initialize theme first
        this.initializeTheme();
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeApp();
            });
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        console.log('DOM ready, initializing app...');
        
        // Initialize login form immediately
        this.initializeLoginForm();
        
        // Check for existing user session
        this.checkUserSession();
        
        // Initialize other components
        this.initializeThemeToggle();
        this.initializeLogout();
        
        console.log('Application initialized successfully');
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
        
        const loginButton = document.getElementById('loginButton');
        
        if (!loginButton) {
            console.error('Login button not found');
            return;
        }

        // Remove any existing event listeners by cloning the button
        const newLoginButton = loginButton.cloneNode(true);
        loginButton.parentNode.replaceChild(newLoginButton, loginButton);

        // Add single click listener
        newLoginButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Login button clicked, handling login...');
            this.handleLogin();
            return false;
        });
        
        // Also handle Enter key press on password field
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Enter key pressed, handling login...');
                    this.handleLogin();
                    return false;
                }
            });
        }
        
        console.log('Login button event listeners added');
    }

    handleLogin() {
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
            const result = window.authManager.login(username, password);
            
            console.log('Login result:', result);
            
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
        
        console.log('Showing main app...');
        
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
        } else {
            console.error('NavigationManager not available');
        }

        // Refresh dashboard
        if (window.dashboardManager) {
            window.dashboardManager.refresh();
        } else {
            console.error('DashboardManager not available');
        }
        
        console.log('Main app displayed successfully');
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