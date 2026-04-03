// Gestion du dashboard chauffeur - ES6+
class ChauffeurDashboardManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.currentTrips = [];
        this.nextTrip = null;
        this.init();
    }

    init() {
        this.loadDashboardData();
        this.setupCurrentDate();
        this.loadUserInfo();
        this.setupEventListeners();
        this.checkChauffeurPermissions();
    }

    checkChauffeurPermissions() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (user.role !== 'chauffeur') {
            window.location.href = '../../pages/Accueil/index.html';
            return false;
        }
        
        return true;
    }

    setupCurrentDate() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateElement.textContent = now.toLocaleDateString('fr-FR', options);
        }
    }

    loadUserInfo() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        document.getElementById('chauffeurName').textContent = `${user.prenom} ${user.nom}`;
        document.getElementById('chauffeurEmail').textContent = user.email;
        
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            const hour = new Date().getHours();
            let greeting = 'Bonne journée';
            
            if (hour < 12) greeting = 'Bonjour';
            else if (hour < 18) greeting = 'Bon après-midi';
            else greeting = 'Bonsoir';
            
            welcomeMessage.textContent = `${greeting}, ${user.prenom}! Prêt pour la route?`;
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadStats(),
                this.loadNextTrip(),
                this.loadTodayTrips()
            ]);
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
            this.showError('Erreur lors du chargement des données');
        }
    }

    async loadStats() {
        try {
            // Simulation des données statistiques
            const stats = {
                trajetsAujourdhui: 3,
                passagersTotal: 24,
                revenuEstime: 45000,
                noteMoyenne: 4.8
            };

            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        }
    }

    updateStatsDisplay(stats) {
        document.getElementById('trajetsAujourdhui').textContent = stats.trajetsAujourdhui;
        document.getElementById('passagersTotal').textContent = stats.passagersTotal;
        document.getElementById('revenuEstime').textContent = this.formatPrice(stats.revenuEstime) + ' FCFA';
        document.getElementById('noteMoyenne').textContent = stats.noteMoyenne;
    }

    async loadNextTrip() {
        try {
            // Simulation du prochain trajet
            const nextTrip = {
                id: 1,
                ville_depart: 'Lomé',
                ville_arrivee: 'Kpalimé',
                date_depart: new Date().toISOString().split('T')[0],
                heure_depart: '14:30',
                prix: 2500,
                places_disponibles: 5,
                places_total: 30,
                duree_estimee: '2h30',
                passagers: [
                    { nom: 'Jean Dupont', places: 2 },
                    { nom: 'Marie Koné', places: 1 },
                    { nom: 'Paul Agbo', places: 3 }
                ]
            };

            this.nextTrip = nextTrip;
            this.displayNextTrip(nextTrip);
        } catch (error) {
            console.error('Erreur chargement prochain trajet:', error);
            this.displayNoNextTrip();
        }
    }

    displayNextTrip(trip) {
        const container = document.getElementById('nextTripCard');
        if (!container) return;

        const totalPassagers = trip.passagers.reduce((sum, p) => sum + p.places, 0);

        container.innerHTML = `
            <div class="trip-route">
                ${trip.ville_depart} → ${trip.ville_arrivee}
            </div>
            
            <div class="trip-details">
                <div class="trip-detail">
                    <span class="detail-label">⏰ Heure de départ</span>
                    <span class="detail-value">${trip.heure_depart}</span>
                </div>
                <div class="trip-detail">
                    <span class="detail-label">⏱️ Durée estimée</span>
                    <span class="detail-value">${trip.duree_estimee}</span>
                </div>
                <div class="trip-detail">
                    <span class="detail-label">💰 Prix par place</span>
                    <span class="detail-value">${this.formatPrice(trip.prix)} FCFA</span>
                </div>
                <div class="trip-detail">
                    <span class="detail-label">🚌 Véhicule</span>
                    <span class="detail-value">Bus 30 places</span>
                </div>
            </div>

            <div class="trip-passengers">
                <div class="passengers-header">
                    <span class="detail-label">👥 Passagers</span>
                    <span class="passengers-count">${totalPassagers} / ${trip.places_total} places</span>
                </div>
                <div class="passengers-list">
                    ${trip.passagers.map(passager => `
                        <div class="passenger-item">
                            <div class="passenger-info">
                                <div class="passenger-avatar">${passager.nom.charAt(0)}</div>
                                <span class="passenger-name">${passager.nom}</span>
                            </div>
                            <span class="passenger-seats">${passager.places} place(s)</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="trip-actions">
                <button class="btn btn-primary" onclick="chauffeurManager.startTrip()">
                    🚀 Démarrer le trajet
                </button>
                <button class="btn btn-outline" onclick="chauffeurManager.viewTripDetails(${trip.id})">
                    📋 Détails complets
                </button>
            </div>
        `;
    }

    displayNoNextTrip() {
        const container = document.getElementById('nextTripCard');
        if (!container) return;

        container.innerHTML = `
            <div class="no-trips">
                <div class="no-trips-icon">🚗</div>
                <h3>Aucun trajet programmé</h3>
                <p>Vous n'avez pas de trajet prévu pour le moment.</p>
                <p class="text-muted">Veuillez contacter l'administration pour de nouvelles affectations.</p>
            </div>
        `;
    }

    async loadTodayTrips() {
        try {
            // Simulation des trajets du jour
            const todayTrips = [
                {
                    id: 1,
                    ville_depart: 'Lomé',
                    ville_arrivee: 'Kpalimé',
                    heure_depart: '08:00',
                    statut: 'completed',
                    passagers: 28
                },
                {
                    id: 2,
                    ville_depart: 'Lomé',
                    ville_arrivee: 'Sokodé',
                    heure_depart: '14:30',
                    statut: 'upcoming',
                    passagers: 24
                },
                {
                    id: 3,
                    ville_depart: 'Kpalimé',
                    ville_arrivee: 'Lomé',
                    heure_depart: '18:00',
                    statut: 'upcoming',
                    passagers: 15
                }
            ];

            this.currentTrips = todayTrips;
            this.displayTodayTrips(todayTrips);
        } catch (error) {
            console.error('Erreur chargement trajets du jour:', error);
            this.displayEmptyTodayTrips();
        }
    }

    displayTodayTrips(trips) {
        const container = document.getElementById('todayTripsTimeline');
        const countElement = document.getElementById('todayTripsCount');

        if (!container) return;

        if (trips.length === 0) {
            this.displayEmptyTodayTrips();
            return;
        }

        if (countElement) {
            countElement.textContent = `${trips.length} trajet(s)`;
        }

        container.innerHTML = trips.map(trip => {
            const [heures, minutes] = trip.heure_depart.split(':');
            const statutClass = `status-${trip.statut}`;
            const statutText = this.getStatusText(trip.statut);

            return `
                <div class="timeline-item">
                    <div class="timeline-time">
                        <span class="time-hour">${heures}h${minutes}</span>
                        <span class="time-period">${parseInt(heures) < 12 ? 'AM' : 'PM'}</span>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-route">
                            ${trip.ville_depart} → ${trip.ville_arrivee}
                        </div>
                        <div class="timeline-details">
                            <span>${trip.passagers} passagers</span>
                            <span>•</span>
                            <span>Bus 30 places</span>
                        </div>
                    </div>
                    <div class="timeline-status ${statutClass}">
                        ${statutText}
                    </div>
                </div>
            `;
        }).join('');
    }

    displayEmptyTodayTrips() {
        const container = document.getElementById('todayTripsTimeline');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3>Aucun trajet aujourd'hui</h3>
                <p>Vous n'avez pas de trajet programmé pour aujourd'hui.</p>
            </div>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            'completed': 'Terminé',
            'in-progress': 'En cours',
            'upcoming': 'À venir',
            'cancelled': 'Annulé'
        };
        return statusMap[status] || status;
    }

    setupEventListeners() {
        // Bouton d'actualisation
        const refreshBtn = document.getElementById('refreshTrips');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }

        // Gestion des modals
        this.setupModals();
    }

    setupModals() {
        // Fermer les modals en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });

        // Fermer avec la touche Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    // Actions du chauffeur
    startTrip() {
        if (!this.nextTrip) {
            this.showError('Aucun trajet à démarrer');
            return;
        }

        this.openModal('startTripModal');
        this.populateTripSelect();
    }

    populateTripSelect() {
        const select = document.getElementById('tripSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Choisir un trajet...</option>';

        if (this.nextTrip) {
            const option = document.createElement('option');
            option.value = this.nextTrip.id;
            option.textContent = `${this.nextTrip.ville_depart} → ${this.nextTrip.ville_arrivee} (${this.nextTrip.heure_depart})`;
            select.appendChild(option);
        }

        // Ajouter les trajets à venir
        this.currentTrips
            .filter(trip => trip.statut === 'upcoming')
            .forEach(trip => {
                const option = document.createElement('option');
                option.value = trip.id;
                option.textContent = `${trip.ville_depart} → ${trip.ville_arrivee} (${trip.heure_depart})`;
                select.appendChild(option);
            });
    }

    confirmStartTrip() {
        const tripSelect = document.getElementById('tripSelect');
        const vehicleStatus = document.getElementById('vehicleStatus');
        const tripNotes = document.getElementById('tripNotes');

        if (!tripSelect.value) {
            this.showError('Veuillez sélectionner un trajet');
            return;
        }

        const tripData = {
            tripId: tripSelect.value,
            vehicleStatus: vehicleStatus.value,
            notes: tripNotes.value
        };

        this.processTripStart(tripData);
    }

    async processTripStart(tripData) {
        try {
            // Simulation du démarrage du trajet
            this.showLoading('Démarrage du trajet...');

            await new Promise(resolve => setTimeout(resolve, 2000));

            this.showSuccess('Trajet démarré avec succès!');
            this.closeModal('startTripModal');
            
            // Mettre à jour l'interface
            this.updateTripStatus(tripData.tripId, 'in-progress');
            
        } catch (error) {
            console.error('Erreur démarrage trajet:', error);
            this.showError('Erreur lors du démarrage du trajet');
        }
    }

    updateTripStatus(tripId, status) {
        // Mettre à jour le statut dans l'interface
        const trip = this.currentTrips.find(t => t.id == tripId);
        if (trip) {
            trip.statut = status;
            this.displayTodayTrips(this.currentTrips);
        }
    }

    reportProblem() {
        this.showNotification('Redirection vers la page de signalement...', 'info');
        setTimeout(() => {
            window.location.href = 'signaler-trajet.html';
        }, 1000);
    }

    viewSchedule() {
        this.showNotification('Ouverture du planning...', 'info');
        setTimeout(() => {
            window.location.href = 'trajets-assignes.html';
        }, 1000);
    }

    contactSupport() {
        window.open('tel:+22870123456', '_self');
    }

    viewTripDetails(tripId) {
        this.showNotification(`Affichage des détails du trajet #${tripId}`, 'info');
        // Implémenter l'affichage des détails complets
    }

    // Gestion des modals
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    // Utilitaires
    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR').format(price);
    }

    showLoading(message) {
        // Implémenter un indicateur de chargement
        console.log('Loading:', message);
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
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
}

// Initialisation
const chauffeurManager = new ChauffeurDashboardManager();