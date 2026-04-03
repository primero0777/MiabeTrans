// Gestion du profil utilisateur - ES6+
class ProfilManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.setupAuthSection();
        this.setupTabNavigation();
    }

    async loadUserData() {
        try {
            const response = await this.api.getUserProfile();
            
            if (response.success) {
                this.currentUser = response.data;
                this.displayUserData();
                this.loadUserReservations();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erreur chargement profil:', error);
            this.showError('Erreur lors du chargement du profil');
        }
    }

    displayUserData() {
        if (!this.currentUser) return;

        // Remplir le formulaire de profil
        document.getElementById('profil-nom').value = this.currentUser.nom || '';
        document.getElementById('profil-prenom').value = this.currentUser.prenom || '';
        document.getElementById('profil-email').value = this.currentUser.email || '';
        document.getElementById('profil-telephone').value = this.currentUser.telephone || '';

        // Charger les préférences sauvegardées
        this.loadUserPreferences();
    }

    async loadUserReservations() {
        try {
            const response = await this.api.getUserReservations();
            
            if (response.success) {
                this.displayReservations(response.data.reservations);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erreur chargement réservations:', error);
            this.displayEmptyReservations('Erreur lors du chargement des réservations');
        }
    }

    displayReservations(reservations) {
        const container = document.getElementById('reservationsList');
        if (!container) return;

        if (reservations.length === 0) {
            this.displayEmptyReservations('Aucune réservation trouvée');
            return;
        }

        container.innerHTML = reservations.map(reservation => `
            <div class="reservation-card">
                <div class="reservation-header">
                    <div class="reservation-reference">
                        ${reservation.reference}
                    </div>
                    <div class="reservation-status status-${reservation.statut}">
                        ${this.getStatusLabel(reservation.statut)}
                    </div>
                </div>
                
                <div class="reservation-route">
                    ${reservation.ville_depart} → ${reservation.ville_arrivee}
                </div>
                
                <div class="reservation-details">
                    <div class="reservation-detail">
                        <span class="detail-label">📅 Date:</span>
                        <span class="detail-value">${this.formatDate(reservation.date_depart)}</span>
                    </div>
                    <div class="reservation-detail">
                        <span class="detail-label">⏰ Heure:</span>
                        <span class="detail-value">${reservation.heure_depart}</span>
                    </div>
                    <div class="reservation-detail">
                        <span class="detail-label">👥 Places:</span>
                        <span class="detail-value">${reservation.nombre_places}</span>
                    </div>
                    <div class="reservation-detail">
                        <span class="detail-label">💰 Total:</span>
                        <span class="detail-value">${this.formatPrice(reservation.prix_total)} FCFA</span>
                    </div>
                </div>
                
                <div class="reservation-actions">
                    <button class="btn btn-outline btn-sm" 
                            onclick="profilManager.viewReservationDetails('${reservation.reference}')">
                        📋 Détails
                    </button>
                    
                    ${reservation.statut === 'confirme' ? `
                        <button class="btn btn-outline btn-sm" 
                                onclick="profilManager.downloadTicket('${reservation.reference}')">
                            🎫 Télécharger
                        </button>
                    ` : ''}
                    
                    ${reservation.statut === 'confirme' ? `
                        <button class="btn btn-danger btn-sm" 
                                onclick="profilManager.cancelReservation(${reservation.id})"
                                data-reservation-id="${reservation.id}">
                            ❌ Annuler
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    displayEmptyReservations(message) {
        const container = document.getElementById('reservationsList');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎫</div>
                    <h3>${message}</h3>
                    <p>Vous n'avez aucune réservation pour le moment.</p>
                    <a href="../Trajets/liste-trajets.html" class="btn btn-primary">
                        🔍 Chercher un trajet
                    </a>
                </div>
            `;
        }
    }

    setupEventListeners() {
        // Formulaire de profil
        const profilForm = document.getElementById('profilForm');
        if (profilForm) {
            profilForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfil(e);
            });
        }

        // Formulaire de mot de passe
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword(e);
            });
        }

        // Formulaire de préférences
        const preferencesForm = document.getElementById('preferencesForm');
        if (preferencesForm) {
            preferencesForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePreferences(e);
            });
        }

        // Validation en temps réel
        this.setupFormValidation();
    }

    setupTabNavigation() {
        const navLinks = document.querySelectorAll('.profil-nav .nav-link');
        const tabContents = document.querySelectorAll('.tab-content');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Retirer la classe active de tous les liens et contenus
                navLinks.forEach(l => l.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Activer le lien cliqué
                link.classList.add('active');
                
                // Afficher le contenu correspondant
                const tabId = link.getAttribute('data-tab');
                const tabContent = document.getElementById(`${tabId}-tab`);
                if (tabContent) {
                    tabContent.classList.add('active');
                }

                // Charger les données si nécessaire
                if (tabId === 'reservations') {
                    this.loadUserReservations();
                }
            });
        });
    }

    async updateProfil(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Enregistrement...';
        submitBtn.disabled = true;

        try {
            const updateData = {
                nom: formData.get('nom'),
                prenom: formData.get('prenom'),
                telephone: formData.get('telephone')
            };

            // Validation
            if (!this.validateProfilData(updateData)) {
                return;
            }

            const response = await this.api.updateUserProfile(updateData);

            if (response.success) {
                this.showSuccess('Profil mis à jour avec succès');
                
                // Mettre à jour les données locales
                if (this.currentUser) {
                    this.currentUser = { ...this.currentUser, ...updateData };
                }
                
                // Mettre à jour la section auth
                this.setupAuthSection();
                
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
            this.showError('Erreur lors de la mise à jour du profil');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async changePassword(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Changement...';
        submitBtn.disabled = true;

        try {
            const passwordData = {
                current_password: formData.get('current_password'),
                new_password: formData.get('new_password'),
                confirm_password: formData.get('confirm_password')
            };

            // Validation
            if (!this.validatePasswordData(passwordData)) {
                return;
            }

            const response = await this.api.changePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });

            if (response.success) {
                this.showSuccess('Mot de passe changé avec succès');
                form.reset();
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            console.error('Erreur changement mot de passe:', error);
            this.showError('Erreur lors du changement de mot de passe');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async savePreferences(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Enregistrement...';
        submitBtn.disabled = true;

        try {
            const preferences = {
                notifications_email: formData.get('notifications_email') === 'on',
                notifications_sms: formData.get('notifications_sms') === 'on',
                promotions: formData.get('promotions') === 'on',
                preferred_payment: formData.get('preferred_payment')
            };

            // Sauvegarder dans le localStorage
            localStorage.setItem('user_preferences', JSON.stringify(preferences));
            
            this.showSuccess('Préférences enregistrées avec succès');

        } catch (error) {
            console.error('Erreur sauvegarde préférences:', error);
            this.showError('Erreur lors de la sauvegarde des préférences');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    loadUserPreferences() {
        const preferences = JSON.parse(localStorage.getItem('user_preferences') || '{}');
        
        // Remplir le formulaire de préférences
        if (preferences.notifications_email !== undefined) {
            document.querySelector('input[name="notifications_email"]').checked = preferences.notifications_email;
        }
        
        if (preferences.notifications_sms !== undefined) {
            document.querySelector('input[name="notifications_sms"]').checked = preferences.notifications_sms;
        }
        
        if (preferences.promotions !== undefined) {
            document.querySelector('input[name="promotions"]').checked = preferences.promotions;
        }
        
        if (preferences.preferred_payment) {
            document.getElementById('preferred_payment').value = preferences.preferred_payment;
        }
    }

    validateProfilData(data) {
        this.clearErrors();

        let isValid = true;

        if (!data.nom || data.nom.trim().length < 2) {
            this.showFieldError('profil-nom', 'Le nom doit contenir au moins 2 caractères');
            isValid = false;
        }

        if (!data.prenom || data.prenom.trim().length < 2) {
            this.showFieldError('profil-prenom', 'Le prénom doit contenir au moins 2 caractères');
            isValid = false;
        }

        if (!data.telephone || !this.isValidPhone(data.telephone)) {
            this.showFieldError('profil-telephone', 'Numéro de téléphone invalide');
            isValid = false;
        }

        return isValid;
    }

    validatePasswordData(data) {
        this.clearErrors();

        let isValid = true;

        if (!data.current_password) {
            this.showFieldError('current-password', 'Le mot de passe actuel est requis');
            isValid = false;
        }

        if (!data.new_password || data.new_password.length < 6) {
            this.showFieldError('new-password', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
            isValid = false;
        }

        if (data.new_password !== data.confirm_password) {
            this.showFieldError('confirm-password', 'Les mots de passe ne correspondent pas');
            isValid = false;
        }

        return isValid;
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
            case 'tel':
                if (value && !this.isValidPhone(value)) {
                    this.showFieldError(field.id, 'Numéro de téléphone invalide');
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

    async cancelReservation(reservationId) {
        if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation?')) {
            return;
        }

        try {
            const response = await this.api.cancelReservation(reservationId);

            if (response.success) {
                this.showSuccess('Réservation annulée avec succès');
                this.loadUserReservations(); // Recharger la liste
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            console.error('Erreur annulation réservation:', error);
            this.showError('Erreur lors de l\'annulation de la réservation');
        }
    }

    viewReservationDetails(reference) {
        alert(`Détails de la réservation: ${reference}\n\nCette fonctionnalité sera implémentée dans une version future.`);
    }

    downloadTicket(reference) {
        alert(`Téléchargement du ticket: ${reference}\n\nCette fonctionnalité sera implémentée dans une version future.`);
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
                        <a href="profil.html" class="dropdown-item">Mon profil</a>
                        <a href="../Reservations/historique.html" class="dropdown-item">Mes réservations</a>
                        <div class="dropdown-divider"></div>
                        <button onclick="authManager.logout()" class="dropdown-item logout-btn">
                            Déconnexion
                        </button>
                    </div>
                </div>
            `;

            // Gestion du menu dropdown
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
            window.location.href = '../Utilisateurs/connexion.html';
        }
    }

    getStatusLabel(status) {
        const labels = {
            'confirme': 'Confirmée',
            'en_attente': 'En attente',
            'annule': 'Annulée'
        };
        return labels[status] || status;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR').format(price);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Créer une notification toast
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Fermer la notification">×</button>
        `;

        document.body.appendChild(notification);

        // Animation d'entrée
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
const profilManager = new ProfilManager();