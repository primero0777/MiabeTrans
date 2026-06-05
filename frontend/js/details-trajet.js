// Gestion de la page détails du trajet - ES6+
class DetailsTrajetManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.trajet = null;
        this.selectedPassagers = 1;
        this.init();
    }

    init() {
        this.loadTrajetDetails();
        this.setupEventListeners();
        this.setupAuthSection();
    }

    async loadTrajetDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const trajetId = urlParams.get('id');

        if (!trajetId) {
            this.showError('Aucun trajet sélectionné');
            return;
        }

        try {
            const response = await this.api.getTrajet(trajetId);
            
            if (response.success) {
                this.trajet = response.data;
                this.displayTrajetDetails();
                this.updateBookingSummary();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erreur chargement trajet:', error);
            this.showError('Erreur lors du chargement du trajet');
        }
    }

    displayTrajetDetails() {
        if (!this.trajet) return;

        // En-tête
        document.getElementById('trajetRoute').textContent = 
            `${this.trajet.ville_depart} → ${this.trajet.ville_arrivee}`;
        
        document.getElementById('trajetDate').textContent = 
            this.formatDate(this.trajet.date_depart);
        
        document.getElementById('trajetDuree').textContent = 
            this.trajet.duree_estimee || 'Durée non spécifiée';
        
        document.getElementById('trajetPlaces').textContent = 
            `${this.trajet.places_disponibles} places disponibles`;
        
        document.getElementById('trajetPrix').textContent = 
            `${this.formatPrice(this.trajet.prix)} FCFA`;

        // Informations détaillées
        document.getElementById('heureDepart').textContent = this.trajet.heure_depart;
        document.getElementById('dureeEstimee').textContent = this.trajet.duree_estimee || 'Non spécifiée';
        
        // Itinéraire
        document.getElementById('villeDepart').textContent = this.trajet.ville_depart;
        document.getElementById('villeArrivee').textContent = this.trajet.ville_arrivee;
        document.getElementById('heureDepartDetail').textContent = this.trajet.heure_depart;
        
        // Calcul de l'heure d'arrivée estimée
        const heureArrivee = this.calculateArrivalTime(
            this.trajet.heure_depart, 
            this.trajet.duree_estimee
        );
        document.getElementById('heureArrivee').textContent = heureArrivee;

        // Mettre à jour la disponibilité
        this.updateAvailabilityDisplay();
    }

    calculateArrivalTime(departTime, duration) {
        if (!departTime || !duration) return '--:--';
        
        try {
            const [hours, minutes] = departTime.split(':').map(Number);
            const durationMatch = duration.match(/(\d+)h/);
            
            if (!durationMatch) return '--:--';
            
            const durationHours = parseInt(durationMatch[1]);
            let arrivalHours = hours + durationHours;
            let arrivalMinutes = minutes;
            
            // Gestion du dépassement de 24h
            if (arrivalHours >= 24) {
                arrivalHours -= 24;
            }
            
            return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
        } catch (error) {
            console.error('Erreur calcul heure arrivée:', error);
            return '--:--';
        }
    }

    updateAvailabilityDisplay() {
        const placesElement = document.getElementById('trajetPlaces');
        const reserverBtn = document.getElementById('reserverBtn');
        
        if (!this.trajet || !placesElement || !reserverBtn) return;

        const placesDisponibles = this.trajet.places_disponibles;
        
        // Mettre à jour l'affichage de disponibilité
        if (placesDisponibles === 0) {
            placesElement.innerHTML = '<span class="availability-badge availability-low">Complet</span>';
            reserverBtn.disabled = true;
            reserverBtn.textContent = '🚫 Complet';
        } else if (placesDisponibles < 5) {
            placesElement.innerHTML = `<span class="availability-badge availability-medium">${placesDisponibles} places restantes</span>`;
        } else {
            placesElement.innerHTML = `<span class="availability-badge availability-high">${placesDisponibles} places disponibles</span>`;
        }
    }

    setupEventListeners() {
        // Sélecteur de passagers
        const passagersSelect = document.getElementById('passagers');
        if (passagersSelect) {
            passagersSelect.addEventListener('change', (e) => {
                this.selectedPassagers = parseInt(e.target.value);
                this.updateBookingSummary();
            });
        }

        // Formulaire de réservation rapide
        const bookingForm = document.getElementById('quickBookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleQuickBooking();
            });
        }

        // Bouton de réservation principal
        const reserverBtn = document.getElementById('reserverBtn');
        if (reserverBtn) {
            reserverBtn.addEventListener('click', () => {
                this.handleReservation();
            });
        }
    }

    updateBookingSummary() {
        if (!this.trajet) return;

        const prixUnitaire = this.trajet.prix;
        const total = prixUnitaire * this.selectedPassagers;

        document.getElementById('summaryPrixUnitaire').textContent = 
            `${this.formatPrice(prixUnitaire)} FCFA`;
        
        document.getElementById('summaryPassagers').textContent = 
            this.selectedPassagers;
        
        document.getElementById('summaryTotal').textContent = 
            `${this.formatPrice(total)} FCFA`;
    }

    handleQuickBooking() {
        this.handleReservation();
    }

    handleReservation() {
        if (!this.trajet) {
            this.showError('Aucun trajet sélectionné');
            return;
        }

        // Vérifier la disponibilité
        if (this.trajet.places_disponibles === 0) {
            this.showError('Ce trajet est complet');
            return;
        }

        if (this.selectedPassagers > this.trajet.places_disponibles) {
            this.showError(`Seulement ${this.trajet.places_disponibles} place(s) disponible(s)`);
            return;
        }

        // Rediriger vers la page de réservation
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (isLoggedIn) {
            window.location.href = `../Reservations/reserver.html?trajet=${this.trajet.id}&passagers=${this.selectedPassagers}`;
        } else {
            // Sauvegarder les infos pour après la connexion
            sessionStorage.setItem('redirectAfterLogin', 
                `../Reservations/reserver.html?trajet=${this.trajet.id}&passagers=${this.selectedPassagers}`);
            window.location.href = '../Utilisateurs/connexion.html';
        }
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

    // Utilitaires
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

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
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
}

// Initialisation
const detailsTrajetManager = new DetailsTrajetManager();