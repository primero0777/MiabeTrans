// Gestion de l'inscription - ES6+
class InscriptionManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.init();
    }

    init() {
        this.setupRegistrationForm();
        this.setupFormValidation();
    }

    setupRegistrationForm() {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegistration(e);
            });
        }
    }

    async handleRegistration(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        // Afficher l'état de chargement
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.querySelector('.btn-text').textContent = 'Création du compte...';
        submitBtn.disabled = true;

        try {
            const userData = {
                nom: formData.get('nom'),
                prenom: formData.get('prenom'),
                email: formData.get('email'),
                telephone: formData.get('telephone'),
                mot_de_passe: formData.get('password'),
                newsletter: formData.get('newsletter') === 'on'
            };

            // Validation côté client
            if (!this.validateRegistrationData(userData)) {
                return;
            }

            const response = await this.api.register(userData);
            
            if (response.success) {
                this.showSuccess('Compte créé avec succès! Redirection...');
                
                // Sauvegarder les préférences
                if (userData.newsletter) {
                    localStorage.setItem('user_preferences', JSON.stringify({
                        newsletter: true,
                        promotions: true
                    }));
                }
                
                // Redirection vers la connexion après 2 secondes
                setTimeout(() => {
                    window.location.href = 'connexion.html?message=account_created';
                }, 2000);
                
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            console.error('Erreur inscription:', error);
            this.showError('Erreur lors de la création du compte: ' + error.message);
        } finally {
            submitBtn.querySelector('.btn-text').textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateRegistrationData(data) {
        this.clearErrors();

        let isValid = true;

        // Validation prénom
        if (!data.prenom || data.prenom.trim().length < 2) {
            this.showFieldError('prenom', 'Le prénom doit contenir au moins 2 caractères');
            isValid = false;
        }

        // Validation nom
        if (!data.nom || data.nom.trim().length < 2) {
            this.showFieldError('nom', 'Le nom doit contenir au moins 2 caractères');
            isValid = false;
        }

        // Validation email
        if (!data.email || !this.isValidEmail(data.email)) {
            this.showFieldError('email', 'Format email invalide');
            isValid = false;
        }

        // Validation téléphone
        if (!data.telephone || !this.isValidPhone(data.telephone)) {
            this.showFieldError('telephone', 'Numéro de téléphone togolais invalide');
            isValid = false;
        }

        // Validation mot de passe
        if (!data.mot_de_passe || data.mot_de_passe.length < 6) {
            this.showFieldError('password', 'Le mot de passe doit contenir au moins 6 caractères');
            isValid = false;
        }

        // Validation confirmation mot de passe
        const confirmPassword = document.getElementById('confirm_password').value;
        if (data.mot_de_passe !== confirmPassword) {
            this.showFieldError('confirm_password', 'Les mots de passe ne correspondent pas');
            isValid = false;
        }

        // Validation conditions d'utilisation
        const termsCheckbox = document.getElementById('terms');
        if (!termsCheckbox.checked) {
            this.showFieldError('terms', 'Vous devez accepter les conditions d\'utilisation');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^(\+228|00228)?[0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        if (field && errorElement) {
            field.classList.add('invalid');
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Focus sur le premier champ en erreur
            if (!document.querySelector('.form-input.invalid:focus')) {
                field.focus();
            }
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
        // Validation en temps réel
        document.querySelectorAll('.form-input').forEach(input => {
            input.addEventListener('blur', (e) => {
                this.validateField(e.target);
            });
            
            input.addEventListener('input', (e) => {
                if (e.target.classList.contains('invalid')) {
                    this.clearFieldError(e.target.id);
                }
            });
        });

        // Validation spécifique pour la confirmation de mot de passe
        const passwordField = document.getElementById('password');
        const confirmPasswordField = document.getElementById('confirm_password');

        if (passwordField && confirmPasswordField) {
            passwordField.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
            
            confirmPasswordField.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }

        // Validation des conditions en temps réel
        const termsCheckbox = document.getElementById('terms');
        if (termsCheckbox) {
            termsCheckbox.addEventListener('change', () => {
                this.clearFieldError('terms');
            });
        }
    }

    validateField(field) {
        const value = field.value.trim();
        
        switch(field.type) {
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    this.showFieldError(field.id, 'Format email invalide');
                    return false;
                }
                break;
                
            case 'tel':
                if (value && !this.isValidPhone(value)) {
                    this.showFieldError(field.id, 'Numéro de téléphone invalide');
                    return false;
                }
                break;
                
            case 'password':
                if (value && value.length < 6) {
                    this.showFieldError(field.id, 'Minimum 6 caractères');
                    return false;
                }
                break;
        }
        
        this.clearFieldError(field.id);
        return true;
    }

    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        if (password && confirmPassword && password !== confirmPassword) {
            this.showFieldError('confirm_password', 'Les mots de passe ne correspondent pas');
            return false;
        } else {
            this.clearFieldError('confirm_password');
            return true;
        }
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

    showSuccess(message) {
        this.showNotification(message, 'success');
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

        // Animation
        setTimeout(() => notification.classList.add('show'), 100);

        // Fermeture automatique
        setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);

        // Fermeture manuelle
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
const inscriptionManager = new InscriptionManager();