// Gestion de l'authentification - ES6+
class AuthManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.init();
    }

    init() {
        this.setupLoginForm();
        this.checkExistingSession();
        this.setupFormValidation();
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e);
            });
        }
    }

    async handleLogin(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        // Afficher l'état de chargement
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.querySelector('.btn-text').textContent = 'Connexion...';
        submitBtn.disabled = true;

        try {
            const loginData = {
                action: 'login',
                email: formData.get('email'),
                mot_de_passe: formData.get('password')
            };

            // Validation côté client
            if (!this.validateLoginData(loginData)) {
                return;
            }

            const response = await this.api.login(loginData);
            
            if (response.success) {
                this.showNotification('Connexion réussie!', 'success');
                
                // Stocker les informations utilisateur
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('isLoggedIn', 'true');
                
                // Redirection basée sur le rôle
                setTimeout(() => {
                    this.redirectAfterLogin(response.data.user.role);
                }, 1000);
                
            } else {
                this.showNotification(response.message || 'Erreur de connexion', 'error');
            }

        } catch (error) {
            console.error('Erreur connexion:', error);
            this.showNotification('Erreur de connexion. Veuillez réessayer.', 'error');
        } finally {
            submitBtn.querySelector('.btn-text').textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateLoginData(data) {
        this.clearErrors();

        let isValid = true;

        // Validation email
        if (!data.email || !this.isValidEmail(data.email)) {
            this.showFieldError('email', 'Format email invalide');
            isValid = false;
        }

        // Validation mot de passe
        if (!data.mot_de_passe || data.mot_de_passe.length < 6) {
            this.showFieldError('password', 'Le mot de passe doit contenir au moins 6 caractères');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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

    redirectAfterLogin(role) {
        switch(role) {
            case 'admin':
                window.location.href = '../Admin/dashboard.html';
                break;
            case 'chauffeur':
                window.location.href = '../Chauffeurs/dashboard.html';
                break;
            default:
                window.location.href = '../Accueil/index.html';
        }
    }

    checkExistingSession() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (isLoggedIn && user.role) {
            // Rediriger si déjà connecté
            this.redirectAfterLogin(user.role);
        }
    }

    setupFormValidation() {
        // Validation en temps réel
        document.querySelectorAll('.form-input').forEach(input => {
            input.addEventListener('blur', (e) => {
                this.validateField(e.target);
            });
            
            input.addEventListener('input', (e) => {
                if (e.target.classList.contains('invalid')) {
                    this.clearFieldError(e.target);
                }
            });
        });
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
                
            case 'password':
                if (value && value.length < 6) {
                    this.showFieldError(field.id, 'Minimum 6 caractères');
                    return false;
                }
                break;
        }
        
        this.clearFieldError(field);
        return true;
    }

    clearFieldError(field) {
        field.classList.remove('invalid');
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
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

    // Déconnexion
    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        sessionStorage.clear();
        
        // Appeler l'API de déconnexion si nécessaire
        this.api.logout().catch(console.error);
        
        window.location.href = '../Utilisateurs/connexion.html';
    }
}

// API spécifique à l'authentification
class MiabeTransAuthAPI extends MiabeTransAPI {
    async login(loginData) {
        try {
            const response = await fetch(`${this.baseUrl}/auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('API Login Error:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'register',
                    ...userData
                })
            });

            return await response.json();
            
        } catch (error) {
            console.error('API Register Error:', error);
            throw error;
        }
    }

    async logout() {
        // Implémentation de la déconnexion côté serveur si nécessaire
        return Promise.resolve();
    }
}

// Initialisation
const authManager = new AuthManager();

// Rendre disponible globalement pour la déconnexion
window.authManager = authManager;