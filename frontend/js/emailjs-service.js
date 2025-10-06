// EmailJS service for contact form
class EmailJSService {
    constructor() {
        // Replace these with your actual EmailJS credentials
        this.serviceId = 'YOUR_EMAILJS_SERVICE_ID';
        this.templateId = 'YOUR_EMAILJS_TEMPLATE_ID'; 
        this.publicKey = 'YOUR_EMAILJS_PUBLIC_KEY';
        
        // Initialize EmailJS
        if (typeof emailjs !== 'undefined') {
            emailjs.init(this.publicKey);
        } else {
            console.warn('EmailJS SDK not loaded');
        }
    }

    async sendContactEmail(contactData) {
        try {
            if (typeof emailjs === 'undefined') {
                throw new Error('EmailJS SDK not loaded. Please check your configuration.');
            }

            const templateParams = {
                from_name: contactData.name,
                from_email: contactData.email,
                subject: contactData.subject,
                message: contactData.message,
                company_name: 'Complex App',
                timestamp: new Date().toLocaleString()
            };

            console.log('Sending email with params:', templateParams);

            const response = await emailjs.send(
                this.serviceId,
                this.templateId,
                templateParams
            );

            console.log('Email sent successfully:', response);

            return {
                success: true,
                message: 'Email sent successfully',
                data: response
            };
            
        } catch (error) {
            console.error('EmailJS error:', error);
            return {
                success: false,
                message: 'Failed to send email: ' + (error.text || error.message),
                error: error
            };
        }
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate form data
    validateContactData(data) {
        const errors = [];

        if (!data.name || data.name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        }

        if (!this.validateEmail(data.email)) {
            errors.push('Please enter a valid email address');
        }

        if (!data.subject || data.subject.trim().length < 5) {
            errors.push('Subject must be at least 5 characters long');
        }

        if (!data.message || data.message.trim().length < 10) {
            errors.push('Message must be at least 10 characters long');
        }

        return errors;
    }
}

// Create global instance
const emailService = new EmailJSService();

// Load EmailJS SDK dynamically
function loadEmailJSSDK() {
    return new Promise((resolve, reject) => {
        if (typeof emailjs !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load EmailJS SDK'));
        document.head.appendChild(script);
    });
}