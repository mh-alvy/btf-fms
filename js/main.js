// Main application initialization
import './utils.js';
import './auth.js';
import './navigation.js';
import './storage.js';
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
        console.log('Setting up login form...');
        
        // Direct event listener on login button
        const loginButton = document.getElementById('loginButton');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (!loginButton) {
            console.error('Login button not found!');
            return;
        }
        
        if (!usernameInput || !passwordInput) {
            console.error('Login inputs not found!');
            return;
        }
        
        console.log('Login elements found, adding event listeners...');
        
        // Remove any existing event listeners
        loginButton.replaceWith(loginButton.cloneNode(true));
        const newLoginButton = document.getElementById('loginButton');
        
        // Add click event listener
        newLoginButton.addEventListener('click', (e) => {
            console.log('Login button clicked!');
            e.preventDefault();
            e.stopPropagation();
            this.handleLogin();
        });
        
        // Add Enter key support
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                passwordInput.focus();
            }
        });
        
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleLogin();
            }
        });
        
        console.log('Login form initialized successfully');
    }

    handleLogin() {
        console.log('handleLogin called');
        
        const loginButton = document.getElementById('loginButton');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (!usernameInput || !passwordInput) {
            console.error('Login inputs not found during login attempt');
            alert('Login form not properly initialized');
            return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        console.log('Login attempt with:', { username, hasPassword: !!password });
        
        if (!username || !password) {
            alert('Please enter both username and password');
            return;
        }
        
        // Disable button during login
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = 'Logging in...';
        }
        
        try {
            if (!window.authManager) {
                console.error('AuthManager not available');
                alert('Authentication system not ready. Please refresh the page.');
                return;
            }
            
            const result = window.authManager.login(username, password);
            console.log('Login result:', result);
            
            if (result.success) {
                this.currentUser = result.user;
                console.log('Login successful for:', result.user.username);
                
                // Clear form
                usernameInput.value = '';
                passwordInput.value = '';
                
                // Show success message
                alert(`Welcome back, ${result.user.username}!`);
                
                // Show main app
                this.showMainApp();
            } else {
                console.log('Login failed:', result.message);
                alert(result.message || 'Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        } finally {
            // Re-enable login button
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            }
        }
    }

    showLoginModal() {
        console.log('Showing login modal');
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
        console.log('Showing main app');
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
        
        console.log('Main app displayed successfully');
    }
}

// Initialize application
console.log('Starting app initialization...');
window.app = new App();