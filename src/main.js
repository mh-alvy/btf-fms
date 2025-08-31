import AuthManager from './lib/auth.js';
import StorageManager from './lib/storage.js';
import './lib/supabase.js';

// Main application initialization
class App {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.init().catch(console.error);
    }

    async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        try {
            // Initialize managers
            this.authManager = new AuthManager();
            this.storageManager = new StorageManager();
            
            // Make managers globally available for legacy code
            window.authManager = this.authManager;
            window.storageManager = this.storageManager;

            // Initialize theme
            this.initializeTheme();
            
            // Check for existing user session
            await this.checkUserSession();
            
            // Initialize login form
            this.initializeLoginForm();
            
            // Initialize theme toggle
            this.initializeThemeToggle();
            
            // Initialize logout
            this.initializeLogout();

            console.log('Application initialized successfully');
            
            // Load other modules after managers are initialized
            await this.loadModules();
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    async loadModules() {
        try {
            // Dynamically import all other modules after managers are ready
            await Promise.all([
                import('../js/navigation.js'),
                import('../js/batch-management.js'),
                import('../js/student-management.js'),
                import('../js/fee-payment.js'),
                import('../js/reports.js'),
                import('../js/user-management.js'),
                import('../js/reference-management.js'),
                import('../js/students-database.js'),
                import('../js/invoice.js'),
                import('../js/dashboard.js')
            ]);
            console.log('All modules loaded successfully');
        } catch (error) {
            console.error('Error loading modules:', error);
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

    async checkUserSession() {
        try {
            const currentUser = this.authManager.getCurrentUser();
            if (currentUser) {
                this.currentUser = currentUser;
                await this.showMainApp();
            } else {
                this.showLoginModal();
            }
        } catch (error) {
            console.error('Error checking user session:', error);
            this.showLoginModal();
        }
    }

    initializeLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }
    }

    async handleLogin() {
        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value.trim();

        if (!username || !password) {
            this.showToast('Please enter both username and password', 'error');
            return;
        }

        try {
            // Disable login button during processing
            const loginBtn = document.querySelector('#loginForm button[type="submit"]');
            const originalText = loginBtn.textContent;
            loginBtn.disabled = true;
            loginBtn.textContent = 'Signing in...';

            const result = await this.authManager.login(username, password);
            
            if (result.success) {
                this.currentUser = result.user;
                this.showToast(`Welcome back, ${result.user.username}!`, 'success');
                await this.showMainApp();
                
                // Clear form
                document.getElementById('loginForm').reset();
            } else {
                this.showToast(result.error || 'Invalid username or password', 'error');
            }

            // Re-enable login button
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('An error occurred during login. Please try again.', 'error');
            
            // Re-enable login button
            const loginBtn = document.querySelector('#loginForm button[type="submit"]');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
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

    async showMainApp() {
        const loginModal = document.getElementById('loginModal');
        const mainApp = document.getElementById('app');
        
        if (loginModal) {
            loginModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        if (mainApp) {
            mainApp.style.display = 'flex';
        }

        // Initialize navigation and other managers
        await this.initializeManagers();
    }

    async initializeManagers() {
        try {
            // Initialize all the legacy managers that depend on global instances
            if (window.navigationManager && !window.navigationManager.isInitialized) {
                window.navigationManager.hideLoginModal();
            }

            // Update user info display
            const currentUserElement = document.getElementById('currentUser');
            if (currentUserElement && this.currentUser) {
                currentUserElement.textContent = `${this.currentUser.username} (${this.currentUser.role})`;
            }

            // Setup role-based navigation
            this.setupRoleBasedNavigation();

            // Refresh dashboard if available
            if (window.dashboardManager) {
                window.dashboardManager.refresh();
            }
        } catch (error) {
            console.error('Error initializing managers:', error);
        }
    }

    setupRoleBasedNavigation() {
        if (!this.currentUser) return;

        document.querySelectorAll('[data-roles]').forEach(element => {
            const requiredRoles = element.dataset.roles.split(',');
            if (!this.authManager.hasPermission(requiredRoles)) {
                element.style.display = 'none';
            } else {
                element.style.display = '';
            }
        });
    }

    async logout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                await this.authManager.logout();
                this.currentUser = null;
                this.showLoginModal();
                
                // Reset navigation to dashboard
                if (window.navigationManager) {
                    window.navigationManager.navigateTo('dashboard');
                }
                
                this.showToast('Logged out successfully', 'success');
            } catch (error) {
                console.error('Logout error:', error);
                this.showToast('An error occurred during logout', 'error');
            }
        }
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Toast styles
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            minWidth: '300px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            animation: 'slideInRight 0.3s ease',
            cursor: 'pointer'
        });

        switch (type) {
            case 'success':
                toast.style.backgroundColor = '#28a745';
                break;
            case 'error':
                toast.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                toast.style.backgroundColor = '#ffc107';
                toast.style.color = '#000';
                break;
            default:
                toast.style.backgroundColor = '#dc267f';
        }

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);

        // Remove on click
        toast.addEventListener('click', () => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        });
    }

    showError(message) {
        this.showToast(message, 'error');
    }
}

// Global logout function for legacy compatibility
window.logout = function() {
    if (window.app) {
        window.app.logout();
    }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Add CSS animations for toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);