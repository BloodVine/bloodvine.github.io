// Contact form functionality
class ContactManager {
    constructor() {
        this.app = window.ComplexApp;
        this.setupContactForm();
    }

    setupContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
            
            // Real-time validation
            const inputs = contactForm.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
            });
        }
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (field.name) {
            case 'name':
                isValid = value.length >= 2;
                errorMessage = 'Name must be at least 2 characters long';
                break;
            case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                errorMessage = 'Please enter a valid email address';
                break;
            case 'subject':
                isValid = value.length >= 5;
                errorMessage = 'Subject must be at least 5 characters long';
                break;
            case 'message':
                isValid = value.length >= 10;
                errorMessage = 'Message must be at least 10 characters long';
                break;
        }

        this.showFieldError(field, isValid, errorMessage);
        return isValid;
    }

    showFieldError(field, isValid, message) {
        // Remove existing error
        const existingError = field.parentNode.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }

        field.style.borderColor = isValid ? '#94a3b8' : '#ef4444';

        if (!isValid) {
            const errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            errorElement.textContent = message;
            field.parentNode.appendChild(errorElement);
        }
    }

    async handleContactSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const loading = this.app.showLoading();

        try {
            // Validate all fields
            const fields = form.querySelectorAll('input, textarea');
            let allValid = true;

            fields.forEach(field => {
                if (!this.validateField(field)) {
                    allValid = false;
                }
            });

            if (!allValid) {
                throw new Error('Please fix the validation errors');
            }

            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };

            const result = await this.app.apiRequest('/contact', {
                method: 'POST',
                body: data
            });

            this.app.showAlert('Message sent successfully! We\'ll get back to you soon.', 'success');
            form.reset();

        } catch (error) {
            this.app.showAlert(error.message, 'error');
        } finally {
            this.app.hideLoading(loading);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Message';
            }
        }
    }
}

// Initialize contact manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContactManager();
});