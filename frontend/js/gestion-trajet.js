// gestion-trajet.js
// Gestion des trajets côté administrateur pour MiabeTrans
// Fichier commenté pour faciliter la lecture lors du mémoire / soutenance
// Dépendances attendues :
// - Une classe MiabeTransAPI fournissant les méthodes API utilisées ci-dessous
// - Un ensemble d'éléments DOM (table, filtres, modals, boutons) présents dans le HTML

class GestionTrajetsManager {
    constructor() {
        // Instance de l'API (doit être définie ailleurs dans le projet)
        this.api = new MiabeTransAPI();

        // Données
        this.trajets = []; // toutes les données reçues de l'API
        this.filteredTrajets = []; // trajets après application des filtres
        this.selectedTrajets = new Set(); // sélection multi-lignes pour actions groupées

        // Pagination
        this.currentPage = 1;
        this.rowsPerPage = 10;

        // Filtres utilisés pour le filtrage côté front
        this.filters = {
            ville_depart: '',
            ville_arrivee: '',
            date: '',
            statut: '',
            search: ''
        };

        // Initialisation
        this.init();
    }

    // Point d'entrée : attache les écouteurs et charge les données nécessaires
    init() {
        this.setupEventListeners();
        this.setupAuthSection();
        this.loadTrajets();
        this.loadChauffeurs();
        this.loadVehicules();
    }

