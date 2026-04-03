// Gestion de la page contact - ES6+
class ContactManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAuthSection();
        this.setupFormValidation();
    }

    setupEventListeners() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactSubmit(e);
            });
        }

        // Gestion de l'urgence
        const urgenceCheckbox = document.getElementById('contact-urgence');
        if (urgenceCheckbox) {
            urgenceCheckbox.addEventListener('change', (e) => {
                this.toggleUrgenceWarning(e.target.checked);
            });
        }
    }

    toggleUrgenceWarning(isUrgent) {
        const formActions = document.querySelector('.form-actions');
        let warningElement = document.getElementById('urgence-warning');

        if (isUrgent && !warningElement) {
            warningElement = document.createElement('div');
            warningElement.id = 'urgence-warning';
            warningElement.className = 'urgence-warning';
            warningElement.innerHTML = `
                <div class="warning-icon">⚠️</div>
                <div class="warning-content">
                    <strong>Urgence détectée</strong>
                    <p>Pour une assistance immédiate, appelez notre service urgence au <a href="tel:+22870123456">+228 70 12 34 56</a></p>
                </div>
            `;
            formActions.parentNode.insertBefore(warningElement, formActions);
        } else if (!isUrgent && warningElement) {
            warningElement.remove();
        }
    }

    async handleContactSubmit(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        const submitBtn = form.querySelector('.btn-send');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.querySelector('.btn-text').textContent = 'Envoi en cours...';
        submitBtn.disabled = true;

        try {
            const contactData = {
                nom: formData.get('nom'),
                email: formData.get('email'),
                telephone: formData.get('telephone'),
                sujet: formData.get('sujet'),
                reference: formData.get('reference'),
                message: formData.get('message'),
                urgence: formData.get('urgence') === 'on'
            };

            // Validation
            if (!this.validateContactData(contactData)) {
                return;
            }

            // Simulation d'envoi (à remplacer par un appel API réel)
            await this.sendContactMessage(contactData);

            this.showSuccessMessage('Votre message a été envoyé avec succès! Nous vous répondrons dans les plus brefs délais.');
            form.reset();

        } catch (error) {
            console.error('Erreur envoi message:', error);
            this.showError('Erreur lors de l\'envoi du message. Veuillez réessayer.');
        } finally {
            submitBtn.querySelector('.btn-text').textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateContactData(data) {
        this.clearErrors();

        let isValid = true;

        // Validation nom
        if (!data.nom || data.nom.trim().length < 2) {
            this.showFieldError('contact-nom', 'Le nom doit contenir au moins 2 caractères');
            isValid = false;
        }

        // Validation email
        if (!data.email || !this.isValidEmail(data.email)) {
            this.showFieldError('contact-email', 'Format email invalide');
            isValid = false;
        }

        // Validation téléphone (optionnel mais doit être valide si fourni)
        if (data.telephone && !this.isValidPhone(data.telephone)) {
            this.showFieldError('contact-telephone', 'Numéro de téléphone invalide');
            isValid = false;
        }

        // Validation sujet
        if (!data.sujet) {
            this.showFieldError('contact-sujet', 'Veuillez sélectionner un sujet');
            isValid = false;
        }

        // Validation message
        if (!data.message || data.message.trim().length < 20) {
            this.showFieldError('contact-message', 'Le message doit contenir au moins 20 caractères');
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

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('invalid');
            
            let errorElement = field.parentNode.querySelector('.error-message');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                field.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = message;
        }
    }

    clearErrors() {
        document.querySelectorAll('.form-input').forEach(field => {
            field.classList.remove('invalid');
        });
        
        document.querySelectorAll('.error-message').forEach(error => {
            error.remove();
        });
    }

    setupFormValidation() {
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
                
            case 'textarea':
                if (value && value.length < 20) {
                    this.showFieldError(field.id, 'Minimum 20 caractères');
                    return false;
                }
                break;
        }
        
        this.clearFieldError(field.id);
        return true;
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('invalid');
            const errorElement = field.parentNode.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        }
    }

    async sendContactMessage(contactData) {
        // Simulation d'envoi - À REMPLACER par un appel API réel
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simuler un envoi réussi 90% du temps
                if (Math.random() > 0.1) {
                    resolve({
                        success: true,
                        message: 'Message envoyé avec succès'
                    });
                } else {
                    reject(new Error('Erreur d\'envoi du message'));
                }
            }, 2000);
        });
    }

    showSuccessMessage(message) {
        const form = document.getElementById('contactForm');
        let successElement = document.getElementById('contact-success');
        
        if (!successElement) {
            successElement = document.createElement('div');
            successElement.id = 'contact-success';
            successElement.className = 'success-message';
            form.parentNode.insertBefore(successElement, form);
        }
        
        successElement.innerHTML = `
            <div class="success-icon">✅</div>
            <div><strong>Succès!</strong> ${message}</div>
        `;
        
        // Masquer après 5 secondes
        setTimeout(() => {
            successElement.remove();
        }, 5000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Fermer la notification">×</button>
        `;

        document.body.appendChild(notification);

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

    setupAuthSection() {
        const authSection = document.getElementById('authSection');
        if (!authSection) return;

        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (isLoggedIn && user.nom) {
            authSection.innerHTML = `
                <div class="user-menu">
                    <button class="user-btn" id="userMenuButton">
                        <span class="user-name">${user.prenom}</span>
                        <span class="user-arrow">▼</span>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <a href="../Utilisateurs/profil.html" class="dropdown-item">Mon profil</a>
                        <a href="../Reservations/historique.html" class="dropdown-item">Mes réservations</a>
                        <div class="dropdown-divider"></div>
                        <button onclick="authManager.logout()" class="dropdown-item logout-btn">
                            Déconnexion
                        </button>
                    </div>
                </div>
            `;

            const userMenuButton = document.getElementById('userMenuButton');
            const userDropdown = document.getElementById('userDropdown');

            if (userMenuButton && userDropdown) {
                userMenuButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('show');
                });

                document.addEventListener('click', () => {
                    userDropdown.classList.remove('show');
                });
            }

        } else {
            authSection.innerHTML = `
                <a href="../Utilisateurs/connexion.html" class="nav-link btn-login">
                    Connexion
                </a>
            `;
        }
    }
}

// Initialisation
const contactManager = new ContactManager();