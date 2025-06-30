// Authentication Module
class AuthManager {
    constructor() {
        this.isLoginMode = true;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAuthForm();
    }

    setupEventListeners() {
        // Form submissions
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authSwitchLink = document.getElementById('auth-switch-link');
        const authModal = document.getElementById('auth-modal');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Switch between login and register
        if (authSwitchLink) {
            authSwitchLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Auth switch clicked'); // Debug log
                this.toggleAuthMode();
            });
        }

        // Close modal on outside click
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target.id === 'auth-modal') {
                    // Don't allow closing auth modal by clicking outside
                    // as user must be authenticated
                }
            });
        }
    }

    toggleAuthMode() {
        console.log('Toggling auth mode from:', this.isLoginMode ? 'login' : 'register');
        this.isLoginMode = !this.isLoginMode;
        console.log('Auth mode now:', this.isLoginMode ? 'login' : 'register');
        this.updateAuthForm();
    }

    updateAuthForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authTitle = document.getElementById('auth-title');
        const authSubtitle = document.getElementById('auth-subtitle');
        const authSwitchText = document.getElementById('auth-switch-text');
        const authSwitchLink = document.getElementById('auth-switch-link');

        // Check if all elements exist
        if (!loginForm || !registerForm || !authTitle || !authSubtitle || !authSwitchText || !authSwitchLink) {
            console.error('Auth form elements not found');
            return;
        }

        if (this.isLoginMode) {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            authTitle.textContent = 'Sign In';
            authSubtitle.textContent = 'Welcome back to your finance dashboard';
            authSwitchText.innerHTML = "Don't have an account? ";
            authSwitchLink.textContent = 'Sign up';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            authTitle.textContent = 'Create Account';
            authSubtitle.textContent = 'Start managing your finances today';
            authSwitchText.innerHTML = 'Already have an account? ';
            authSwitchLink.textContent = 'Sign in';
        }

        // Clear form errors
        this.clearFormErrors();
    }

    async handleLogin() {
        const form = document.getElementById('login-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';

            // Clear previous errors
            this.clearFormErrors();

            // Get form data
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            // Basic validation
            if (!email || !password) {
                throw new Error('Please fill in all fields');
            }

            // Make API request
            const response = await app.api.post('/auth/login', {
                email,
                password
            });

            if (response.success) {
                // Store auth data
                app.state.setAuth(response.token, response.user);
                
                // Show success message
                app.notifications.success('Welcome back!');
                
                // Switch to main app
                app.showApp();
            } else {
                throw new Error(response.message || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            
            // Handle specific error cases
            let errorMessage = 'Login failed';
            if (error.message.includes('Invalid email or password') || 
                error.message.includes('Authentication failed')) {
                errorMessage = 'Incorrect email or password';
            } else if (error.message.includes('Network') || 
                       error.message.includes('fetch')) {
                errorMessage = 'Unable to connect to server. Please check your connection.';
            } else if (error.message.includes('Account deactivated')) {
                errorMessage = 'Your account has been deactivated';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showFormError('login-form', errorMessage);
            app.notifications.error(errorMessage);
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async handleRegister() {
        const form = document.getElementById('register-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        try {
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';

            // Clear previous errors
            this.clearFormErrors();

            // Get form data
            const name = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const currency = document.getElementById('register-currency').value;

            // Basic validation
            if (!name || !email || !password || !confirmPassword) {
                throw new Error('Please fill in all fields');
            }

            if (name.length < 2) {
                throw new Error('Name must be at least 2 characters long');
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            if (!this.isValidEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            // Make API request
            const response = await app.api.post('/auth/register', {
                name,
                email,
                password,
                currency
            });

            if (response.success) {
                // Store auth data
                app.state.setAuth(response.token, response.user);
                
                // Show success message
                app.notifications.success(`Welcome ${response.user.name}! Your account has been created successfully.`);
                
                // Clear the form
                document.getElementById('register-form').reset();
                
                // Switch to main app
                app.showApp();
            } else {
                throw new Error(response.message || 'Registration failed');
            }

        } catch (error) {
            console.error('Registration error:', error);
            this.showFormError('register-form', error.message);
            app.notifications.error(error.message || 'Registration failed');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    showFormError(formId, message) {
        // Remove existing error
        this.clearFormErrors();

        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        errorElement.innerHTML = `
            <div style="
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.2);
                border-radius: 6px;
                padding: 0.75rem;
                margin-bottom: 1rem;
                color: #dc2626;
                font-size: 0.875rem;
            ">
                <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>
                ${message}
            </div>
        `;

        // Insert error at top of form
        const form = document.getElementById(formId);
        form.insertBefore(errorElement, form.firstChild);
    }

    clearFormErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.remove();
        });
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Password strength checker
    checkPasswordStrength(password) {
        const strength = {
            score: 0,
            feedback: []
        };

        if (password.length < 6) {
            strength.feedback.push('Password should be at least 6 characters long');
        } else {
            strength.score += 1;
        }

        if (password.match(/[a-z]/)) {
            strength.score += 1;
        } else {
            strength.feedback.push('Add lowercase letters');
        }

        if (password.match(/[A-Z]/)) {
            strength.score += 1;
        } else {
            strength.feedback.push('Add uppercase letters');
        }

        if (password.match(/[0-9]/)) {
            strength.score += 1;
        } else {
            strength.feedback.push('Add numbers');
        }

        if (password.match(/[^a-zA-Z0-9]/)) {
            strength.score += 1;
        } else {
            strength.feedback.push('Add special characters');
        }

        return strength;
    }

    // Auto-login for demo purposes (remove in production)
    async demoLogin() {
        try {
            await this.handleLogin();
        } catch (error) {
            console.error('Demo login failed:', error);
        }
    }
}

// Profile Management
class ProfileManager {
    constructor() {
        this.init();
    }

    init() {
        // Profile management will be added here
    }

    async updateProfile(profileData) {
        try {
            const response = await app.api.put('/auth/profile', profileData);
            
            if (response.success) {
                // Update stored user data
                app.state.setAuth(app.state.token, response.user);
                app.notifications.success('Profile updated successfully');
                return response.user;
            } else {
                throw new Error(response.message || 'Profile update failed');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            app.notifications.error(error.message || 'Failed to update profile');
            throw error;
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            const response = await app.api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            
            if (response.success) {
                app.notifications.success('Password changed successfully');
                return true;
            } else {
                throw new Error(response.message || 'Password change failed');
            }
        } catch (error) {
            console.error('Password change error:', error);
            app.notifications.error(error.message || 'Failed to change password');
            throw error;
        }
    }

    showProfileModal() {
        // Create and show profile modal
        const modal = this.createProfileModal();
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    createProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'profile-modal';
        
        const user = app.state.user;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Profile Settings</h2>
                    <button class="btn-icon modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="profile-form">
                        <div class="form-group">
                            <label for="profile-name">Full Name</label>
                            <input type="text" id="profile-name" value="${user.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="profile-email">Email</label>
                            <input type="email" id="profile-email" value="${user.email}" disabled>
                            <small style="color: var(--text-muted);">Email cannot be changed</small>
                        </div>
                        <div class="form-group">
                            <label for="profile-currency">Currency</label>
                            <select id="profile-currency">
                                <option value="USD" ${user.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                                <option value="EUR" ${user.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                                <option value="GBP" ${user.currency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
                                <option value="JPY" ${user.currency === 'JPY' ? 'selected' : ''}>JPY (¥)</option>
                                <option value="CAD" ${user.currency === 'CAD' ? 'selected' : ''}>CAD (C$)</option>
                                <option value="AUD" ${user.currency === 'AUD' ? 'selected' : ''}>AUD (A$)</option>
                                <option value="CHF" ${user.currency === 'CHF' ? 'selected' : ''}>CHF (CHF)</option>
                                <option value="CNY" ${user.currency === 'CNY' ? 'selected' : ''}>CNY (¥)</option>
                                <option value="INR" ${user.currency === 'INR' ? 'selected' : ''}>INR (₹)</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('#profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('profile-name').value.trim(),
                currency: document.getElementById('profile-currency').value
            };

            try {
                await this.updateProfile(formData);
                modal.remove();
            } catch (error) {
                // Error already handled in updateProfile
            }
        });

        return modal;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth manager...');
    try {
        window.authManager = new AuthManager();
        window.profileManager = new ProfileManager();
        console.log('Auth managers initialized successfully');
    } catch (error) {
        console.error('Failed to initialize auth managers:', error);
    }
});

// Fallback initialization for auth switching if main auth manager fails
window.addEventListener('load', () => {
    const authSwitchLink = document.getElementById('auth-switch-link');
    if (authSwitchLink && !window.authManager) {
        console.log('Setting up fallback auth switch handler...');
        let isLoginMode = true;
        
        authSwitchLink.addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            const authTitle = document.getElementById('auth-title');
            const authSubtitle = document.getElementById('auth-subtitle');
            const authSwitchText = document.getElementById('auth-switch-text');
            
            if (isLoginMode) {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
                authTitle.textContent = 'Sign In';
                authSubtitle.textContent = 'Welcome back to your finance dashboard';
                authSwitchText.innerHTML = "Don't have an account? ";
                authSwitchLink.textContent = 'Sign up';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
                authTitle.textContent = 'Create Account';
                authSubtitle.textContent = 'Start managing your finances today';
                authSwitchText.innerHTML = 'Already have an account? ';
                authSwitchLink.textContent = 'Sign in';
            }
        });
    }
});