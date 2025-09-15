// Modern Authentication JavaScript with Validation and Animations
class AuthenticationManager {
    constructor() {
        this.initializeEventListeners();
        this.initializeLottieAnimations();
        this.setupFormValidation();
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Password toggle
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePassword(e.target));
        });

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Real-time validation
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
            input.addEventListener('input', (e) => this.clearFieldError(e.target));
        });

        // Password strength checking
        const signupPassword = document.getElementById('signupPassword');
        if (signupPassword) {
            signupPassword.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
        }

        // Confirm password validation
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', (e) => this.validatePasswordMatch());
        }
    }

    initializeLottieAnimations() {
        // Initialize loading animation
        if (typeof lottie !== 'undefined') {
            this.loadingAnimation = lottie.loadAnimation({
                container: document.getElementById('loadingLottie'),
                renderer: 'svg',
                loop: true,
                autoplay: false,
                path: '/assets/lottie/loading.json'
            });

            this.successAnimation = lottie.loadAnimation({
                container: document.getElementById('successLottie'),
                renderer: 'svg',
                loop: false,
                autoplay: false,
                path: '/assets/lottie/success.json'
            });
        }
    }

    setupFormValidation() {
        // Email validation pattern
        this.emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        // Password validation pattern (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
        this.passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Switch forms
        document.querySelectorAll('.auth-form-container').forEach(form => {
            form.style.display = 'none';
        });
        document.getElementById(`${tabName}-form`).style.display = 'block';

        // Clear any existing errors
        this.clearAllErrors();
    }

    togglePassword(button) {
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Clear previous validation state
        field.classList.remove('is-valid', 'is-invalid');

        switch (field.type) {
            case 'email':
                if (!value) {
                    errorMessage = 'Email is required';
                    isValid = false;
                } else if (!this.emailPattern.test(value)) {
                    errorMessage = 'Please enter a valid email address';
                    isValid = false;
                }
                break;

            case 'password':
                if (!value) {
                    errorMessage = 'Password is required';
                    isValid = false;
                } else if (field.id === 'signupPassword' && !this.passwordPattern.test(value)) {
                    errorMessage = 'Password must be at least 8 characters with uppercase, lowercase, and number';
                    isValid = false;
                }
                break;

            case 'text':
                if (field.name === 'UserName') {
                    if (!value) {
                        errorMessage = 'Username is required';
                        isValid = false;
                    } else if (value.length < 3) {
                        errorMessage = 'Username must be at least 3 characters';
                        isValid = false;
                    }
                }
                break;

            case 'checkbox':
                if (field.required && !field.checked) {
                    errorMessage = 'You must agree to the terms';
                    isValid = false;
                }
                break;
        }

        // Apply validation state
        if (isValid) {
            field.classList.add('is-valid');
            this.hideFieldError(field);
        } else {
            field.classList.add('is-invalid');
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    validatePasswordMatch() {
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword');
        const confirmValue = confirmPassword.value;

        if (confirmValue && password !== confirmValue) {
            confirmPassword.classList.add('is-invalid');
            this.showFieldError(confirmPassword, 'Passwords do not match');
            return false;
        } else if (confirmValue) {
            confirmPassword.classList.remove('is-invalid');
            confirmPassword.classList.add('is-valid');
            this.hideFieldError(confirmPassword);
            return true;
        }
        return true;
    }

    checkPasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;

        let strength = 0;
        let strengthLabel = '';

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@$!%*?&]/.test(password)) strength++;

        // Remove all strength classes
        strengthBar.classList.remove('weak', 'fair', 'good', 'strong');

        switch (strength) {
            case 0:
            case 1:
                strengthBar.classList.add('weak');
                strengthLabel = 'Weak';
                break;
            case 2:
                strengthBar.classList.add('fair');
                strengthLabel = 'Fair';
                break;
            case 3:
            case 4:
                strengthBar.classList.add('good');
                strengthLabel = 'Good';
                break;
            case 5:
                strengthBar.classList.add('strong');
                strengthLabel = 'Strong';
                break;
        }

        strengthText.textContent = `Password strength: ${strengthLabel}`;
    }

    showFieldError(field, message) {
        const feedback = field.parentNode.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.classList.add('show');
        }
    }

    hideFieldError(field) {
        const feedback = field.parentNode.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.classList.remove('show');
        }
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid');
        this.hideFieldError(field);
    }

    clearAllErrors() {
        document.querySelectorAll('.form-control').forEach(field => {
            field.classList.remove('is-valid', 'is-invalid');
        });
        document.querySelectorAll('.invalid-feedback').forEach(feedback => {
            feedback.classList.remove('show');
        });
    }

    validateForm(form) {
        let isValid = true;
        const fields = form.querySelectorAll('.form-control[required], .form-check-input[required]');
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Additional validation for signup form
        if (form.id === 'signupForm') {
            if (!this.validatePasswordMatch()) {
                isValid = false;
            }
        }

        return isValid;
    }

    showLoading(button) {
        button.disabled = true;
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'flex';

        // Use LottieManager for loading overlay
        if (window.lottieManager) {
            this.loadingOverlayId = window.lottieManager.showLoadingOverlay(document.body, {
                text: 'Authenticating...',
                width: '60px',
                height: '60px'
            });
        }
    }

    hideLoading(button) {
        button.disabled = false;
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (btnText) btnText.style.display = 'block';
        if (btnLoading) btnLoading.style.display = 'none';

        // Remove loading overlay
        if (window.lottieManager && this.loadingOverlayId) {
            window.lottieManager.removeOverlay(this.loadingOverlayId);
            this.loadingOverlayId = null;
        }
    }

    showSuccess(message = 'Welcome back!') {
        if (window.lottieManager) {
            // Create success notification
            const successContainer = document.createElement('div');
            successContainer.className = 'auth-success-notification';
            successContainer.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10001;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                padding: 30px;
                text-align: center;
                min-width: 300px;
            `;
            
            document.body.appendChild(successContainer);
            
            window.lottieManager.showSuccess(successContainer, {
                message: message,
                duration: 2000,
                width: '60px',
                height: '60px',
                replace: false,
                onComplete: () => {
                    successContainer.remove();
                }
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const loginBtn = document.getElementById('loginBtn');

        // Validate form
        if (!this.validateForm(form)) {
            NotificationManager.show('Please fix the errors below', 'error');
            this.shakeForm(form);
            return;
        }

        // Show loading state
        this.showLoading(loginBtn);

        try {
            const formData = {
                Email: document.getElementById('email').value,
                Password: document.getElementById('password').value
            };

            const response = await fetch('/api/User/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                
                // Show success feedback
                this.showFormSuccess('Login successful! Redirecting...');
                if (typeof NotificationManager !== 'undefined' && NotificationManager.show) {
                    NotificationManager.show('Welcome back! Redirecting to dashboard...', 'success');
                }
                
                // Show success animation
                this.showSuccess('Login successful!');
                
                // Redirect after animation
                setTimeout(() => {
                    window.location.href = data.redirectToUrl || '/Home';
                }, 2000);
            } else {
                // Handle different error status codes
                let errorMessage = 'Login failed. Please try again.';
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    // If response is not JSON, use status-based messages
                    switch (response.status) {
                        case 401:
                            errorMessage = 'Invalid email or password. Please check your credentials.';
                            break;
                        case 403:
                            errorMessage = 'Account is locked or suspended. Please contact support.';
                            break;
                        case 429:
                            errorMessage = 'Too many login attempts. Please try again later.';
                            break;
                        case 500:
                            errorMessage = 'Server error. Please try again later.';
                            break;
                        default:
                            errorMessage = `Login failed (${response.status}). Please try again.`;
                    }
                }
                
                // Show error feedback
                this.showFormError(errorMessage);
                if (typeof NotificationManager !== 'undefined' && NotificationManager.show) {
                    NotificationManager.show(errorMessage, 'error');
                } else {
                    alert(errorMessage);
                }
                this.shakeForm(form);
                
                // Mark email/password fields as invalid
                document.getElementById('email').classList.add('is-invalid');
                document.getElementById('password').classList.add('is-invalid');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Connection error. Please check your internet connection and try again.';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Unable to connect to server. Please try again later.';
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            
            this.showFormError(errorMessage);
            
            // Check if NotificationManager is available
            if (typeof NotificationManager !== 'undefined' && NotificationManager.show) {
                NotificationManager.show(errorMessage, 'error');
            } else {
                // Fallback to alert if NotificationManager is not available
                alert(errorMessage);
            }
            
            this.shakeForm(form);
        } finally {
            this.hideLoading(loginBtn);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const form = e.target;
        const signupBtn = document.getElementById('signupBtn');

        // Validate form
        if (!this.validateForm(form)) {
            NotificationManager.show('Please fix the errors below', 'error');
            this.shakeForm(form);
            return;
        }

        // Show loading state
        this.showLoading(signupBtn);

        try {
            // For now, submit form normally (can be enhanced with AJAX later)
            NotificationManager.show('Creating your account...', 'info');
            form.submit();
        } catch (error) {
            console.error('Signup error:', error);
            this.showFormError('Signup failed. Please try again.');
            NotificationManager.show('Signup failed. Please try again.', 'error');
            this.shakeForm(form);
            this.hideLoading(signupBtn);
        }
    }

    // Enhanced feedback methods
    showFormSuccess(message) {
        this.removeFormFeedback();
        const feedback = this.createFormFeedback(message, 'success');
        const form = document.querySelector('.auth-form');
        if (form) {
            form.appendChild(feedback);
            setTimeout(() => feedback.classList.add('show'), 100);
        }
    }

    showFormError(message) {
        this.removeFormFeedback();
        const feedback = this.createFormFeedback(message, 'error');
        const form = document.querySelector('.auth-form');
        if (form) {
            form.appendChild(feedback);
            setTimeout(() => feedback.classList.add('show'), 100);
        }
    }

    createFormFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `form-feedback ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        feedback.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        return feedback;
    }

    removeFormFeedback() {
        const existingFeedback = document.querySelector('.form-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
    }

    shakeForm(form) {
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
    }
}

// Legacy function for backward compatibility
function OnLogin() {
    // This function is kept for backward compatibility
    // The new AuthenticationManager handles login via form submission
    const authManager = new AuthenticationManager();
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const submitEvent = new Event('submit');
        authManager.handleLogin(submitEvent);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new AuthenticationManager();
});