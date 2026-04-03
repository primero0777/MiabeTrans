// Gestion du dashboard admin - ES6+
class DashboardManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.init();
    }

    init() {
        this.loadDashboardData();
        this.setupCurrentDate();
        this.loadUserInfo();
        this.setupEventListeners();
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
        
        document.getElementById('adminName').textContent = `${user.prenom} ${user.nom}`;
        document.getElementById('adminEmail').textContent = user.email;
        
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            const hour = new Date().getHours();
            let greeting = 'Bonne journée';
            
            if (hour < 12) greeting = 'Bonjour';
            else if (hour < 18) greeting = 'Bon après-midi';
            else greeting = 'Bonsoir';
            
            welcomeMessage.textContent = `${greeting}, ${user.prenom}! Bienvenue dans l'administration MiabeTrans.`;
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadStats(),
                this.loadRecentBookings(),
                this.loadPopularRoutes(),
                this.loadRecentActivity()
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
                revenue: 1250000,
                bookings: 342,
                users: 1567,
                routes: 28
            };

            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        }
    }

    updateStatsDisplay(stats) {
        document.getElementById('totalRevenue').textContent = 
            this.formatPrice(stats.revenue) + ' FCFA';
        document.getElementById('totalBookings').textContent = 
            this.formatNumber(stats.bookings);
        document.getElementById('totalUsers').textContent = 
            this.formatNumber(stats.users);
        document.getElementById('activeRoutes').textContent = 
            this.formatNumber(stats.routes);
    }

    async loadRecentBookings() {
        try {
            const response = await this.api.getReservations('?limit=5');
            
            if (response.success) {
                this.displayRecentBookings(response.data.reservations);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erreur chargement réservations:', error);
            this.displayEmptyState('recentBookings', 'Aucune réservation récente');
        }
    }

    displayRecentBookings(bookings) {
        const container = document.getElementById('recentBookings');
        if (!container) return;

        if (bookings.length === 0) {
            this.displayEmptyState('recentBookings', 'Aucune réservation récente');
            return;
        }

        container.innerHTML = bookings.map(booking => `
            <div class="booking-item">
                <div class="booking-info">
                    <div class="booking-route">
                        ${booking.ville_depart} → ${booking.ville_arrivee}
                    </div>
                    <div class="booking-details">
                        ${this.formatDate(booking.date_reservation)} • 
                        ${booking.nombre_places} place(s) • 
                        ${this.formatPrice(booking.prix_total)} FCFA
                    </div>
                </div>
                <div class="booking-status status-${booking.statut}">
                    ${this.getStatusLabel(booking.statut)}
                </div>
            </div>
        `).join('');
    }

    async loadPopularRoutes() {
        try {
            const response = await this.api.getTrajets('?limit=5&sort=popularite');
            
            if (response.success) {
                this.displayPopularRoutes(response.data.trajets);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erreur chargement trajets populaires:', error);
            this.displayEmptyState('popularRoutes', 'Aucun trajet populaire');
        }
    }

    displayPopularRoutes(routes) {
        const container = document.getElementById('popularRoutes');
        if (!container) return;

        if (routes.length === 0) {
            this.displayEmptyState('popularRoutes', 'Aucun trajet populaire');
            return;
        }

        container.innerHTML = routes.map(route => `
            <div class="route-item">
                <div class="route-name">
                    ${route.ville_depart} → ${route.ville_arrivee}
                </div>
                <div class="route-stats">
                    ${route.places_total - route.places_disponibles}/${route.places_total} places
                </div>
            </div>
        `).join('');
    }

    async loadRecentActivity() {
        try {
            // Simulation d'activité récente
            const activities = [
                {
                    icon: '🎫',
                    text: 'Nouvelle réservation #RES001',
                    time: 'Il y a 5 minutes'
                },
                {
                    icon: '👤',
                    text: 'Nouvel utilisateur inscrit',
                    time: 'Il y a 15 minutes'
                },
                {
                    icon: '🚌',
                    text: 'Trajet modifié: Lomé → Kpalimé',
                    time: 'Il y a 1 heure'
                },
                {
                    icon: '💰',
                    text: 'Paiement reçu pour réservation #RES002',
                    time: 'Il y a 2 heures'
                }
            ];

            this.displayRecentActivity(activities);
        } catch (error) {
            console.error('Erreur chargement activité:', error);
            this.displayEmptyState('recentActivity', 'Aucune activité récente');
        }
    }

    displayRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    displayEmptyState(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <div>${message}</div>
                </div>
            `;
        }
    }

    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR').format(price);
    }

    formatNumber(number) {
        return new Intl.NumberFormat('fr-FR').format(number);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusLabel(status) {
        const labels = {
            'confirme': 'Confirmée',
            'en_attente': 'En attente',
            'annule': 'Annulée'
        };
        return labels[status] || status;
    }

    setupEventListeners() {
        // Gestion du menu responsive
        this.setupMobileMenu();
        
        // Actualisation automatique des données
        this.setupAutoRefresh();
    }

    setupMobileMenu() {
        // Implémentation du menu mobile si nécessaire
    }

    setupAutoRefresh() {
        // Actualiser les données toutes les 5 minutes
        setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }

    showError(message) {
        // Implémentation simple d'affichage d'erreur
        console.error('Dashboard Error:', message);
    }
}

// Vérification des permissions admin
function checkAdminPermissions() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role !== 'admin') {
        window.location.href = '../Accueil/index.html';
        return false;
    }
    
    return true;
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (checkAdminPermissions()) {
        const dashboardManager = new DashboardManager();
        window.dashboardManager = dashboardManager;
    }
});