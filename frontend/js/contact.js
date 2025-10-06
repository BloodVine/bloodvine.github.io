// Contact form functionality with EmailJS
class ContactManager {
    constructor() {
        this.app = window.ComplexApp;
        this.emailService = emailService;
        this.setupContactForm();
        this.loadEmailJS();
    }

    async loadEmailJS() {
        try {
            await loadEmailJSSDK();
            console.log('EmailJS SDK loaded successfully');
        } catch (error) {
            console.error('Failed to load EmailJS SDK:', error);
            this.app.showAlert('Warning: Email service not available', 'error');
        }
    }

    setupContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
            
            // Real-time validation
            const inputs = contactForm.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
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
                isValid = this.emailService.validateEmail(value);
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

    clearFieldError(field) {
        const existingError = field.parentNode.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }
        field.style.borderColor = '#94a3b8';
    }

    showFieldError(field, isValid, message) {
        this.clearFieldError(field);

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
            // Update button state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            }

            const formData = new FormData(form);
            const data = {
                name: formData.get('name').trim(),
                email: formData.get('email').trim(),
                subject: formData.get('subject').trim(),
                message: formData.get('message').trim()
            };

            // Validate all fields
            const fields = form.querySelectorAll('input, textarea');
            let allValid = true;

            fields.forEach(field => {
                if (!this.validateField(field)) {
                    allValid = false;
                }
            });

            if (!allValid) {
                throw new Error('Please fix the validation errors above');
            }

            // Send email using EmailJS
            const emailResult = await this.emailService.sendContactEmail(data);

            if (!emailResult.success) {
                throw new Error(emailResult.message);
            }

            this.app.showAlert('Message sent successfully! We\'ll get back to you soon.', 'success');
            form.reset();

            // Also save to database (optional)
            try {
                await this.app.apiRequest('/contact', {
                    method: 'POST',
                    body: data
                });
            } catch (dbError) {
                console.warn('Failed to save to database:', dbError);
                // Don't show error to user since email was sent successfully
            }

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