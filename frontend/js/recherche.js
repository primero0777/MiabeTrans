// Gestion de la recherche de trajets - ES6+
class RechercheManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.currentResults = [];
        this.filters = {
            depart: '',
            arrivee: '',
            date: '',
            passagers: 1,
            prix_max: 10000,
            heure_depart: '',
            type_vehicule: '',
            compagnie: '',
            services: []
        };
        this.currentPage = 1;
        this.resultsPerPage = 10;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAuthSection();
        this.loadPopularSuggestions();
        this.loadInitialResults();
        this.setupRealTimeSearch();
    }

    setupEventListeners() {
        // Formulaire de recherche
        const searchForm = document.getElementById('advancedSearchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch(e);
            });
        }

        // Filtres avancés
        this.setupAdvancedFilters();
        
        // Réinitialisation
        const resetBtn = document.getElementById('resetSearch');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSearch();
            });
        }

        // Tri des résultats
        const sortSelect = document.getElementById('sortResults');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortResults(e.target.value);
            });
        }

        // Modification de recherche
        const modifySearchBtn = document.getElementById('modifySearch');
        if (modifySearchBtn) {
            modifySearchBtn.addEventListener('click', () => {
                this.scrollToSearchForm();
            });
        }
    }

    setupAdvancedFilters() {
        // Toggle des filtres avancés
        const toggleBtn = document.getElementById('toggleFilters');
        const filtersSection = document.getElementById('advancedFilters');
        
        if (toggleBtn && filtersSection) {
            toggleBtn.addEventListener('click', () => {
                const isVisible = filtersSection.style.display !== 'none';
                filtersSection.style.display = isVisible ? 'none' : 'block';
                toggleBtn.textContent = isVisible ? 'Afficher les filtres' : 'Masquer les filtres';
            });
        }

        // Range de prix
        const prixRange = document.getElementById('filter-prix-max');
        const prixValue = document.getElementById('prixMaxValue');
        
        if (prixRange && prixValue) {
            prixRange.addEventListener('input', (e) => {
                const value = e.target.value;
                prixValue.textContent = this.formatPrice(value) + ' FCFA';
                this.filters.prix_max = parseInt(value);
            });
        }

        // Services
        const serviceCheckboxes = document.querySelectorAll('input[name^="service_"]');
        serviceCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateServicesFilter();
            });
        });

        // Filtres de sélection
        const selectFilters = ['filter-heure-depart', 'filter-type-vehicule', 'filter-compagnie'];
        selectFilters.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', (e) => {
                    const filterName = e.target.name;
                    this.filters[filterName] = e.target.value;
                    this.performSearch();
                });
            }
        });
    }

    setupRealTimeSearch() {
        // Recherche en temps réel pour départ/arrivée
        const departInput = document.getElementById('search-depart');
        const arriveeInput = document.getElementById('search-arrivee');

        if (departInput) {
            departInput.addEventListener('input', this.debounce(() => {
                this.filters.depart = departInput.value;
                this.performSearch();
            }, 500));
        }

        if (arriveeInput) {
            arriveeInput.addEventListener('input', this.debounce(() => {
                this.filters.arrivee = arriveeInput.value;
                this.performSearch();
            }, 500));
        }
    }

    updateServicesFilter() {
        const selectedServices = [];
        document.querySelectorAll('input[name^="service_"]:checked').forEach(checkbox => {
            selectedServices.push(checkbox.name.replace('service_', ''));
        });
        this.filters.services = selectedServices;
        this.performSearch();
    }

    async handleSearch(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        // Récupérer les valeurs du formulaire
        this.filters.depart = formData.get('depart') || '';
        this.filters.arrivee = formData.get('arrivee') || '';
        this.filters.date = formData.get('date') || '';
        this.filters.passagers = parseInt(formData.get('passagers')) || 1;
        this.filters.heure_depart = formData.get('heure_depart') || '';
        this.filters.type_vehicule = formData.get('type_vehicule') || '';
        this.filters.compagnie = formData.get('compagnie') || '';

        await this.performSearch();
    }

    async performSearch() {
        // Validation basique
        if (!this.filters.depart && !this.filters.arrivee) {
            this.showSuggestions();
            return;
        }

        this.showLoading();
        this.hideSuggestions();

        try {
            // Construire les paramètres de recherche
            const searchParams = new URLSearchParams();
            
            if (this.filters.depart) searchParams.append('depart', this.filters.depart);
            if (this.filters.arrivee) searchParams.append('arrivee', this.filters.arrivee);
            if (this.filters.date) searchParams.append('date', this.filters.date);
            searchParams.append('passagers', this.filters.passagers);
            searchParams.append('prix_max', this.filters.prix_max);
            if (this.filters.heure_depart) searchParams.append('heure_depart', this.filters.heure_depart);
            if (this.filters.type_vehicule) searchParams.append('type_vehicule', this.filters.type_vehicule);
            if (this.filters.compagnie) searchParams.append('compagnie', this.filters.compagnie);
            if (this.filters.services.length > 0) {
                this.filters.services.forEach(service => searchParams.append('services[]', service));
            }

            const response = await this.api.getTrajets(searchParams.toString());
            
            if (response.success) {
                this.currentResults = response.data.trajets;
                this.displayResults();
                this.updateResultsTitle();
                this.showActiveFilters();
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            console.error('Erreur recherche:', error);
            this.showError('Erreur lors de la recherche de trajets');
            this.showEmptyResults();
        } finally {
            this.hideLoading();
        }
    }

    displayResults() {
        const container = document.getElementById('resultsContainer');
        const emptyResults = document.getElementById('emptyResults');
        const resultsSection = document.getElementById('resultsSection');

        if (!container || !emptyResults || !resultsSection) return;

        // Afficher la section des résultats
        resultsSection.style.display = 'block';

        if (this.currentResults.length === 0) {
            this.showEmptyResults();
            return;
        }

        // Masquer l'état vide
        emptyResults.style.display = 'none';

        // Afficher les résultats
        container.innerHTML = this.currentResults.map((trajet, index) => `
            <div class="result-card" style="animation-delay: ${index * 0.1}s">
                <div class="result-content">
                    <div class="result-route">
                        <div class="route-arrow">→</div>
                        <div class="route-info">
                            <h3>${trajet.ville_depart} - ${trajet.ville_arrivee}</h3>
                            <div class="route-details">
                                ${this.formatDate(trajet.date_depart)} • ${trajet.heure_depart} • ${trajet.duree_estimee || 'Durée non spécifiée'}
                                ${trajet.promotion ? '<span class="promotion-badge">Promo</span>' : ''}
                            </div>
                        </div>
                    </div>

                    <div class="result-details">
                        <div class="detail-item">
                            <span>🚌</span>
                            <span>${trajet.type_vehicule || 'Bus standard'}</span>
                        </div>
                        <div class="detail-item">
                            <span>👥</span>
                            <span>${trajet.places_disponibles} places disponibles</span>
                        </div>
                        <div class="detail-item">
                            <span class="availability-badge ${this.getAvailabilityClass(trajet.places_disponibles)}">
                                ${this.getAvailabilityText(trajet.places_disponibles)}
                            </span>
                        </div>
                    </div>

                    <div class="result-price">
                        ${trajet.promotion ? `
                            <div class="price-original" style="text-decoration: line-through; color: var(--text-secondary); font-size: 0.875rem;">
                                ${this.formatPrice(trajet.prix_original)} FCFA
                            </div>
                        ` : ''}
                        <div class="price-amount ${trajet.promotion ? 'text-red-600' : ''}">
                            ${this.formatPrice(trajet.prix)} FCFA
                        </div>
                        <div class="price-per-person">par personne</div>
                    </div>
                </div>

                <div class="result-actions">
                    <button class="btn btn-outline btn-sm" 
                            onclick="rechercheManager.viewTrajetDetails(${trajet.id})">
                        📋 Détails
                    </button>
                    <button class="btn btn-primary btn-sm" 
                            onclick="rechercheManager.reserverTrajet(${trajet.id})"
                            ${trajet.places_disponibles === 0 ? 'disabled' : ''}>
                        ${trajet.places_disponibles === 0 ? 'Complet' : 'Réserver'}
                    </button>
                </div>
            </div>
        `).join('');

        // Mettre à jour le compteur de résultats
        this.updateResultsCount();
    }

    getAvailabilityClass(places) {
        if (places === 0) return 'availability-low';
        if (places < 5) return 'availability-medium';
        return 'availability-high';
    }

    getAvailabilityText(places) {
        if (places === 0) return 'Complet';
        if (places < 5) return `${places} restantes`;
        return 'Disponible';
    }

    updateResultsTitle() {
        const title = document.getElementById('resultsTitle');
        if (!title) return;

        let titleText = 'Résultats de recherche';
        
        if (this.filters.depart && this.filters.arrivee) {
            titleText = `${this.filters.depart} → ${this.filters.arrivee}`;
        } else if (this.filters.depart) {
            titleText = `Départ de ${this.filters.depart}`;
        } else if (this.filters.arrivee) {
            titleText = `Arrivée à ${this.filters.arrivee}`;
        }

        title.textContent = titleText;
    }

    updateResultsCount() {
        const countElement = document.getElementById('resultsCount');
        if (countElement) {
            countElement.textContent = `${this.currentResults.length} trajet(s) trouvé(s)`;
        }
    }

    showActiveFilters() {
        // Implémentation pour afficher les filtres actifs
        const activeFiltersContainer = document.createElement('div');
        activeFiltersContainer.className = 'active-filters';
        
        // Ajouter les filtres actifs
        const activeFilters = [];
        
        if (this.filters.depart) {
            activeFilters.push(this.createActiveFilter('Départ: ' + this.filters.depart, 'depart'));
        }
        if (this.filters.arrivee) {
            activeFilters.push(this.createActiveFilter('Arrivée: ' + this.filters.arrivee, 'arrivee'));
        }
        if (this.filters.prix_max < 10000) {
            activeFilters.push(this.createActiveFilter('Prix max: ' + this.formatPrice(this.filters.prix_max) + ' FCFA', 'prix_max'));
        }
        
        if (activeFilters.length > 0) {
            activeFiltersContainer.innerHTML = activeFilters.join('');
            const resultsSection = document.getElementById('resultsSection');
            const existingActiveFilters = resultsSection.querySelector('.active-filters');
            if (existingActiveFilters) {
                existingActiveFilters.remove();
            }
            resultsSection.insertBefore(activeFiltersContainer, resultsSection.querySelector('.results-container'));
        }
    }

    createActiveFilter(text, filterType) {
        return `
            <div class="active-filter">
                <span>${text}</span>
                <button class="remove-filter" onclick="rechercheManager.removeFilter('${filterType}')">×</button>
            </div>
        `;
    }

    removeFilter(filterType) {
        switch (filterType) {
            case 'depart':
                this.filters.depart = '';
                document.getElementById('search-depart').value = '';
                break;
            case 'arrivee':
                this.filters.arrivee = '';
                document.getElementById('search-arrivee').value = '';
                break;
            case 'prix_max':
                this.filters.prix_max = 10000;
                document.getElementById('filter-prix-max').value = 10000;
                document.getElementById('prixMaxValue').textContent = '10 000 FCFA';
                break;
        }
        this.performSearch();
    }

    sortResults(sortBy) {
        const sortedResults = [...this.currentResults];

        switch (sortBy) {
            case 'prix_croissant':
                sortedResults.sort((a, b) => a.prix - b.prix);
                break;
            case 'prix_decroissant':
                sortedResults.sort((a, b) => b.prix - a.prix);
                break;
            case 'heure_depart':
                sortedResults.sort((a, b) => a.heure_depart.localeCompare(b.heure_depart));
                break;
            case 'duree':
                sortedResults.sort((a, b) => {
                    const durA = this.parseDuration(a.duree_estimee);
                    const durB = this.parseDuration(b.duree_estimee);
                    return durA - durB;
                });
                break;
        }

        this.currentResults = sortedResults;
        this.displayResults();
    }

    parseDuration(duration) {
        if (!duration) return 0;
        const match = duration.match(/(\d+)h/);
        return match ? parseInt(match[1]) : 0;
    }

    async loadPopularSuggestions() {
        try {
            const response = await this.api.getPopularRoutes();
            
            if (response.success) {
                this.displaySuggestions(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement suggestions:', error);
            // Données de démonstration
            this.displaySuggestions(this.getDemoSuggestions());
        }
    }

    getDemoSuggestions() {
        return [
            { ville_depart: 'Lomé', ville_arrivee: 'Kpalimé', prix: 2500, duree: '2h 30min' },
            { ville_depart: 'Lomé', ville_arrivee: 'Sokodé', prix: 5000, duree: '4h 30min' },
            { ville_depart: 'Lomé', ville_arrivee: 'Kara', prix: 6000, duree: '5h 30min' },
            { ville_depart: 'Kpalimé', ville_arrivee: 'Atakpamé', prix: 3500, duree: '3h' },
            { ville_depart: 'Sokodé', ville_arrivee: 'Kara', prix: 2000, duree: '1h 30min' },
            { ville_depart: 'Lomé', ville_arrivee: 'Dapaong', prix: 8000, duree: '7h' }
        ];
    }

    displaySuggestions(suggestions) {
        const container = document.getElementById('suggestionsGrid');
        if (!container) return;

        container.innerHTML = suggestions.map(route => `
            <div class="suggestion-card" onclick="rechercheManager.selectSuggestion('${route.ville_depart}', '${route.ville_arrivee}')">
                <div class="suggestion-route">${route.ville_depart} → ${route.ville_arrivee}</div>
                <div class="suggestion-price">${this.formatPrice(route.prix)} FCFA</div>
                <div class="suggestion-duration">${route.duree}</div>
                <button class="btn btn-outline btn-sm">Voir les trajets</button>
            </div>
        `).join('');
    }

    selectSuggestion(depart, arrivee) {
        document.getElementById('search-depart').value = depart;
        document.getElementById('search-arrivee').value = arrivee;
        
        this.filters.depart = depart;
        this.filters.arrivee = arrivee;
        
        this.performSearch();
    }

    async loadInitialResults() {
        // Charger quelques résultats populaires au chargement
        try {
            const response = await this.api.getTrajets('limit=6&popular=true');
            if (response.success && response.data.trajets.length > 0) {
                this.currentResults = response.data.trajets;
                this.displayResults();
                this.updateResultsTitle();
            }
        } catch (error) {
            console.error('Erreur chargement initial:', error);
        }
    }

    async viewTrajetDetails(trajetId) {
        try {
            const response = await this.api.getTrajetDetails(trajetId);
            if (response.success) {
                this.showTrajetDetailsModal(response.data);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erreur détails trajet:', error);
            this.showError('Impossible de charger les détails du trajet');
        }
    }

    showTrajetDetailsModal(trajet) {
        // Créer et afficher un modal avec les détails du trajet
        const modalHTML = `
            <div class="modal" id="trajetDetailsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Détails du trajet</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="trajet-details">
                            <div class="detail-section">
                                <h4>Itinéraire</h4>
                                <div class="route-display">
                                    <div class="route-point">
                                        <strong>${trajet.ville_depart}</strong>
                                        <div>${trajet.adresse_depart}</div>
                                        <div>${this.formatDate(trajet.date_depart)} à ${trajet.heure_depart}</div>
                                    </div>
                                    <div class="route-arrow">→</div>
                                    <div class="route-point">
                                        <strong>${trajet.ville_arrivee}</strong>
                                        <div>${trajet.adresse_arrivee}</div>
                                        <div>${this.formatDate(trajet.date_arrivee)} à ${trajet.heure_arrivee}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Informations</h4>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span>Durée:</span>
                                        <span>${trajet.duree_estimee}</span>
                                    </div>
                                    <div class="info-item">
                                        <span>Distance:</span>
                                        <span>${trajet.distance || 'N/A'} km</span>
                                    </div>
                                    <div class="info-item">
                                        <span>Véhicule:</span>
                                        <span>${trajet.type_vehicule}</span>
                                    </div>
                                    <div class="info-item">
                                        <span>Places disponibles:</span>
                                        <span>${trajet.places_disponibles}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Services inclus</h4>
                                <div class="services-list">
                                    ${trajet.services ? trajet.services.map(service => `
                                        <span class="service-badge">${service}</span>
                                    `).join('') : '<span>Aucun service spécifique</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Fermer</button>
                        <button class="btn btn-primary" onclick="rechercheManager.reserverTrajet(${trajet.id})">Réserver</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async reserverTrajet(trajetId) {
        // Vérifier si l'utilisateur est connecté
        const token = localStorage.getItem('miabetrans_token');
        if (!token) {
            this.showLoginPrompt();
            return;
        }

        try {
            // Rediriger vers la page de réservation
            window.location.href = `reserver.html?trajet_id=${trajetId}`;
        } catch (error) {
            console.error('Erreur réservation:', error);
            this.showError('Impossible de procéder à la réservation');
        }
    }

    showLoginPrompt() {
        if (confirm('Vous devez être connecté pour réserver un trajet. Souhaitez-vous vous connecter ?')) {
            window.location.href = '../Utilisateurs/connexion.html';
        }
    }

    resetSearch() {
        // Réinitialiser le formulaire
        document.getElementById('advancedSearchForm').reset();
        
        // Réinitialiser les filtres
        this.filters = {
            depart: '',
            arrivee: '',
            date: '',
            passagers: 1,
            prix_max: 10000,
            heure_depart: '',
            type_vehicule: '',
            compagnie: '',
            services: []
        };
        
        // Réinitialiser l'affichage des prix
        document.getElementById('prixMaxValue').textContent = '10 000 FCFA';
        
        // Masquer les résultats
        document.getElementById('resultsSection').style.display = 'none';
        
        // Afficher les suggestions
        this.showSuggestions();
        
        // Supprimer les filtres actifs
        const activeFilters = document.querySelector('.active-filters');
        if (activeFilters) {
            activeFilters.remove();
        }
    }

    scrollToSearchForm() {
        document.querySelector('.search-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    showLoading() {
        const loadingElement = document.getElementById('loadingResults');
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (loadingElement && resultsContainer) {
            resultsContainer.style.display = 'none';
            loadingElement.style.display = 'block';
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('loadingResults');
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (loadingElement && resultsContainer) {
            loadingElement.style.display = 'none';
            resultsContainer.style.display = 'flex';
        }
    }

    showEmptyResults() {
        const emptyResults = document.getElementById('emptyResults');
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (emptyResults && resultsContainer) {
            resultsContainer.style.display = 'none';
            emptyResults.style.display = 'block';
        }
    }

    showSuggestions() {
        const suggestionsSection = document.getElementById('suggestionsSection');
        const resultsSection = document.getElementById('resultsSection');
        
        if (suggestionsSection && resultsSection) {
            resultsSection.style.display = 'none';
            suggestionsSection.style.display = 'block';
        }
    }

    hideSuggestions() {
        const suggestionsSection = document.getElementById('suggestionsSection');
        if (suggestionsSection) {
            suggestionsSection.style.display = 'none';
        }
    }

    showError(message) {
        // Créer une notification d'erreur
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span>⚠️ ${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 400px;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Méthodes utilitaires
    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR').format(price);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    setupAuthSection() {
        const authSection = document.getElementById('authSection');
        if (!authSection) return;

        const token = localStorage.getItem('miabetrans_token');
        const user = JSON.parse(localStorage.getItem('miabetrans_user') || '{}');

        if (token && user.nom) {
            authSection.innerHTML = `
                <div class="nav-user">
                    <span>Bonjour, ${user.nom}</span>
                    <div class="user-dropdown">
                        <button class="user-menu-btn">
                            👤
                        </button>
                        <div class="user-dropdown-content">
                            <a href="../Utilisateurs/profil.html">Mon profil</a>
                            <a href="../Reservations/historique.html">Mes réservations</a>
                            <a href="#" onclick="rechercheManager.logout()">Déconnexion</a>
                        </div>
                    </div>
                </div>
            `;
        } else {
            authSection.innerHTML = `
                <li class="nav-item">
                    <a href="../Utilisateurs/connexion.html" class="nav-link">Connexion</a>
                </li>
                <li class="nav-item">
                    <a href="../Utilisateurs/inscription.html" class="btn btn-primary btn-sm">Inscription</a>
                </li>
            `;
        }
    }

    logout() {
        localStorage.removeItem('miabetrans_token');
        localStorage.removeItem('miabetrans_user');
        localStorage.removeItem('miabetrans_role');
        window.location.reload();
    }
}

// Classe API pour gérer les appels backend
class MiabeTransAPI {
    constructor() {
        this.baseURL = '../../api';
    }

    async getTrajets(params = '') {
        // Simulation d'API - À remplacer par de vraies requêtes
        return new Promise((resolve) => {
            setTimeout(() => {
                // Données de démonstration
                const demoTrajets = this.getDemoTrajets();
                const filteredTrajets = this.filterTrajets(demoTrajets, params);
                
                resolve({
                    success: true,
                    data: {
                        trajets: filteredTrajets,
                        total: filteredTrajets.length
                    }
                });
            }, 1000);
        });
    }

    getDemoTrajets() {
        return [
            {
                id: 1,
                ville_depart: 'Lomé',
                ville_arrivee: 'Kpalimé',
                date_depart: '2024-12-20',
                heure_depart: '08:00',
                date_arrivee: '2024-12-20',
                heure_arrivee: '10:30',
                duree_estimee: '2h 30min',
                prix: 2500,
                prix_original: 3000,
                promotion: true,
                places_disponibles: 8,
                type_vehicule: 'Minibus climatisé',
                compagnie: 'MiabeTrans',
                services: ['climatisation', 'wifi', 'prises']
            },
            {
                id: 2,
                ville_depart: 'Lomé',
                ville_arrivee: 'Sokodé',
                date_depart: '2024-12-20',
                heure_depart: '14:00',
                date_arrivee: '2024-12-20',
                heure_arrivee: '18:30',
                duree_estimee: '4h 30min',
                prix: 5000,
                places_disponibles: 15,
                type_vehicule: 'Bus standard',
                compagnie: 'ABC Transport',
                services: ['climatisation']
            },
            {
                id: 3,
                ville_depart: 'Kpalimé',
                ville_arrivee: 'Atakpamé',
                date_depart: '2024-12-20',
                heure_depart: '09:00',
                date_arrivee: '2024-12-20',
                heure_arrivee: '12:00',
                duree_estimee: '3h',
                prix: 3500,
                places_disponibles: 3,
                type_vehicule: 'Van',
                compagnie: 'Rapide Express',
                services: ['climatisation', 'prises']
            }
        ];
    }

    filterTrajets(trajets, params) {
        const searchParams = new URLSearchParams(params);
        
        return trajets.filter(trajet => {
            // Filtre par ville de départ
            if (searchParams.get('depart') && !trajet.ville_depart.toLowerCase().includes(searchParams.get('depart').toLowerCase())) {
                return false;
            }
            
            // Filtre par ville d'arrivée
            if (searchParams.get('arrivee') && !trajet.ville_arrivee.toLowerCase().includes(searchParams.get('arrivee').toLowerCase())) {
                return false;
            }
            
            // Filtre par prix maximum
            if (searchParams.get('prix_max') && trajet.prix > parseInt(searchParams.get('prix_max'))) {
                return false;
            }
            
            // Filtre par type de véhicule
            if (searchParams.get('type_vehicule') && trajet.type_vehicule !== searchParams.get('type_vehicule')) {
                return false;
            }
            
            // Filtre par compagnie
            if (searchParams.get('compagnie') && trajet.compagnie !== searchParams.get('compagnie')) {
                return false;
            }
            
            return true;
        });
    }

    async getPopularRoutes() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: [
                        { ville_depart: 'Lomé', ville_arrivee: 'Kpalimé', prix: 2500, duree: '2h 30min' },
                        { ville_depart: 'Lomé', ville_arrivee: 'Sokodé', prix: 5000, duree: '4h 30min' },
                        { ville_depart: 'Lomé', ville_arrivee: 'Kara', prix: 6000, duree: '5h 30min' },
                        { ville_depart: 'Kpalimé', ville_arrivee: 'Atakpamé', prix: 3500, duree: '3h' }
                    ]
                });
            }, 500);
        });
    }

    async getTrajetDetails(trajetId) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const trajet = this.getDemoTrajets().find(t => t.id === trajetId);
                resolve({
                    success: !!trajet,
                    data: trajet || null
                });
            }, 500);
        });
    }
}

// Initialisation
let rechercheManager;

document.addEventListener('DOMContentLoaded', () => {
    rechercheManager = new RechercheManager();
});

// Export pour utilisation globale
window.RechercheManager = RechercheManager;
window.MiabeTransAPI = MiabeTransAPI;