    // Attache tous les écouteurs DOM nécessaires
    setupEventListeners() {
        // Filtres
        document.getElementById('filter-ville-depart')?.addEventListener('change', (e) => {
            this.filters.ville_depart = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-ville-arrivee')?.addEventListener('change', (e) => {
            this.filters.ville_arrivee = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-date')?.addEventListener('change', (e) => {
            this.filters.date = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-statut')?.addEventListener('change', (e) => {
            this.filters.statut = e.target.value;
            this.applyFilters();
        });

        // Recherche
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('searchTrajets')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Toggle des filtres
        document.getElementById('toggleFilters')?.addEventListener('click', () => {
            this.toggleFilters();
        });

        // Ajout de trajet
        document.getElementById('addTrajetBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });

        // Export
        document.getElementById('exportTrajets')?.addEventListener('click', () => {
            this.exportTrajets();
        });

        // Pagination
        document.getElementById('rowsPerPage')?.addEventListener('change', (e) => {
            this.rowsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.renderTable();
        });

        document.getElementById('prevPage')?.addEventListener('click', () => {
            this.previousPage();
        });

        document.getElementById('nextPage')?.addEventListener('click', () => {
            this.nextPage();
        });

        // Sélection multiple
        document.getElementById('selectAll')?.addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // Actions groupées
        document.getElementById('bulkActivate')?.addEventListener('click', () => {
            this.bulkActivate();
        });

        document.getElementById('bulkDeactivate')?.addEventListener('click', () => {
            this.bulkDeactivate();
        });

        document.getElementById('bulkDelete')?.addEventListener('click', () => {
            this.bulkDelete();
        });

        // Initialisation des modals
        this.setupTrajetModal();
        this.setupConfirmModal();
    }

    // --- Chargement des données via l'API ---
    async loadTrajets() {
        try {
            const response = await this.api.getAdminTrajets();
            if (response.success) {
                // On stocke la liste puis on applique les filtres
                this.trajets = response.data.trajets || [];
                this.applyFilters();
                this.updateQuickStats();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erreur chargement trajets:', error);
            this.showError('Erreur lors du chargement des trajets');
        }
    }

    async loadChauffeurs() {
        try {
            const response = await this.api.getChauffeurs();
            if (response.success) {
                this.populateChauffeursSelect(response.data.chauffeurs || []);
            }
        } catch (error) {
            console.error('Erreur chargement chauffeurs:', error);
        }
    }

    async loadVehicules() {
        try {
            const response = await this.api.getVehicules();
            if (response.success) {
                this.populateVehiculesSelect(response.data.vehicules || []);
            }
        } catch (error) {
            console.error('Erreur chargement véhicules:', error);
        }
    }

    // Remplit les selects du modal avec les chauffeurs
    populateChauffeursSelect(chauffeurs) {
        const select = document.getElementById('modal-chauffeur');
        if (!select) return;

        select.innerHTML = '<option value="">Sélectionnez un chauffeur</option>' +
            chauffeurs.map(chauffeur => `\n                <option value="${chauffeur.id}">\n                    ${chauffeur.prenom} ${chauffeur.nom} - ${chauffeur.telephone}\n                </option>\n            `).join('');
    }

    // Remplit les selects du modal avec les véhicules
    populateVehiculesSelect(vehicules) {
        const select = document.getElementById('modal-vehicule');
        if (!select) return;

        select.innerHTML = '<option value="">Sélectionnez un véhicule</option>' +
            vehicules.map(vehicule => `\n                <option value="${vehicule.id}">\n                    ${vehicule.marque} ${vehicule.modele} - ${vehicule.immatriculation}\n                </option>\n            `).join('');
    }

    // --- Filtrage & recherche ---
    applyFilters() {
        this.filteredTrajets = this.trajets.filter(trajet => {
            // Filtre ville de départ
            if (this.filters.ville_depart && trajet.ville_depart !== this.filters.ville_depart) {
                return false;
            }

            // Filtre ville d'arrivée
            if (this.filters.ville_arrivee && trajet.ville_arrivee !== this.filters.ville_arrivee) {
                return false;
            }

            // Filtre date
            if (this.filters.date && trajet.date_depart !== this.filters.date) {
                return false;
            }

            // Filtre statut
            if (this.filters.statut && trajet.statut !== this.filters.statut) {
                return false;
            }

            // Filtre recherche textuelle
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const searchable = [
                    trajet.ville_depart,
                    trajet.ville_arrivee,
                    trajet.chauffeur_nom,
                    trajet.chauffeur_prenom,
                    trajet.vehicule_marque,
                    trajet.vehicule_modele,
                    trajet.vehicule_immatriculation
                ].join(' ').toLowerCase();

                if (!searchable.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        // Reset pagination et rendu
        this.currentPage = 1;
        this.renderTable();
        this.updatePagination();
    }

    performSearch() {
        const searchInput = document.getElementById('searchTrajets');
        if (searchInput) {
            this.filters.search = searchInput.value.trim();
            this.applyFilters();
        }
    }

    // --- Rendu du tableau ---
    renderTable() {
        const tbody = document.getElementById('trajetsTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.rowsPerPage;
        const endIndex = startIndex + this.rowsPerPage;
        const paginatedTrajets = this.filteredTrajets.slice(startIndex, endIndex);

        tbody.innerHTML = paginatedTrajets.map(trajet => `\n            <tr data-trajet-id="${trajet.id}">\n                <td>\n                    <input type="checkbox" class="trajet-checkbox" \n                           value="${trajet.id}" ${this.selectedTrajets.has(trajet.id) ? 'checked' : ''}>\n                </td>\n                <td>#${trajet.id}</td>\n                <td>\n                    <div class="trajet-route">\n                        <strong>${trajet.ville_depart} → ${trajet.ville_arrivee}</strong>\n                        <div class="trajet-details">\n                            ${trajet.duree_estimee} • ${trajet.description || 'Aucune description'}\n                        </div>\n                    </div>\n                </td>\n                <td>\n                    <div class="datetime-info">\n                        <div>${this.formatDate(trajet.date_depart)}</div>\n                        <div class="text-muted">${trajet.heure_depart}</div>\n                    </div>\n                </td>\n                <td>\n                    ${trajet.chauffeur_prenom} ${trajet.chauffeur_nom}\n                    <div class="text-muted">${trajet.chauffeur_telephone}</div>\n                </td>\n                <td>\n                    ${trajet.vehicule_marque} ${trajet.vehicule_modele}\n                    <div class="text-muted">${trajet.vehicule_immatriculation}</div>\n                </td>\n                <td>\n                    <div class="places-info">\n                        <span class="${trajet.places_disponibles === 0 ? 'text-danger' : 'text-success'}">\n                            ${trajet.places_disponibles}/${trajet.nombre_places}\n                        </span>\n                    </div>\n                </td>\n                <td>\n                    <strong>${this.formatPrice(trajet.prix)} FCFA</strong>\n                </td>\n                <td>\n                    <span class="status-badge status-${trajet.statut}">\n                        ${this.getStatusText(trajet.statut)}\n                    </span>\n                </td>\n                <td>\n                    <div class="action-buttons">\n                        <button class="btn-table view" onclick="gestionTrajets.viewTrajet(${trajet.id})">\n                            👁️\n                        </button>\n                        <button class="btn-table edit" onclick="gestionTrajets.editTrajet(${trajet.id})">\n                            ✏️\n                        </button>\n                        <button class="btn-table delete" onclick="gestionTrajets.deleteTrajet(${trajet.id})">\n                            🗑️\n                        </button>\n                    </div>\n                </td>\n            </tr>\n        `).join('');

        // Mettre à jour les infos et écouter les checkbox
        this.updatePaginationInfo();
        this.setupCheckboxListeners();
    }

    // Ajoute les écouteurs aux checkbox créées dynamiquement
    setupCheckboxListeners() {
        const checkboxes = document.querySelectorAll('.trajet-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const trajetId = parseInt(e.target.value);
                if (e.target.checked) {
                    this.selectedTrajets.add(trajetId);
                } else {
                    this.selectedTrajets.delete(trajetId);
                }
                this.updateBulkActions();
            });
        });
    }

    // Sélection/Désélection de tous les trajets de la page courante
    toggleSelectAll(checked) {
        const startIndex = (this.currentPage - 1) * this.rowsPerPage;
        const endIndex = startIndex + this.rowsPerPage;
        const currentPageTrajets = this.filteredTrajets.slice(startIndex, endIndex);

        if (checked) {
            currentPageTrajets.forEach(trajet => {
                this.selectedTrajets.add(trajet.id);
            });
        } else {
            currentPageTrajets.forEach(trajet => {
                this.selectedTrajets.delete(trajet.id);
            });
        }

        this.renderTable();
        this.updateBulkActions();
    }

    // Met à jour l'affichage des actions groupées et la case "Tout sélectionner"
    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');

        if (bulkActions && selectedCount) {
            if (this.selectedTrajets.size > 0) {
                bulkActions.style.display = 'block';
                selectedCount.textContent = this.selectedTrajets.size;
            } else {
                bulkActions.style.display = 'none';
            }
        }

        // Mettre à jour la case "Tout sélectionner"
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            const startIndex = (this.currentPage - 1) * this.rowsPerPage;
            const endIndex = startIndex + this.rowsPerPage;
            const currentPageTrajets = this.filteredTrajets.slice(startIndex, endIndex);

            const allSelected = currentPageTrajets.length > 0 &&
                              currentPageTrajets.every(trajet => this.selectedTrajets.has(trajet.id));
            selectAll.checked = allSelected;
            selectAll.indeterminate = !allSelected && currentPageTrajets.some(trajet => this.selectedTrajets.has(trajet.id));
        }
    }

    // --- Méthodes implémentées dans la suite (statistiques, pagination, modals, CRUD) ---

    // Met à jour les statistiques rapides (total, actifs, taux d'occupation, revenu)
    updateQuickStats() {
        const totalTrajets = this.trajets.length;
        const trajetsActifs = this.trajets.filter(t => t.statut === 'actif').length;

        // Calcul du taux d'occupation moyen (en pourcentage arrondi)
        const tauxOccupation = this.trajets.length > 0
            ? Math.round(this.trajets.reduce((sum, t) => {
                const occupation = ((t.nombre_places - t.places_disponibles) / t.nombre_places) * 100;
                return sum + occupation;
            }, 0) / this.trajets.length)
            : 0;

        // Calcul du revenu total (nombre de places réservées * prix)
        const revenuTotal = this.trajets.reduce((sum, t) => {
            const reservationsPayees = t.nombre_places - t.places_disponibles;
            return sum + (reservationsPayees * t.prix);
        }, 0);

        // Mise à jour de l'interface (éléments attendus dans le DOM)
        document.getElementById('totalTrajets') && (document.getElementById('totalTrajets').textContent = totalTrajets);
        document.getElementById('trajetsActifs') && (document.getElementById('trajetsActifs').textContent = trajetsActifs);
        document.getElementById('tauxOccupation') && (document.getElementById('tauxOccupation').textContent = `${tauxOccupation}%`);
        document.getElementById('revenuTotal') && (document.getElementById('revenuTotal').textContent = `${this.formatPrice(revenuTotal)} FCFA`);
    }

    // Mise à jour de l'UI de pagination (numéros, prev/next)
    updatePagination() {
        const totalPages = Math.ceil(this.filteredTrajets.length / this.rowsPerPage);
        const paginationNumbers = document.getElementById('paginationNumbers');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (paginationNumbers) {
            paginationNumbers.innerHTML = '';

            // Afficher maximum 5 pages autour de la page courante
            const startPage = Math.max(1, this.currentPage - 2);
            const endPage = Math.min(totalPages, this.currentPage + 2);

            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                    this.goToPage(i);
                });
                paginationNumbers.appendChild(pageBtn);
            }
        }

        // Mettre à jour les boutons précédent/suivant
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        }
    }

    // Met à jour les informations textuelles de pagination (ex : 1-10 sur 45)
    updatePaginationInfo() {
        const startIndex = (this.currentPage - 1) * this.rowsPerPage + 1;
        const endIndex = Math.min(startIndex + this.rowsPerPage - 1, this.filteredTrajets.length);
        const totalItems = this.filteredTrajets.length;

        document.getElementById('startIndex') && (document.getElementById('startIndex').textContent = startIndex);
        document.getElementById('endIndex') && (document.getElementById('endIndex').textContent = endIndex);
        document.getElementById('totalItems') && (document.getElementById('totalItems').textContent = totalItems);
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
        this.updatePagination();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTable();
            this.updatePagination();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredTrajets.length / this.rowsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
            this.updatePagination();
        }
    }

    // Affiche ou cache la zone de filtres
    toggleFilters() {
        const filtersContent = document.getElementById('filtersContent');
        const toggleBtn = document.getElementById('toggleFilters');

        if (filtersContent && toggleBtn) {
            const isVisible = filtersContent.style.display !== 'none';
            filtersContent.style.display = isVisible ? 'none' : 'block';
            toggleBtn.textContent = isVisible ? 'Afficher les filtres' : 'Masquer les filtres';
        }
    }

    // Initialisation du modal d'ajout / édition
    setupTrajetModal() {
        const modal = document.getElementById('trajetModal');
        const closeBtn = document.getElementById('closeTrajetModal');
        const cancelBtn = document.getElementById('cancelTrajetForm');
        const form = document.getElementById('trajetForm');

        // Fermeture du modal par bouton
        [closeBtn, cancelBtn].forEach(btn => {
            btn?.addEventListener('click', () => {
                modal.classList.remove('show');
                form.reset();
            });
        });

        // Soumission du formulaire (create/update)
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTrajet();
        });

        // Fermer en cliquant à l'extérieur
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                form.reset();
            }
        });
    }

    // Initialisation du modal de confirmation (suppression / actions groupées)
    setupConfirmModal() {
        const modal = document.getElementById('confirmModal');
        const closeBtn = document.getElementById('closeConfirmModal');
        const cancelBtn = document.getElementById('cancelConfirm');

        [closeBtn, cancelBtn].forEach(btn => {
            btn?.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }

    // Ouvre le modal en mode ajout
    showAddModal() {
        const modal = document.getElementById('trajetModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('trajetForm');

        if (modal && modalTitle && form) {
            modalTitle.textContent = 'Ajouter un trajet';
            form.reset();
            form.dataset.mode = 'add';
            modal.classList.add('show');

            // Définir la date minimale à aujourd'hui
            const dateInput = document.getElementById('modal-date-depart');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.min = today;
            }
        }
    }

    // Charge en édition depuis l'API puis ouvre le modal
    async editTrajet(trajetId) {
        try {
            const response = await this.api.getTrajet(trajetId);

            if (response.success) {
                this.showEditModal(response.data);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erreur chargement trajet:', error);
            this.showError('Erreur lors du chargement du trajet');
        }
    }

    // Remplit le formulaire d'édition et ouvre le modal
    showEditModal(trajet) {
        const modal = document.getElementById('trajetModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('trajetForm');

        if (modal && modalTitle && form) {
            modalTitle.textContent = 'Modifier le trajet';
            form.dataset.mode = 'edit';
            form.dataset.trajetId = trajet.id;

            // Remplir le formulaire avec les données du trajet
            document.getElementById('modal-ville-depart').value = trajet.ville_depart;
            document.getElementById('modal-ville-arrivee').value = trajet.ville_arrivee;
            document.getElementById('modal-date-depart').value = trajet.date_depart;
            document.getElementById('modal-heure-depart').value = trajet.heure_depart;
            document.getElementById('modal-duree').value = trajet.duree_estimee;
            document.getElementById('modal-prix').value = trajet.prix;
            document.getElementById('modal-places').value = trajet.nombre_places;
            document.getElementById('modal-chauffeur').value = trajet.chauffeur_id;
            document.getElementById('modal-vehicule').value = trajet.vehicule_id;
            document.getElementById('modal-description').value = trajet.description || '';

            modal.classList.add('show');
        }
    }

    // Sauvegarde (create/update) via l'API
    async saveTrajet() {
        const form = document.getElementById('trajetForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const mode = form.dataset.mode;
        const trajetId = form.dataset.trajetId;

        try {
            let response;
            if (mode === 'add') {
                response = await this.api.createTrajet(data);
            } else {
                response = await this.api.updateTrajet(trajetId, data);
            }

            if (response.success) {
                this.showSuccess(`Trajet ${mode === 'add' ? 'créé' : 'modifié'} avec succès`);
                document.getElementById('trajetModal')?.classList.remove('show');
                form.reset();
                this.loadTrajets(); // Recharger la liste
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erreur sauvegarde trajet:', error);
            this.showError(`Erreur lors de la ${mode === 'add' ? 'création' : 'modification'} du trajet`);
        }
    }

    // Ouvre la page détails dans un nouvel onglet
    viewTrajet(trajetId) {
        window.open(`../Trajets/details-trajet.html?id=${trajetId}`, '_blank');
    }

    // Demande de confirmation avant suppression
    deleteTrajet(trajetId) {
        this.showConfirmModal(
            'Supprimer le trajet',
            'Êtes-vous sûr de vouloir supprimer ce trajet ? Cette action est irréversible.',
            () => this.confirmDeleteTrajet(trajetId)
        );
    }

    // Suppression effective via API
    async confirmDeleteTrajet(trajetId) {
        try {
            const response = await this.api.deleteTrajet(trajetId);

            if (response.success) {
                this.showSuccess('Trajet supprimé avec succès');
                this.loadTrajets(); // Recharger la liste
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erreur suppression trajet:', error);
            this.showError('Erreur lors de la suppression du trajet');
        }
    }

    // --- Actions groupées (activate / deactivate / delete) ---
    bulkActivate() {
        this.showConfirmModal(
            'Activer les trajets sélectionnés',
            `Êtes-vous sûr de vouloir activer ${this.selectedTrajets.size} trajet(s) ?`,
            () => this.confirmBulkAction('activate')
        );
    }

    bulkDeactivate() {
        this.showConfirmModal(
            'Désactiver les trajets sélectionnés',
            `Êtes-vous sûr de vouloir désactiver ${this.selectedTrajets.size} trajet(s) ?`,
            () => this.confirmBulkAction('deactivate')
        );
    }

    bulkDelete() {
        this.showConfirmModal(
            'Supprimer les trajets sélectionnés',
            `Êtes-vous sûr de vouloir supprimer ${this.selectedTrajets.size} trajet(s) ? Cette action est irréversible.`,
            () => this.confirmBulkAction('delete')
        );
    }

    async confirmBulkAction(action) {
        const trajetIds = Array.from(this.selectedTrajets);

        try {
            let response;
            switch (action) {
                case 'activate':
                    response = await this.api.bulkActivateTrajets(trajetIds);
                    break;
                case 'deactivate':
                    response = await this.api.bulkDeactivateTrajets(trajetIds);
                    break;
                case 'delete':
                    response = await this.api.bulkDeleteTrajets(trajetIds);
                    break;
            }

            if (response && response.success) {
                this.showSuccess(`Action "${action}" effectuée avec succès sur ${trajetIds.length} trajet(s)`);
                this.selectedTrajets.clear();
                this.updateBulkActions();
                this.loadTrajets(); // Recharger la liste
            } else {
                throw new Error(response ? response.message : 'Réponse invalide API');
            }
        } catch (error) {
            console.error(`Erreur action groupée ${action}:`, error);
            this.showError(`Erreur lors de l'action "${action}" sur les trajets`);
        }
    }

    // Export (par ex. CSV / XLSX) en déclenchant le téléchargement depuis l'URL fournie par l'API
    async exportTrajets() {
        try {
            const response = await this.api.exportTrajets(this.filters);

            if (response.success && response.data && response.data.export_url) {
                // Ouvrir le fichier dans un nouvel onglet / déclencher le téléchargement
                window.open(response.data.export_url, '_blank');
                this.showSuccess('Export généré avec succès');
            } else {
                throw new Error('Erreur lors de la génération de l\'export');
            }
        } catch (error) {
            console.error('Erreur export:', error);
            this.showError('Erreur lors de l\'export des trajets');
        }
    }

    // Affiche une modal de confirmation réutilisable
    showConfirmModal(title, message, confirmCallback) {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmAction');

        if (modal && messageEl && confirmBtn) {
            messageEl.textContent = message;

            // Mettre à jour le callback de confirmation
            confirmBtn.onclick = confirmCallback;

            modal.classList.add('show');
        }
    }

    // --- Section d'auth (vérifie si l'utilisateur est connecté / admin) ---
    setupAuthSection() {
        const authSection = document.getElementById('authSection');
        if (!authSection) return;

        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (isLoggedIn && user.nom) {
            authSection.innerHTML = `
                <div class="user-menu">
                    <button class="user-btn" id="userMenuButton">
                        <span class="user-name">${user.prenom} (Admin)</span>
                        <span class="user-arrow">▼</span>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <a href="../Utilisateurs/profil.html" class="dropdown-item">Mon profil</a>
                        <a href="dashboard.html" class="dropdown-item">Dashboard</a>
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
            // Rediriger vers la connexion si non authentifié (sécurité basique)
            window.location.href = '../Utilisateurs/connexion.html';
        }
    }

    // --- Utilitaires ---
    getStatusText(status) {
        const statusMap = {
            'actif': 'Actif',
            'inactif': 'Inactif',
            'complet': 'Complet',
            'annule': 'Annulé'
        };
        return statusMap[status] || status;
    }

    formatPrice(price) {
        // Formatage local (fr-FR) sans préciser la devise ici
        return new Intl.NumberFormat('fr-FR').format(price);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // --- Notifications utilisateur ---
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

        // Animation d'apparition
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto-fermeture
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

// Initialisation globale de l'instance (accessible depuis le HTML pour les callbacks inline)
const gestionTrajets = new GestionTrajetsManager();

// Remarques pour l'intégration :
// - Copier ce fichier vers : C://wamp64/www/sout/MiabeTrans_Structure_chat/MiabeTrans/frontend/js/gestion-trajet.js
// - Vérifier que MiabeTransAPI est chargé avant ce script (ordre des <script> dans le HTML)
// - Vérifier la présence des éléments DOM mentionnés (ids) dans la page admin correspondante
// - Adapter les clés renvoyées par l'API si le schéma diffère (noms des champs)
