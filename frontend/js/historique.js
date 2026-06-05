// Gestion de l'historique des réservations - ES6+
class HistoriqueManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.currentPage = 1;
        this.filters = {
            period: 'all',
            status: 'all',
            sort: 'date_desc'
        };
        this.reservations = [];
        this.init();
    }

    init() {
        this.loadUserReservations();
        this.setupEventListeners();
        this.setupAuthSection();
    }

    async loadUserReservations() {
        const container = document.getElementById('reservationsContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (container) {
            container.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Chargement de vos réservations...</div>';
        }

        try {
            const response = await this.api.getUserReservations();
            
            if (response.success) {
                this.reservations = response.data.reservations;
                this.applyFilters();
                this.updateStats();
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            console.error('Erreur chargement réservations:', error);
            this.showError('Erreur lors du chargement de vos réservations');
        }
    }

    applyFilters() {
        let filteredReservations = [...this.reservations];

        // Filtre par période
        if (this.filters.period !== 'all') {
            filteredReservations = this.filterByPeriod(filteredReservations, this.filters.period);
        }

        // Filtre par statut
        if (this.filters.status !== 'all') {
            filteredReservations = filteredReservations.filter(reservation => 
                reservation.statut === this.filters.status
            );
        }

        // Tri
        filteredReservations = this.sortReservations(filteredReservations, this.filters.sort);

        this.displayReservations(filteredReservations);
    }

    filterByPeriod(reservations, period) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return reservations.filter(reservation => {
            const reservationDate = new Date(reservation.date_depart);
            
            switch (period) {
                case 'today':
                    return reservationDate.toDateString() === today.toDateString();
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return reservationDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return reservationDate >= monthAgo;
                case '3months':
                    const threeMonthsAgo = new Date(today);
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                    return reservationDate >= threeMonthsAgo;
                case 'year':
                    const yearAgo = new Date(today);
                    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                    return reservationDate >= yearAgo;
                default:
                    return true;
            }
        });
    }

    sortReservations(reservations, sortBy) {
        return reservations.sort((a, b) => {
            switch (sortBy) {
                case 'date_asc':
                    return new Date(a.date_depart) - new Date(b.date_depart);
                case 'prix_desc':
                    return b.prix_total - a.prix_total;
                case 'prix_asc':
                    return a.prix_total - b.prix_total;
                case 'date_desc':
                default:
                    return new Date(b.date_depart) - new Date(a.date_depart);
            }
        });
    }

    displayReservations(reservations) {
        const container = document.getElementById('reservationsContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (!container) return;

        if (reservations.length === 0) {
            container.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        container.innerHTML = reservations.map(reservation => `
            <div class="reservation-card">
                <div class="reservation-header">
                    <div>
                        <div class="reservation-reference">${reservation.reference}</div>
                        <div class="reservation-date">Réservé le ${this.formatDate(reservation.date_reservation)}</div>
                    </div>
                    <div class="reservation-status status-${reservation.statut}">
                        ${this.getStatusLabel(reservation.statut)}
                    </div>
                </div>

                <div class="reservation-content">
                    <div class="reservation-route">
                        <div class="route-cities">
                            <div class="route-from">${reservation.ville_depart}</div>
                            <div class="route-arrow">→</div>
                            <div class="route-to">${reservation.ville_arrivee}</div>
                            <div class="route-date">
                                ${this.formatDate(reservation.date_depart)} à ${reservation.heure_depart}
                            </div>
                        </div>
                    </div>

                    <div class="reservation-details">
                        <div class="detail-item">
                            <span class="detail-label">Passagers:</span>
                            <span class="detail-value">${reservation.nombre_places} personne(s)</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Durée:</span>
                            <span class="detail-value">${reservation.duree_estimee || 'Non spécifiée'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Paiement:</span>
                            <span class="detail-value">${this.getPaymentMethodLabel(reservation.moyen_paiement)}</span>
                        </div>
                    </div>

                    <div class="reservation-price">
                        <div class="price-amount">${this.formatPrice(reservation.prix_total)} FCFA</div>
                        <div class="price-per-person">${this.formatPrice(reservation.prix_unitaire)} par personne</div>
                    </div>
                </div>

                <div class="reservation-actions">
                    <button class="btn btn-outline btn-sm" 
                            onclick="historiqueManager.viewReservationDetails('${reservation.reference}')">
                        📋 Détails
                    </button>
                    
                    ${reservation.statut === 'confirme' ? `
                        <button class="btn btn-outline btn-sm" 
                                onclick="historiqueManager.downloadTicket('${reservation.reference}')">
                            🎫 Télécharger
                        </button>
                    ` : ''}
                    
                    ${reservation.statut === 'confirme' ? `
                        <button class="btn btn-danger btn-sm" 
                                onclick="historiqueManager.cancelReservation(${reservation.id})"
                                data-reservation-id="${reservation.id}">
                            ❌ Annuler
                        </button>
                    ` : ''}
                    
                    ${reservation.statut === 'completed' ? `
                        <button class="btn btn-outline btn-sm" 
                                onclick="historiqueManager.rateTrip(${reservation.id})">
                            ⭐ Noter
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const totalReservations = this.reservations.length;
        const upcomingTrips = this.reservations.filter(r => 
            r.statut === 'confirme' && new Date(r.date_depart) >= new Date()
        ).length;
        const totalSpent = this.reservations
            .filter(r => r.statut !== 'annule')
            .reduce((sum, r) => sum + parseFloat(r.prix_total), 0);

        document.getElementById('totalReservations').textContent = totalReservations;
        document.getElementById('upcomingTrips').textContent = upcomingTrips;
        document.getElementById('totalSpent').textContent = this.formatPrice(totalSpent) + ' FCFA';
    }

    setupEventListeners() {
        // Filtres
        const periodFilter = document.getElementById('filter-period');
        const statusFilter = document.getElementById('filter-status');
        const sortFilter = document.getElementById('filter-sort');
        const resetButton = document.getElementById('resetFilters');
        const exportButton = document.getElementById('exportHistory');

        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.filters.period = e.target.value;
                this.applyFilters();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.applyFilters();
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        if (exportButton) {
            exportButton.addEventListener('click', () => {
                this.exportHistory();
            });
        }
    }

    resetFilters() {
        document.getElementById('filter-period').value = 'all';
        document.getElementById('filter-status').value = 'all';
        document.getElementById('filter-sort').value = 'date_desc';
        
        this.filters = {
            period: 'all',
            status: 'all',
            sort: 'date_desc'
        };
        
        this.applyFilters();
    }

    async exportHistory() {
        try {
            // Simulation d'export
            const csvContent = this.generateCSV();
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `miabetrans-historique-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showSuccess('Historique exporté avec succès!');
        } catch (error) {
            console.error('Erreur export:', error);
            this.showError('Erreur lors de l\'export de l\'historique');
        }
    }

    generateCSV() {
        const headers = ['Référence', 'Trajet', 'Date', 'Passagers', 'Prix Total', 'Statut', 'Date Réservation'];
        const rows = this.reservations.map(reservation => [
            reservation.reference,
            `${reservation.ville_depart} → ${reservation.ville_arrivee}`,
            this.formatDate(reservation.date_depart),
            reservation.nombre_places,
            reservation.prix_total + ' FCFA',
            this.getStatusLabel(reservation.statut),
            this.formatDate(reservation.date_reservation)
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    viewReservationDetails(reference) {
        alert(`Détails de la réservation: ${reference}\n\nCette fonctionnalité sera implémentée dans une version future.`);
    }

    downloadTicket(reference) {
        alert(`Téléchargement du ticket: ${reference}\n\nCette fonctionnalité sera implémentée dans une version future.`);
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

    rateTrip(reservationId) {
        alert(`Noter le trajet pour la réservation #${reservationId}\n\nCette fonctionnalité sera implémentée dans une version future.`);
    }

    // Utilitaires
    getStatusLabel(status) {
        const statusMap = {
            'confirme': 'Confirmée',
            'en_attente': 'En attente',
            'annule': 'Annulée',
            'completed': 'Terminée'
        };
        return statusMap[status] || status;
    }

    getPaymentMethodLabel(method) {
        const methods = {
            'especes': 'Espèces',
            'flooz': 'Flooz Money',
            'tmoney': 'T-Money'
        };
        return methods[method] || method;
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
                        <a href="historique.html" class="dropdown-item active">Mes réservations</a>
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
            window.location.href = '../Utilisateurs/connexion.html';
        }
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
const historiqueManager = new HistoriqueManager();