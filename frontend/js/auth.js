// Authentication functionality
class AuthManager {
    constructor() {
        this.app = window.ComplexApp;
        this.setupAuthForms();
    }

    setupAuthForms() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const loading = this.app.showLoading();

        try {
            const formData = new FormData(form);
            const data = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            const result = await this.app.apiRequest('/auth/login', {
                method: 'POST',
                body: data
            });

            // Store auth data
            localStorage.setItem('auth_token', result.access_token);
            localStorage.setItem('user_data', JSON.stringify(result.user));
            
            this.app.showAlert('Login successful!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/pages/dashboard.html';
            }, 1000);

        } catch (error) {
            this.app.showAlert(error.message, 'error');
        } finally {
            this.app.hideLoading(loading);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Login';
            }
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const loading = this.app.showLoading();

        try {
            const formData = new FormData(form);
            const data = {
                email: formData.get('email'),
                password: formData.get('password'),
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name')
            };

            // Confirm password validation
            if (data.password !== formData.get('confirm_password')) {
                throw new Error('Passwords do not match');
            }

            const result = await this.app.apiRequest('/auth/register', {
                method: 'POST',
                body: data
            });

            // Store auth data
            localStorage.setItem('auth_token', result.access_token);
            localStorage.setItem('user_data', JSON.stringify(result.user));
            
            this.app.showAlert('Registration successful!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/pages/dashboard.html';
            }, 1000);

        } catch (error) {
            this.app.showAlert(error.message, 'error');
        } finally {
            this.app.hideLoading(loading);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Register';
            }
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});