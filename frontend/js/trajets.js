// Gestion des trajets - ES6+
class TrajetsManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.currentPage = 1;
        this.filters = {};
        this.sortBy = 'heure_depart';
        this.init();
    }

    init() {
        this.loadTrajets();
        this.setupEventListeners();
        this.setupAuthSection();
        this.parseURLParams();
    }

    setupEventListeners() {
        // Filtres
        const filterForm = document.getElementById('filterForm');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFilterSubmit(e);
            });
        }

        // Tri
        const sortSelect = document.getElementById('sortBy');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.loadTrajets();
            });
        }

        // Pagination (gérée dynamiquement)
    }

    parseURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('depart')) {
            this.filters.depart = urlParams.get('depart');
            document.getElementById('filter-depart').value = this.filters.depart;
        }
        
        if (urlParams.has('arrivee')) {
            this.filters.arrivee = urlParams.get('arrivee');
            document.getElementById('filter-arrivee').value = this.filters.arrivee;
        }
        
        if (urlParams.has('date')) {
            this.filters.date = urlParams.get('date');
            document.getElementById('filter-date').value = this.filters.date;
        }
        
        if (urlParams.has('passagers')) {
            this.filters.passagers = urlParams.get('passagers');
            document.getElementById('filter-passagers').value = this.filters.passagers;
        }

        // Charger les trajets avec les paramètres URL
        if (Object.keys(this.filters).length > 0) {
            this.loadTrajets();
        }
    }

    async handleFilterSubmit(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        this.filters = {
            depart: formData.get('depart'),
            arrivee: formData.get('arrivee'),
            date: formData.get('date'),
            passagers: formData.get('passagers')
        };

        this.currentPage = 1;
        await this.loadTrajets();
    }

    async loadTrajets() {
        const trajetsList = document.getElementById('trajetsList');
        const resultsCount = document.getElementById('resultsCount');
        const emptyState = document.getElementById('emptyState');

        if (trajetsList) {
            trajetsList.innerHTML = '<div class="loading">Chargement des trajets...</div>';
        }

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: 10,
                sort: this.sortBy,
                ...this.filters
            });

            const response = await this.api.getTrajets(params.toString());

            if (response.success) {
                this.displayTrajets(response.data.trajets);
                this.updateResultsCount(response.data.trajets.length, response.data.pagination?.total);
                this.setupPagination(response.data.pagination);
                
                // Afficher/masquer l'état vide
                if (emptyState) {
                    emptyState.style.display = response.data.trajets.length === 0 ? 'block' : 'none';
                }
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            console.error('Erreur chargement trajets:', error);
            this.showError('Erreur lors du chargement des trajets');
        }
    }

    displayTrajets(trajets) {
        const trajetsList = document.getElementById('trajetsList');
        if (!trajetsList) return;

        if (trajets.length === 0) {
            trajetsList.innerHTML = '';
            return;
        }

        trajetsList.innerHTML = trajets.map(trajet => `
            <div class="trajet-card" role="article">
                <div class="trajet-header">
                    <h3 class="trajet-route">
                        ${trajet.ville_depart} → ${trajet.ville_arrivee}
                    </h3>
                    <div class="trajet-price">
                        ${this.formatPrice(trajet.prix)} FCFA
                        <span class="price-per-person">par personne</span>
                    </div>
                </div>

                <div class="trajet-details">
                    <div class="detail-group">
                        <div class="detail-item">
                            <span class="detail-label">📅 Départ</span>
                            <span class="detail-value">
                                ${this.formatDate(trajet.date_depart)} à ${trajet.heure_depart}
                            </span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">⏱️ Durée</span>
                            <span class="detail-value">${trajet.duree_estimee || 'Non spécifiée'}</span>
                        </div>
                    </div>

                    <div class="detail-group">
                        <div class="detail-item">
                            <span class="detail-label">🚌 Places</span>
                            <span class="detail-value ${trajet.places_disponibles < 10 ? 'low-availability' : ''}">
                                ${trajet.places_disponibles} / ${trajet.places_total} disponibles
                            </span>
                        </div>
                        
                        <div class="detail-item">
                            <span class="detail-label">👤 Chauffeur</span>
                            <span class="detail-value">Chauffeur vérifié</span>
                        </div>
                    </div>
                </div>

                <div class="trajet-actions">
                    <button class="btn btn-outline" 
                            onclick="trajetsManager.showTrajetDetails(${trajet.id})"
                            aria-label="Voir les détails du trajet de ${trajet.ville_depart} à ${trajet.ville_arrivee}">
                        Détails
                    </button>
                    
                    <button class="btn btn-primary" 
                            onclick="trajetsManager.reserverTrajet(${trajet.id})"
                            ${trajet.places_disponibles === 0 ? 'disabled' : ''}
                            aria-label="Réserver le trajet de ${trajet.ville_depart} à ${trajet.ville_arrivee}">
                        ${trajet.places_disponibles === 0 ? 'Complet' : 'Réserver'}
                    </button>
                </div>

                ${trajet.places_disponibles < 5 && trajet.places_disponibles > 0 ? `
                    <div class="availability-warning" role="alert">
                        ⚠️ Plus que ${trajet.places_disponibles} place(s) disponible(s)!
                    </div>
                ` : ''}
            </div>
        `).join('');
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

    updateResultsCount(currentCount, totalCount) {
        const resultsCount = document.getElementById('resultsCount');
        if (!resultsCount) return;

        if (totalCount !== undefined) {
            resultsCount.textContent = `${currentCount} trajet(s) sur ${totalCount} trouvé(s)`;
        } else {
            resultsCount.textContent = `${currentCount} trajet(s) trouvé(s)`;
        }
    }

    setupPagination(pagination) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer || !pagination) return;

        const { page, pages } = pagination;

        if (pages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Page précédente
        if (page > 1) {
            paginationHTML += `
                <button class="pagination-btn" onclick="trajetsManager.goToPage(${page - 1})">
                    ← Précédent
                </button>
            `;
        }

        // Pages
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
                paginationHTML += `
                    <button class="pagination-btn ${i === page ? 'active' : ''}" 
                            onclick="trajetsManager.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === page - 2 || i === page + 2) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // Page suivante
        if (page < pages) {
            paginationHTML += `
                <button class="pagination-btn" onclick="trajetsManager.goToPage(${page + 1})">
                    Suivant →
                </button>
            `;
        }

        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadTrajets();
        
        // Scroll vers le haut des résultats
        document.querySelector('.trajets-results').scrollIntoView({
            behavior: 'smooth'
        });
    }

    showTrajetDetails(trajetId) {
        window.location.href = `details-trajet.html?id=${trajetId}`;
    }

    reserverTrajet(trajetId) {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (isLoggedIn) {
            window.location.href = `../Reservations/reserver.html?trajet=${trajetId}`;
        } else {
            // Rediriger vers la connexion avec retour prévu
            sessionStorage.setItem('redirectAfterLogin', `../Reservations/reserver.html?trajet=${trajetId}`);
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
                        <span class="user-name">Bonjour, ${user.prenom}</span>
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

            // Gestion du menu dropdown
            const userMenuButton = document.getElementById('userMenuButton');
            const userDropdown = document.getElementById('userDropdown');

            if (userMenuButton && userDropdown) {
                userMenuButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('show');
                });

                // Fermer le dropdown en cliquant ailleurs
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

    showError(message) {
        const trajetsList = document.getElementById('trajetsList');
        if (trajetsList) {
            trajetsList.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Erreur de chargement</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="trajetsManager.loadTrajets()">
                        Réessayer
                    </button>
                </div>
            `;
        }
    }
}

// Initialisation
const trajetsManager = new TrajetsManager();