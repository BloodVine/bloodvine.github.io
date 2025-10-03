// Main application JavaScript
class ComplexApp {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('user_data') || 'null');
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.checkAuthentication();
    }

    setupNavigation() {
        // Mobile menu toggle
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    setupEventListeners() {
        // Global event listeners
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-logout]')) {
                this.logout();
            }
        });
    }

    checkAuthentication() {
        const navAuth = document.getElementById('navAuth');
        const navUser = document.getElementById('navUser');
        const userName = document.getElementById('userName');

        if (this.user && this.token) {
            if (navAuth) navAuth.style.display = 'none';
            if (navUser) navUser.style.display = 'flex';
            if (userName) userName.textContent = `${this.user.first_name} ${this.user.last_name}`;
        } else {
            if (navAuth) navAuth.style.display = 'flex';
            if (navUser) navUser.style.display = 'none';
        }
    }

    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Insert at top of main content
        const main = document.querySelector('main');
        if (main) {
            main.insertBefore(alert, main.firstChild);
        } else {
            document.body.insertBefore(alert, document.body.firstChild);
        }

        // Auto remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    showLoading() {
        // Create loading overlay
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = '<div class="spinner"></div>';
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        document.body.appendChild(loading);
        return loading;
    }

    hideLoading(loadingElement) {
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        this.token = null;
        this.user = null;
        window.location.href = '/';
    }

    // Utility methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize app
const app = new ComplexApp();

// Global logout function
function logout() {
    app.logout();
}

// Make app available globally
window.ComplexApp = app;