// Gestion de la récupération de mot de passe - ES6+
class PasswordRecoveryManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.currentStep = 1;
        this.recoveryEmail = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkUrlToken();
    }

    setupEventListeners() {
        // Formulaire de demande de réinitialisation
        const recoveryForm = document.getElementById('recoveryForm');
        if (recoveryForm) {
            recoveryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRecoveryRequest(e);
            });
        }

        // Formulaire de réinitialisation
        const resetForm = document.getElementById('resetPasswordForm');
        if (resetForm) {
            resetForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handlePasswordReset(e);
            });
        }

        // Validation en temps réel
        this.setupFormValidation();
    }

    checkUrlToken() {
        // Vérifier si un token de réinitialisation est présent dans l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const email = urlParams.get('email');

        if (token && email) {
            this.recoveryEmail = email;
            this.showStep(3); // Aller directement à l'étape de réinitialisation
        }
    }

    async handleRecoveryRequest(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.querySelector('.btn-text').textContent = 'Envoi en cours...';
        submitBtn.disabled = true;

        try {
            const email = formData.get('email');

            // Validation
            if (!this.validateEmail(email)) {
                this.showFieldError('recovery-email', 'Format email invalide');
                return;
            }

            // Simulation d'envoi d'email (à remplacer par un appel API réel)
            await this.sendRecoveryEmail(email);

            this.recoveryEmail = email;
            this.showStep(2);
            document.getElementById('sent-email').textContent = email;

        } catch (error) {
            console.error('Erreur envoi email:', error);
            this.showError('Erreur lors de l\'envoi de l\'email de réinitialisation');
        } finally {
            submitBtn.querySelector('.btn-text').textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handlePasswordReset(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.querySelector('.btn-text').textContent = 'Réinitialisation...';
        submitBtn.disabled = true;

        try {
            const passwordData = {
                new_password: formData.get('new_password'),
                confirm_new_password: formData.get('confirm_new_password'),
                email: this.recoveryEmail,
                token: new URLSearchParams(window.location.search).get('token') || 'simulated_token'
            };

            // Validation
            if (!this.validatePasswordResetData(passwordData)) {
                return;
            }

            // Simulation de réinitialisation (à remplacer par un appel API réel)
            await this.resetPassword(passwordData);

            this.showStep(4);

        } catch (error) {
            console.error('Erreur réinitialisation:', error);
            this.showError('Erreur lors de la réinitialisation du mot de passe');
        } finally {
            submitBtn.querySelector('.btn-text').textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePasswordResetData(data) {
        this.clearErrors();

        let isValid = true;

        // Validation nouveau mot de passe
        if (!data.new_password || data.new_password.length < 6) {
            this.showFieldError('new-password', 'Le mot de passe doit contenir au moins 6 caractères');
            isValid = false;
        }

        // Validation confirmation
        if (data.new_password !== data.confirm_new_password) {
            this.showFieldError('confirm-new-password', 'Les mots de passe ne correspondent pas');
            isValid = false;
        }

        return isValid;
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (field && errorElement) {
            field.classList.add('invalid');
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearErrors() {
        document.querySelectorAll('.form-input').forEach(field => {
            field.classList.remove('invalid');
        });
        
        document.querySelectorAll('.error-message').forEach(error => {
            error.style.display = 'none';
            error.textContent = '';
        });
    }

    setupFormValidation() {
        // Validation email en temps réel
        const emailField = document.getElementById('recovery-email');
        if (emailField) {
            emailField.addEventListener('blur', () => {
                this.validateEmailField(emailField);
            });
            
            emailField.addEventListener('input', () => {
                if (emailField.classList.contains('invalid')) {
                    this.clearFieldError('recovery-email');
                }
            });
        }

        // Validation des mots de passe en temps réel
        const newPasswordField = document.getElementById('new-password');
        const confirmPasswordField = document.getElementById('confirm-new-password');

        if (newPasswordField && confirmPasswordField) {
            newPasswordField.addEventListener('input', () => {
                this.validatePasswordFields();
            });
            
            confirmPasswordField.addEventListener('input', () => {
                this.validatePasswordFields();
            });
        }
    }

    validateEmailField(field) {
        const value = field.value.trim();
        
        if (value && !this.validateEmail(value)) {
            this.showFieldError(field.id, 'Format email invalide');
            return false;
        }
        
        this.clearFieldError(field.id);
        return true;
    }

    validatePasswordFields() {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;
        
        // Validation longueur
        if (newPassword && newPassword.length < 6) {
            this.showFieldError('new-password', 'Minimum 6 caractères');
            return false;
        } else {
            this.clearFieldError('new-password');
        }

        // Validation correspondance
        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            this.showFieldError('confirm-new-password', 'Les mots de passe ne correspondent pas');
            return false;
        } else {
            this.clearFieldError('confirm-new-password');
        }

        return true;
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('invalid');
            const errorElement = document.getElementById(`${fieldId}-error`);
            if (errorElement) {
                errorElement.style.display = 'none';
                errorElement.textContent = '';
            }
        }
    }

    showStep(step) {
        // Masquer toutes les étapes
        document.querySelectorAll('.recovery-step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });

        // Afficher l'étape demandée
        const stepElement = document.getElementById(`step${step}`);
        if (stepElement) {
            stepElement.classList.add('active');
            this.currentStep = step;
        }
    }

    returnToStep1() {
        this.showStep(1);
    }

    // Simulations (à remplacer par des appels API réels)
    async sendRecoveryEmail(email) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simuler un envoi réussi 90% du temps
                if (Math.random() > 0.1) {
                    resolve({
                        success: true,
                        message: 'Email envoyé avec succès'
                    });
                } else {
                    reject(new Error('Erreur d\'envoi d\'email'));
                }
            }, 2000);
        });
    }

    async resetPassword(passwordData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simuler une réinitialisation réussie 90% du temps
                if (Math.random() > 0.1) {
                    resolve({
                        success: true,
                        message: 'Mot de passe réinitialisé avec succès'
                    });
                } else {
                    reject(new Error('Erreur de réinitialisation'));
                }
            }, 2000);
        });
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const messagesContainer = document.getElementById('authMessages');
        if (!messagesContainer) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Fermer la notification">×</button>
        `;

        messagesContainer.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);

        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.hideNotification(notification);
        });
    }

    hideNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Initialisation
const passwordManager = new PasswordRecoveryManager();