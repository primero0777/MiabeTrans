// ===== GESTION DES TRAJETS ASSIGNÉS =====

class TrajetsAssignes {
    constructor() {
        this.trajets = [];
        this.filtres = {
            date: '',
            statut: 'all',
            vehicule: 'all'
        };
        this.vueActuelle = 'list';
        this.pageActuelle = 1;
        this.trajetsParPage = 10;
        this.statutService = 'hors_service';
        this.moisActuel = new Date();
        
        this.init();
    }

    init() {
        this.chargerTrajets();
        this.initialiserFiltres();
        this.initialiserEvenements();
        this.initialiserCalendrier();
        this.verifierAuthentificationChauffeur();
    }

    // Vérification de l'authentification chauffeur
    verifierAuthentificationChauffeur() {
        const token = localStorage.getItem('miabetrans_token');
        const role = localStorage.getItem('miabetrans_role');
        
        if (!token || role !== 'chauffeur') {
            window.location.href = '../../pages/Utilisateurs/connexion.html';
            return;
        }
    }

    // Initialisation des écouteurs d'événements
    initialiserEvenements() {
        // Boutons d'action
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.chargerTrajets();
        });

        document.getElementById('startServiceBtn').addEventListener('click', () => {
            this.basculerStatutService();
        });

        // Filtres
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.appliquerFiltres();
        });

        document.getElementById('resetFilters').addEventListener('click', () => {
            this.reinitialiserFiltres();
        });

        // Navigation des vues
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changerVue(e.target.dataset.view);
            });
        });

        // Calendrier
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.changerMois(-1);
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.changerMois(1);
        });

        // Carte
        document.getElementById('toggleMap').addEventListener('click', () => {
            this.basculerCarte();
        });

        // Modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.fermerModal();
        });

        document.getElementById('closeDetails').addEventListener('click', () => {
            this.fermerModal();
        });

        document.getElementById('startTripBtn').addEventListener('click', () => {
            this.demarrerTrajet();
        });

        // Clic en dehors du modal
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.fermerModal();
            }
        });

        // État vide
        document.getElementById('checkAvailability').addEventListener('click', () => {
            this.verifierDisponibilites();
        });
    }

    // Initialisation des filtres
    initialiserFiltres() {
        // Date par défaut = aujourd'hui
        const aujourdhui = new Date().toISOString().split('T')[0];
        document.getElementById('filter-date').value = aujourdhui;
        this.filtres.date = aujourdhui;

        // Chargement des véhicules
        this.chargerVehicules();
    }

    // Chargement des véhicules du chauffeur
    async chargerVehicules() {
        try {
            const token = localStorage.getItem('miabetrans_token');
            const response = await fetch('../../api/chauffeurs/mes-vehicules.php', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.mettreAJourSelectVehicules(data.vehicules);
            }
        } catch (error) {
            console.error('Erreur chargement véhicules:', error);
        }
    }

    // Mise à jour du select des véhicules
    mettreAJourSelectVehicules(vehicules) {
        const select = document.getElementById('filter-vehicle');
        select.innerHTML = '<option value="all">Tous les véhicules</option>';
        
        vehicules.forEach(vehicule => {
            const option = document.createElement('option');
            option.value = vehicule.id;
            option.textContent = `${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})`;
            select.appendChild(option);
        });
    }

    // Chargement des trajets
    async chargerTrajets() {
        try {
            this.afficherChargement();
            
            const token = localStorage.getItem('miabetrans_token');
            const params = new URLSearchParams(this.filtres);
            
            const response = await fetch(`../../api/chauffeurs/trajets-assignes.php?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des trajets');
            }

            const data = await response.json();
            this.trajets = data.trajets || [];
            
            this.mettreAJourStatistiques();
            this.afficherTrajets();
            this.mettreAJourStatutService();
            
        } catch (error) {
            console.error('Erreur:', error);
            this.afficherErreur('Impossible de charger vos trajets');
        }
    }

    // Application des filtres
    appliquerFiltres() {
        this.filtres = {
            date: document.getElementById('filter-date').value,
            statut: document.getElementById('filter-status').value,
            vehicule: document.getElementById('filter-vehicle').value
        };
        
        this.pageActuelle = 1;
        this.chargerTrajets();
    }

    // Réinitialisation des filtres
    reinitialiserFiltres() {
        const aujourdhui = new Date().toISOString().split('T')[0];
        document.getElementById('filter-date').value = aujourdhui;
        document.getElementById('filter-status').value = 'all';
        document.getElementById('filter-vehicle').value = 'all';
        
        this.filtres = {
            date: aujourdhui,
            statut: 'all',
            vehicule: 'all'
        };
        
        this.chargerTrajets();
    }

    // Changement de vue (liste/calendrier)
    changerVue(vue) {
        this.vueActuelle = vue;
        
        // Mise à jour des boutons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${vue}"]`).classList.add('active');
        
        // Affichage de la vue
        document.getElementById('listView').classList.remove('active');
        document.getElementById('calendarView').classList.remove('active');
        document.getElementById(`${vue}View`).classList.add('active');
        
        if (vue === 'calendar') {
            this.genererCalendrier();
        }
    }

    // Affichage des trajets
    afficherTrajets() {
        const container = document.getElementById('tripsList');
        const emptyState = document.getElementById('emptyState');
        const pagination = document.getElementById('pagination');

        if (this.trajets.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            pagination.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        emptyState.style.display = 'none';
        pagination.style.display = 'flex';

        const trajetsPage = this.paginerTrajets(this.trajets);
        container.innerHTML = trajetsPage.map(trajet => 
            this.creerCarteTrajet(trajet)
        ).join('');

        this.afficherPagination(this.trajets.length);
        this.ajouterEcouteursCartes();
    }

    // Création d'une carte de trajet
    creerCarteTrajet(trajet) {
        const dateDepart = new Date(trajet.date_depart);
        const dateArrivee = new Date(trajet.date_arrivee);
        
        const statutClass = `status-${trajet.statut}`;
        const statutText = this.getStatutText(trajet.statut);
        
        const isUrgent = new Date(trajet.date_depart) < new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        
        return `
            <div class="trip-card ${trajet.statut} ${isUrgent ? 'urgent' : ''}" data-trip-id="${trajet.id}">
                <div class="trip-header">
                    <div>
                        <div class="trip-id">Trajet #${trajet.numero}</div>
                        <div class="trip-date">${this.formaterDate(dateDepart)}</div>
                    </div>
                    <div class="trip-status ${statutClass}">${statutText}</div>
                </div>
                
                <div class="trip-details">
                    <div class="departure">
                        <div class="city">${trajet.ville_depart}</div>
                        <div class="time">${this.formaterHeure(dateDepart)}</div>
                        <div class="date">Départ</div>
                    </div>
                    
                    <div class="journey-info">
                        <div class="duration">${this.calculerDuree(dateDepart, dateArrivee)}</div>
                        <div class="distance">${trajet.distance} km</div>
                    </div>
                    
                    <div class="arrival">
                        <div class="city">${trajet.ville_arrivee}</div>
                        <div class="time">${this.formaterHeure(dateArrivee)}</div>
                        <div class="date">Arrivée</div>
                    </div>
                </div>
                
                <div class="trip-meta">
                    <div class="passenger-info">
                        <span>👤 ${trajet.nombre_passagers} passager(s)</span>
                    </div>
                    <div class="vehicle-info">
                        <span>🚗 ${trajet.vehicule_marque} ${trajet.vehicule_modele}</span>
                    </div>
                    <div class="trip-actions">
                        ${trajet.statut === 'a_venir' ? `
                            <button class="btn btn-primary btn-sm" onclick="trajetsAssignes.voirDetails(${trajet.id})">
                                Détails
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="trajetsAssignes.demarrerTrajet(${trajet.id})">
                                Démarrer
                            </button>
                        ` : ''}
                        ${trajet.statut === 'en_cours' ? `
                            <button class="btn btn-primary btn-sm" onclick="trajetsAssignes.terminerTrajet(${trajet.id})">
                                Terminer
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Pagination
    paginerTrajets(trajets) {
        const startIndex = (this.pageActuelle - 1) * this.trajetsParPage;
        const endIndex = startIndex + this.trajetsParPage;
        return trajets.slice(startIndex, endIndex);
    }

    // Affichage de la pagination
    afficherPagination(totalTrajets) {
        const totalPages = Math.ceil(totalTrajets / this.trajetsParPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        let html = `
            <button class="pagination-btn" ${this.pageActuelle === 1 ? 'disabled' : ''} 
                onclick="trajetsAssignes.changerPage(${this.pageActuelle - 1})">
                ← Précédent
            </button>
            
            <div class="pagination-pages">
        `;

        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button class="pagination-page ${i === this.pageActuelle ? 'active' : ''}" 
                    onclick="trajetsAssignes.changerPage(${i})">
                    ${i}
                </button>
            `;
        }

        html += `
            </div>
            
            <button class="pagination-btn" ${this.pageActuelle === totalPages ? 'disabled' : ''} 
                onclick="trajetsAssignes.changerPage(${this.pageActuelle + 1})">
                Suivant →
            </button>
        `;

        pagination.innerHTML = html;
    }

    // Changement de page
    changerPage(page) {
        this.pageActuelle = page;
        this.afficherTrajets();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Mise à jour des statistiques
    mettreAJourStatistiques() {
        const aujourdhui = new Date().toISOString().split('T')[0];
        
        // Trajets aujourd'hui
        const trajetsAujourdhui = this.trajets.filter(trajet => 
            trajet.date_depart.startsWith(aujourdhui)
        ).length;
        document.getElementById('totalTrips').textContent = trajetsAujourdhui;
        
        // Autres statistiques (à implémenter avec les vraies données)
        document.getElementById('avgDelay').textContent = '5min';
        document.getElementById('rating').textContent = '4.8';
        document.getElementById('earnings').textContent = '45,000 FCFA';
    }

    // Mise à jour du statut de service
    mettreAJourStatutService() {
        const trajetEnCours = this.trajets.find(trajet => trajet.statut === 'en_cours');
        
        if (trajetEnCours) {
            this.statutService = 'en_trajet';
            document.getElementById('currentTrip').textContent = `#${trajetEnCours.numero}`;
        } else {
            const prochainTrajet = this.trajets.find(trajet => 
                trajet.statut === 'a_venir' && new Date(trajet.date_depart) > new Date()
            );
            
            document.getElementById('currentTrip').textContent = 'Aucun';
            document.getElementById('nextTrip').textContent = prochainTrajet ? `#${prochainTrajet.numero}` : '-';
        }
        
        this.mettreAJourUIStatut();
    }

    // Mise à jour de l'UI du statut
    mettreAJourUIStatut() {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const startServiceBtn = document.getElementById('startServiceBtn');
        
        switch (this.statutService) {
            case 'hors_service':
                statusDot.className = 'status-dot';
                statusText.textContent = 'Hors service';
                startServiceBtn.textContent = '🚗 Démarrer le service';
                startServiceBtn.className = 'btn btn-primary';
                break;
            case 'en_service':
                statusDot.className = 'status-dot active';
                statusText.textContent = 'En service';
                startServiceBtn.textContent = '⏸️ Pause service';
                startServiceBtn.className = 'btn btn-warning';
                break;
            case 'en_trajet':
                statusDot.className = 'status-dot on-trip';
                statusText.textContent = 'En trajet';
                startServiceBtn.textContent = '🚗 Terminer le trajet';
                startServiceBtn.className = 'btn btn-primary';
                break;
        }
    }

    // Basculement du statut de service
    basculerStatutService() {
        if (this.statutService === 'hors_service') {
            this.statutService = 'en_service';
        } else if (this.statutService === 'en_service') {
            this.statutService = 'hors_service';
        }
        // Gérer le cas "en_trajet" différemment
        
        this.mettreAJourUIStatut();
        this.sauvegarderStatutService();
    }

    // Sauvegarde du statut de service
    async sauvegarderStatutService() {
        try {
            const token = localStorage.getItem('miabetrans_token');
            await fetch('../../api/chauffeurs/statut-service.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    statut: this.statutService
                })
            });
        } catch (error) {
            console.error('Erreur sauvegarde statut:', error);
        }
    }

    // Voir les détails d'un trajet
    async voirDetails(trajetId) {
        try {
            const token = localStorage.getItem('miabetrans_token');
            const response = await fetch(`../../api/chauffeurs/trajet-details.php?id=${trajetId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const trajet = await response.json();
                this.afficherModalDetails(trajet);
            }
        } catch (error) {
            console.error('Erreur détails trajet:', error);
            this.afficherErreur('Impossible de charger les détails du trajet');
        }
    }

    // Affichage du modal de détails
    afficherModalDetails(trajet) {
        const modal = document.getElementById('tripDetailsModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = this.genererContenuModal(trajet);
        modal.style.display = 'block';
        
        // Stocker l'ID du trajet pour les actions
        modal.dataset.trajetId = trajet.id;
    }

    // Génération du contenu du modal
    genererContenuModal(trajet) {
        return `
            <div class="trip-details-modal">
                <div class="detail-section">
                    <h4>Informations du trajet</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Numéro:</label>
                            <span>#${trajet.numero}</span>
                        </div>
                        <div class="detail-item">
                            <label>Date:</label>
                            <span>${this.formaterDate(new Date(trajet.date_depart))}</span>
                        </div>
                        <div class="detail-item">
                            <label>Heure départ:</label>
                            <span>${this.formaterHeure(new Date(trajet.date_depart))}</span>
                        </div>
                        <div class="detail-item">
                            <label>Heure arrivée:</label>
                            <span>${this.formaterHeure(new Date(trajet.date_arrivee))}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Itinéraire</h4>
                    <div class="route-info">
                        <div class="route-point">
                            <div class="point-marker start"></div>
                            <div class="point-details">
                                <strong>${trajet.ville_depart}</strong>
                                <div>${trajet.adresse_depart}</div>
                            </div>
                        </div>
                        <div class="route-point">
                            <div class="point-marker end"></div>
                            <div class="point-details">
                                <strong>${trajet.ville_arrivee}</strong>
                                <div>${trajet.adresse_arrivee}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Passagers</h4>
                    <div class="passengers-list">
                        ${trajet.passagers.map(passager => `
                            <div class="passenger-item">
                                <div class="passenger-avatar">👤</div>
                                <div class="passenger-info">
                                    <strong>${passager.nom}</strong>
                                    <div>Téléphone: ${passager.telephone}</div>
                                    <div>Siège: ${passager.siege}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Véhicule</h4>
                    <div class="vehicle-info">
                        <strong>${trajet.vehicule_marque} ${trajet.vehicule_modele}</strong>
                        <div>Immatriculation: ${trajet.vehicule_immatriculation}</div>
                        <div>Places: ${trajet.vehicule_places} passagers</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Fermeture du modal
    fermerModal() {
        document.getElementById('tripDetailsModal').style.display = 'none';
    }

    // Démarrage d'un trajet
    async demarrerTrajet(trajetId) {
        if (!confirm('Êtes-vous sûr de vouloir démarrer ce trajet ?')) {
            return;
        }

        try {
            const token = localStorage.getItem('miabetrans_token');
            const response = await fetch('../../api/chauffeurs/demarrer-trajet.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ trajet_id: trajetId })
            });

            if (response.ok) {
                this.afficherSucces('Trajet démarré avec succès');
                this.fermerModal();
                this.chargerTrajets();
            } else {
                throw new Error('Erreur lors du démarrage du trajet');
            }
        } catch (error) {
            this.afficherErreur('Erreur lors du démarrage du trajet');
        }
    }

    // Terminaison d'un trajet
    async terminerTrajet(trajetId) {
        if (!confirm('Êtes-vous sûr d\'avoir terminé ce trajet ?')) {
            return;
        }

        try {
            const token = localStorage.getItem('miabetrans_token');
            const response = await fetch('../../api/chauffeurs/terminer-trajet.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ trajet_id: trajetId })
            });

            if (response.ok) {
                this.afficherSucces('Trajet terminé avec succès');
                this.chargerTrajets();
            } else {
                throw new Error('Erreur lors de la terminaison du trajet');
            }
        } catch (error) {
            this.afficherErreur('Erreur lors de la terminaison du trajet');
        }
    }

    // Calendrier
    initialiserCalendrier() {
        this.genererCalendrier();
    }

    genererCalendrier() {
        const calendarGrid = document.getElementById('calendarGrid');
        const currentMonth = document.getElementById('currentMonth');
        
        const year = this.moisActuel.getFullYear();
        const month = this.moisActuel.getMonth();
        
        // Mise à jour du titre
        currentMonth.textContent = this.moisActuel.toLocaleDateString('fr-FR', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Premier jour du mois
        const firstDay = new Date(year, month, 1);
        // Dernier jour du mois
        const lastDay = new Date(year, month + 1, 0);
        // Premier jour à afficher (peut être du mois précédent)
        const startDay = new Date(firstDay);
        startDay.setDate(startDay.getDate() - firstDay.getDay());
        
        calendarGrid.innerHTML = '';
        
        // En-têtes des jours
        const joursSemaine = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        joursSemaine.forEach(jour => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = jour;
            calendarGrid.appendChild(dayHeader);
        });
        
        // Jours du calendrier
        const currentDate = new Date(startDay);
        for (let i = 0; i < 42; i++) { // 6 semaines
            const dayElement = document.createElement('button');
            dayElement.className = 'calendar-day';
            dayElement.textContent = currentDate.getDate();
            
            if (currentDate.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            // Vérifier s'il y a des trajets ce jour
            const trajetsDuJour = this.trajets.filter(trajet => {
                const trajetDate = new Date(trajet.date_depart);
                return trajetDate.toDateString() === currentDate.toDateString();
            });
            
            if (trajetsDuJour.length > 0) {
                dayElement.classList.add('has-trips');
                const tripsInfo = document.createElement('div');
                tripsInfo.className = 'day-trips';
                tripsInfo.textContent = `${trajetsDuJour.length} trajet(s)`;
                dayElement.appendChild(tripsInfo);
            }
            
            dayElement.addEventListener('click', () => {
                this.filtrerParDate(currentDate);
            });
            
            calendarGrid.appendChild(dayElement);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    changerMois(delta) {
        this.moisActuel.setMonth(this.moisActuel.getMonth() + delta);
        this.genererCalendrier();
    }

    filtrerParDate(date) {
        document.getElementById('filter-date').value = date.toISOString().split('T')[0];
        this.appliquerFiltres();
    }

    // Basculer l'affichage de la carte
    basculerCarte() {
        const mapContainer = document.getElementById('mapContainer');
        const toggleBtn = document.getElementById('toggleMap');
        
        if (mapContainer.style.display === 'none') {
            mapContainer.style.display = 'block';
            toggleBtn.textContent = 'Masquer la carte';
        } else {
            mapContainer.style.display = 'none';
            toggleBtn.textContent = 'Afficher la carte';
        }
    }

    // Vérifier les disponibilités
    verifierDisponibilites() {
        // Redirection vers la page de disponibilités
        window.location.href = '../Chauffeurs/disponibilites.html';
    }

    // Méthodes utilitaires
    formaterDate(date) {
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formaterHeure(date) {
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    calculerDuree(depart, arrivee) {
        const dureeMs = arrivee - depart;
        const heures = Math.floor(dureeMs / (1000 * 60 * 60));
        const minutes = Math.floor((dureeMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${heures}h${minutes.toString().padStart(2, '0')}`;
    }

    getStatutText(statut) {
        const statuts = {
            'a_venir': 'À venir',
            'en_cours': 'En cours',
            'termine': 'Terminé',
            'annule': 'Annulé'
        };
        return statuts[statut] || statut;
    }

    // Affichage des états
    afficherChargement() {
        const container = document.getElementById('tripsList');
        container.innerHTML = `
            <div class="trip-card loading">
                <div class="skeleton" style="height: 120px; width: 100%;"></div>
            </div>
            <div class="trip-card loading">
                <div class="skeleton" style="height: 120px; width: 100%;"></div>
            </div>
        `;
    }

    afficherErreur(message) {
        this.afficherNotification(message, 'error');
    }

    afficherSucces(message) {
        this.afficherNotification(message, 'success');
    }

    afficherNotification(message, type) {
        // Implémentation basique - à améliorer
        alert(message);
    }

    // Ajout des écouteurs sur les cartes
    ajouterEcouteursCartes() {
        document.querySelectorAll('.trip-card').forEach(carte => {
            carte.addEventListener('click', (e) => {
                if (!e.target.closest('.trip-actions')) {
                    const trajetId = carte.dataset.trajetId;
                    this.voirDetails(trajetId);
                }
            });
        });
    }
}

// Initialisation
let trajetsAssignes;

document.addEventListener('DOMContentLoaded', () => {
    trajetsAssignes = new TrajetsAssignes();
});

// Export pour utilisation globale
window.TrajetsAssignes = TrajetsAssignes;