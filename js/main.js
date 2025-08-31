// Main application initialization - Updated for Firestore
class App {
    constructor() {
        this.currentUser = null;
        this.managers = {};
    }

    async init() {
        console.log('Initializing application...');
        
        // Initialize core managers first
        await this.initializeCoreManagers();
        
        // Initialize theme
        this.initializeTheme();
        
        // Initialize all other managers
        await this.initializeAllManagers();
        
        // Check for existing user session
        await this.checkUserSession();
        
        // Initialize login form
        this.initializeLoginForm();
        
        // Initialize theme toggle
        this.initializeThemeToggle();
        
        // Initialize logout
        this.initializeLogout();
    }

    async initializeCoreManagers() {
        try {
            // Initialize storage manager first (required by auth manager)
            console.log('Initializing storage manager...');
            if (typeof window.StorageManager === 'function') {
                window.storageManager = new window.StorageManager();
            } else {
                throw new Error('StorageManager class not available');
            }
            await window.storageManager.init();
            
            // Initialize auth manager second
            console.log('Initializing auth manager...');
            if (typeof window.AuthManager === 'function') {
                window.authManager = new window.AuthManager();
            } else {
                throw new Error('AuthManager class not available');
            }
            await window.authManager.init();
            
            console.log('Core managers initialized successfully');
        } catch (error) {
            console.error('Error initializing core managers:', error);
            console.error('Error details:', error.message);
            Utils.showToast('Error initializing core systems', 'error');
            throw error; // Re-throw to prevent further initialization
        }
    }

    async initializeAllManagers() {
        try {
            // Ensure core managers are available before proceeding
            if (!window.storageManager || !window.authManager) {
                throw new Error('Core managers not initialized');
            }
            
            console.log('Initializing all managers...');
            
            // Initialize managers in proper order
            if (typeof window.NavigationManager === 'function') {
                window.navigationManager = new window.NavigationManager();
            }
            if (typeof window.BatchManager === 'function') {
                window.batchManager = new window.BatchManager();
            }
            if (typeof window.StudentManagementManager === 'function') {
                window.studentManager = new window.StudentManagementManager();
            }
            if (typeof window.FeePaymentManager === 'function') {
                window.feePaymentManager = new window.FeePaymentManager();
            }
            if (typeof window.ReportsManager === 'function') {
                window.reportsManager = new window.ReportsManager();
            }
            if (typeof window.UserManagementManager === 'function') {
                window.userManagementManager = new window.UserManagementManager();
            }
            if (typeof window.ReferenceManagementManager === 'function') {
                window.referenceManagementManager = new window.ReferenceManagementManager();
            }
            if (typeof window.StudentsDatabaseManager === 'function') {
                window.studentsDatabaseManager = new window.StudentsDatabaseManager();
            }
            if (typeof window.InvoiceManager === 'function') {
                window.invoiceManager = new window.InvoiceManager();
            }
            if (typeof window.DashboardManager === 'function') {
                window.dashboardManager = new window.DashboardManager();
            }
            
            // Initialize all managers
            if (window.navigationManager) await window.navigationManager.init();
            if (window.batchManager) await window.batchManager.init();
            if (window.studentManager) await window.studentManager.init();
            if (window.feePaymentManager) await window.feePaymentManager.init();
            if (window.reportsManager) await window.reportsManager.init();
            if (window.userManagementManager) await window.userManagementManager.init();
            if (window.referenceManagementManager) await window.referenceManagementManager.init();
            if (window.studentsDatabaseManager) await window.studentsDatabaseManager.init();
            if (window.invoiceManager) await window.invoiceManager.init();
            if (window.dashboardManager) await window.dashboardManager.init();
            
            console.log('All managers initialized successfully');
        } catch (error) {
            console.error('Error initializing managers:', error);
            console.error('Error details:', error.message);
            Utils.showToast('Error initializing application components', 'error');
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
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    async handleLogin() {
        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value.trim();

        if (!username || !password) {
            Utils.showToast('Please enter both username and password', 'error');
            return;
        }

        const result = await window.authManager.login(username, password);
        
        if (result.success) {
            this.currentUser = result.user;
            console.log('Login successful:', result.user);
            Utils.showToast(`Welcome back, ${result.user.username}!`, 'success');
            this.showMainApp();
            
            // Clear form
            document.getElementById('loginForm').reset();
        } else {
            Utils.showToast(result.message || 'Invalid username or password', 'error');
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

        // Initialize navigation manager
        if (!window.navigationManager.isInitialized) {
            window.navigationManager.hideLoginModal();
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

// Global logout function
window.logout = function() {
    if (window.app) {
        window.app.logout();
    }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize application
    window.app = new App();
    window.app.init().catch(console.error);
});
