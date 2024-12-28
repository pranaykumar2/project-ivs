// Main Authentication Controller
class AuthController {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.setupBackgroundEffects();
    }

    // Initialize DOM Elements
    initializeElements() {
        // Forms
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.switchButtons = document.querySelectorAll('.switch-btn');

        // Modal
        this.successModal = document.querySelector('.success-modal');

        // Current active form
        this.currentForm = 'login';

        // Add specific references for the switcher
        this.formSwitcher = document.querySelector('.form-switcher');
        this.switchIndicator = document.querySelector('.switch-indicator');
    }

    // Bind Event Listeners
    bindEvents() {
        // Form switching
        this.switchButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchForm(btn.dataset.form));
        });

        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleSubmit(e, 'login'));
        this.registerForm.addEventListener('submit', (e) => this.handleSubmit(e, 'register'));

        // Password toggles
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePassword(e));
        });

        // Password strength
        const registerPassword = document.getElementById('registerPassword');
        if (registerPassword) {
            registerPassword.addEventListener('input', (e) => this.updatePasswordStrength(e));
        }

        // Input validations
        document.querySelectorAll('.input-field').forEach(input => {
            input.addEventListener('blur', (e) => this.validateInput(e));
            input.addEventListener('input', (e) => this.clearError(e));
        });

        // Add resize handler for responsive behavior
        window.addEventListener('resize', () => {
            this.updateSwitchIndicator(this.currentForm);
        });
    }

    // Form Switching Logic
    switchForm(formType) {
        if (this.currentForm === formType) return;

        // Update button states
        this.switchButtons.forEach(btn => {
            const isActive = btn.dataset.form === formType;
            btn.classList.toggle('active', isActive);

            // Update ARIA attributes for accessibility
            btn.setAttribute('aria-pressed', isActive);
        });

        // Handle form visibility
        const currentForm = document.getElementById(`${this.currentForm}Form`);
        const targetForm = document.getElementById(`${formType}Form`);

        currentForm.classList.add('inactive');
        targetForm.classList.remove('inactive');

        // Force indicator reflow and update
        this.updateSwitchIndicator(formType);

        this.currentForm = formType;
        this.clearForms();
    }

    // New method for handling switch indicator
    updateSwitchIndicator(formType) {
        // Force reflow
        this.switchIndicator.style.transition = 'none';
        this.switchIndicator.offsetHeight;

        // Calculate and set the exact position
        const activeButton = this.formSwitcher.querySelector(`[data-form="${formType}"]`);
        const switcherRect = this.formSwitcher.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();

        const leftPosition = buttonRect.left - switcherRect.left - 8; // 8px for padding

        // Re-enable transition and move
        this.switchIndicator.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        this.switchIndicator.style.transform = `translateX(${leftPosition}px)`;
    }

    // Password Visibility Toggle
    togglePassword(e) {
        const button = e.currentTarget;
        const input = button.parentElement.querySelector('.input-field');
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('ri-eye-line', 'ri-eye-off-line');
        } else {
            input.type = 'password';
            icon.classList.replace('ri-eye-off-line', 'ri-eye-line');
        }
    }

    // Password Strength Checker
    updatePasswordStrength(e) {
        const password = e.target.value;
        const strengthBars = document.querySelectorAll('.strength-fill');

        const criteria = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };

        const strength = Object.values(criteria).filter(Boolean).length;

        strengthBars.forEach((bar, index) => {
            bar.className = 'strength-fill';
            if (index < strength) {
                bar.classList.add(
                    strength <= 2 ? 'weak' :
                        strength <= 3 ? 'medium' : 'strong'
                );
            }
        });
    }

    // Input Validation
    validateInput(e) {
        const input = e.target;
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch(input.type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                errorMessage = isValid ? '' : 'Please enter a valid email address';
                break;

            case 'password':
                isValid = value.length >= 8;
                errorMessage = isValid ? '' : 'Password must be at least 8 characters';
                break;

            case 'text':
                isValid = value.length >= 2;
                errorMessage = isValid ? '' : 'This field is required';
                break;
        }

        this.setInputStatus(input, isValid, errorMessage);
        return isValid;
    }

    // Set Input Status (Success/Error)
    setInputStatus(input, isValid, message = '') {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');

        formGroup.classList.toggle('error', !isValid);
        if (errorElement) {
            errorElement.innerHTML = message ? `<i class="ri-error-warning-line"></i>${message}` : '';
        }
    }

    // Clear Error State
    clearError(e) {
        const formGroup = e.target.closest('.form-group');
        formGroup.classList.remove('error');
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) errorElement.textContent = '';
    }

    // Form Submission Handler
    async handleSubmit(e, formType) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('.submit-btn');

        // Validate all inputs
        let isValid = true;
        form.querySelectorAll('.input-field').forEach(input => {
            if (!this.validateInput({ target: input })) {
                isValid = false;
            }
        });

        if (!isValid) return;

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await this.simulateApiCall(formType, new FormData(form));

            if (formType === 'register') {
                this.showSuccessModal();
            } else {
                // Redirect to dashboard for login
                window.location.href = '/dashboard';
            }
        } catch (error) {
            this.showError(submitBtn, error.message);
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    // API Call Simulation
    simulateApiCall(type, formData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% success rate
                    resolve({ success: true });
                } else {
                    reject(new Error(type === 'login' ?
                        'Invalid credentials' :
                        'Account creation failed'
                    ));
                }
            }, 1500);
        });
    }

    // Success Modal Handler
    showSuccessModal() {
        this.successModal.classList.add('active');
        setTimeout(() => {
            this.successModal.classList.remove('active');
            this.switchForm('login');
        }, 2000);
    }

    // Error Display
    showError(element, message) {
        const errorToast = document.createElement('div');
        errorToast.className = 'error-toast';
        errorToast.innerHTML = `
            <i class="ri-error-warning-line"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(errorToast);

        setTimeout(() => {
            errorToast.remove();
        }, 3000);
    }

    // Clear Forms
    clearForms() {
        [this.loginForm, this.registerForm].forEach(form => {
            form.reset();
            form.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('error');
                const errorElement = group.querySelector('.error-message');
                if (errorElement) errorElement.textContent = '';
            });
        });
    }

    // Background Effects
    setupBackgroundEffects() {
        const spheres = document.querySelectorAll('.gradient-sphere');

        // Parallax effect on mouse move
        document.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            spheres.forEach((sphere, index) => {
                const speed = index === 0 ? 0.02 : 0.01;
                const x = (clientX - centerX) * speed;
                const y = (clientY - centerY) * speed;

                sphere.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthController();
});
