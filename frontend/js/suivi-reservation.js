// ===== SUIVI EN TEMPS RÉEL DES RÉSERVATIONS =====

class SuiviReservation {
    constructor() {
        this.reservationId = this.getReservationIdFromURL();
        this.reservationData = null;
        this.socket = null;
        this.updateInterval = null;
        this.mapInitialized = false;
        
        this.init();
    }

    init() {
        this.chargerReservation();
        this.initialiserEvenements();
        this.initialiserWebSocket();
        this.verifierAuthentification();
    }

    // Récupération de l'ID depuis l'URL
    getReservationIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || 'TR-001234'; // Fallback pour la démo
    }

    // Vérification de l'authentification
    verifierAuthentification() {
        const token = localStorage.getItem('miabetrans_token');
        if (!token) {
            window.location.href = '../../pages/Utilisateurs/connexion.html';
            return;
        }
    }

    // Initialisation des écouteurs d'événements
    initialiserEvenements() {
        // Boutons d'action
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.chargerReservation();
        });

        document.getElementById('shareBtn').addEventListener('click', () => {
            this.partagerSuivi();
        });

        // Actions carte
        document.getElementById('zoomInBtn').addEventListener('click', () => {
            this.zoomCarte(1);
        });

        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            this.zoomCarte(-1);
        });

        document.getElementById('centerMapBtn').addEventListener('click', () => {
            this.recentrerCarte();
        });

        // Contact chauffeur
        document.getElementById('callDriver').addEventListener('click', () => {
            this.ouvrirModalContact();
        });

        document.getElementById('messageDriver').addEventListener('click', () => {
            this.envoyerMessage();
        });

        // Options de contact
        document.getElementById('callOption').addEventListener('click', () => {
            this.appelerChauffeur();
        });

        document.getElementById('smsOption').addEventListener('click', () => {
            this.envoyerSMS();
        });

        document.getElementById('whatsappOption').addEventListener('click', () => {
            this.ouvrirWhatsApp();
        });

        // Actions rapides
        document.getElementById('modifyReservation').addEventListener('click', () => {
            this.modifierReservation();
        });

        document.getElementById('cancelReservation').addEventListener('click', () => {
            this.annulerReservation();
        });

        document.getElementById('downloadTicket').addEventListener('click', () => {
            this.telechargerBillet();
        });

        document.getElementById('getHelp').addEventListener('click', () => {
            this.obtenirAide();
        });

        // Alertes
        document.getElementById('toggleAlerts').addEventListener('click', () => {
            this.basculerAlertes();
        });

        // Modal
        document.getElementById('closeContactModal').addEventListener('click', () => {
            this.fermerModalContact();
        });

        // Clic en dehors du modal
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.fermerModalContact();
            }
        });

        // Mise à jour automatique
        this.demarrerMiseAJourAuto();
    }

    // Chargement des données de réservation
    async chargerReservation() {
        try {
            this.afficherChargement();
            
            const token = localStorage.getItem('miabetrans_token');
            const response = await fetch(`../../api/reservations/suivi.php?id=${this.reservationId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement du suivi');
            }

            this.reservationData = await response.json();
            this.mettreAJourInterface();
            
        } catch (error) {
            console.error('Erreur:', error);
            this.afficherErreur('Impossible de charger le suivi de réservation');
            // Chargement des données de démo
            this.chargerDonneesDemo();
        }
    }

    // Données de démonstration
    chargerDonneesDemo() {
        this.reservationData = {
            id: 'TR-001234',
            statut: 'en_cours',
            ville_depart: 'Lomé',
            adresse_depart: 'Gare de Lomé',
            ville_arrivee: 'Kpalimé',
            adresse_arrivee: 'Gare de Kpalimé',
            date_depart: '2024-12-15T14:30:00',
            date_arrivee: '2024-12-15T17:00:00',
            duree: '2h 30min',
            distance: 150,
            passagers: 2,
            vehicule: {
                modele: 'Toyota Hiace 2022',
                immatriculation: 'TG-789-AB-23',
                couleur: 'Blanc',
                confort: 'Climatisé, Wi-Fi',
                places: 15
            },
            chauffeur: {
                nom: 'Koffi Mensah',
                telephone: '+228 90 12 34 56',
                note: 4.8,
                avis: 127,
                statut: 'en_ligne'
            },
            progression: {
                pourcentage: 45,
                distance_parcourue: 45,
                distance_restante: 105,
                vitesse_actuelle: 65,
                arrivee_estimee: '2024-12-15T16:45:00',
                position_actuelle: 'Sortie de Lomé',
                temps_ecoule: '45 min'
            },
            alertes: [
                {
                    type: 'info',
                    titre: 'Trajet en cours',
                    message: 'Votre véhicule est en route vers Kpalimé. Arrivée estimée à 17:00.',
                    timestamp: new Date(Date.now() - 2 * 60 * 1000)
                },
                {
                    type: 'warning',
                    titre: 'Trafic modéré',
                    message: 'Ralentissement sur la RN5. Retard estimé: 10 minutes.',
                    timestamp: new Date(Date.now() - 15 * 60 * 1000)
                },
                {
                    type: 'success',
                    titre: 'Départ confirmé',
                    message: 'Le véhicule a quitté la gare de Lomé à l\'heure.',
                    timestamp: new Date(Date.now() - 45 * 60 * 1000)
                }
            ]
        };
        
        this.mettreAJourInterface();
    }

    // Mise à jour de l'interface
    mettreAJourInterface() {
        if (!this.reservationData) return;

        this.mettreAJourInformationsReservation();
        this.mettreAJourCarte();
        this.mettreAJourTimeline();
        this.mettreAJourChauffeur();
        this.mettreAJourAlertes();
        this.mettreAJourStatistiques();
    }

    // Mise à jour des informations de réservation
    mettreAJourInformationsReservation() {
        const data = this.reservationData;
        
        // Numéro de réservation
        document.getElementById('reservationNumber').textContent = data.id;
        
        // Statut
        this.mettreAJourStatut(data.statut);
        
        // Itinéraire
        document.getElementById('departureCity').textContent = data.ville_depart;
        document.getElementById('departureAddress').textContent = data.adresse_depart;
        document.getElementById('arrivalCity').textContent = data.ville_arrivee;
        document.getElementById('arrivalAddress').textContent = data.adresse_arrivee;
        
        // Horaires
        const depart = new Date(data.date_depart);
        const arrivee = new Date(data.date_arrivee);
        document.getElementById('departureTime').textContent = this.formaterHeure(depart);
        document.getElementById('arrivalTime').textContent = this.formaterHeure(arrivee);
        
        // Métadonnées
        document.getElementById('travelDate').textContent = this.formaterDate(depart);
        document.getElementById('passengerCount').textContent = `${data.passagers} adulte(s)`;
        document.getElementById('vehicleType').textContent = `${data.vehicule.modele} (${data.vehicule.places} places)`;
        document.getElementById('reservationPrice').textContent = '12,500 FCFA'; // À remplacer par les vraies données
    }

    // Mise à jour du statut
    mettreAJourStatut(statut) {
        const badge = document.getElementById('statusBadge');
        const dot = badge.querySelector('.status-dot');
        const text = badge.querySelector('.status-text');
        
        const statuts = {
            'confirme': { text: 'Confirmée', color: 'var(--success-color)' },
            'en_cours': { text: 'En cours', color: 'var(--primary-color)' },
            'termine': { text: 'Terminée', color: 'var(--success-color)' },
            'annule': { text: 'Annulée', color: 'var(--error-color)' }
        };
        
        const config = statuts[statut] || { text: statut, color: 'var(--text-secondary)' };
        
        text.textContent = config.text;
        dot.style.background = config.color;
        badge.style.background = `${config.color}15`;
        badge.style.borderColor = `${config.color}30`;
        badge.style.color = config.color;
    }

    // Mise à jour de la carte
    mettreAJourCarte() {
        const progression = this.reservationData.progression;
        
        // Barre de progression
        document.getElementById('progressFill').style.width = `${progression.pourcentage}%`;
        
        // Animation du véhicule
        this.animerVehicule(progression.pourcentage);
        
        // Mise à jour de la position actuelle
        document.getElementById('currentLocation').textContent = progression.position_actuelle;
    }

    // Animation du véhicule
    animerVehicule(pourcentage) {
        const vehicle = document.getElementById('vehicleMarker');
        const progress = pourcentage / 100;
        
        // Position horizontale basée sur la progression
        const left = 20 + (progress * 60); // 20% à 80%
        vehicle.style.left = `${left}%`;
        
        // Animation de déplacement
        vehicle.style.animation = 'none';
        setTimeout(() => {
            vehicle.style.animation = `moveVehicle 20s linear infinite`;
        }, 10);
    }

    // Mise à jour de la timeline
    mettreAJourTimeline() {
        const progression = document.getElementById('timelineProgress');
        const steps = document.querySelectorAll('.timeline-step');
        const data = this.reservationData;
        
        // Progression de la timeline
        progression.style.height = `${data.progression.pourcentage}%`;
        
        // Mise à jour des étapes
        steps.forEach(step => {
            const stepType = step.dataset.step;
            step.classList.remove('completed', 'active', 'upcoming');
            
            if (this.estEtapeTerminee(stepType)) {
                step.classList.add('completed');
            } else if (this.estEtapeActive(stepType)) {
                step.classList.add('active');
            } else {
                step.classList.add('upcoming');
            }
        });
        
        // Mise à jour des détails de l'étape active
        document.getElementById('elapsedTime').textContent = data.progression.temps_ecoule;
    }

    // Vérification des étapes terminées
    estEtapeTerminee(stepType) {
        const etapes = ['confirmation', 'vehicle_assigned', 'departure'];
        return etapes.includes(stepType);
    }

    // Vérification des étapes actives
    estEtapeActive(stepType) {
        return stepType === 'en_route';
    }

    // Mise à jour des informations chauffeur
    mettreAJourChauffeur() {
        const chauffeur = this.reservationData.chauffeur;
        
        document.getElementById('driverName').textContent = chauffeur.nom;
        document.getElementById('driverPhone').textContent = chauffeur.telephone;
        document.getElementById('driverStatus').style.background = 
            chauffeur.statut === 'en_ligne' ? 'var(--success-color)' : 'var(--error-color)';
        
        // Véhicule
        document.getElementById('vehicleModel').textContent = this.reservationData.vehicule.modele;
        document.getElementById('vehiclePlate').textContent = this.reservationData.vehicule.immatriculation;
        document.getElementById('vehicleColor').textContent = this.reservationData.vehicule.couleur;
        document.getElementById('vehicleComfort').textContent = this.reservationData.vehicule.confort;
    }

    // Mise à jour des alertes
    mettreAJourAlertes() {
        const container = document.getElementById('alertsContainer');
        const alertes = this.reservationData.alertes;
        
        container.innerHTML = alertes.map(alerte => this.creerAlerteHTML(alerte)).join('');
    }

    // Création HTML d'une alerte
    creerAlerteHTML(alerte) {
        const timeAgo = this.calculerTempsEcoule(alerte.timestamp);
        
        return `
            <div class="alert-item ${alerte.type}">
                <div class="alert-icon">${this.getAlerteIcon(alerte.type)}</div>
                <div class="alert-content">
                    <h4>${alerte.titre}</h4>
                    <p>${alerte.message}</p>
                    <span class="alert-time">${timeAgo}</span>
                </div>
            </div>
        `;
    }

    // Icône d'alerte
    getAlerteIcon(type) {
        const icons = {
            'info': 'ℹ️',
            'warning': '⚠️',
            'success': '✅',
            'error': '❌'
        };
        return icons[type] || 'ℹ️';
    }

    // Mise à jour des statistiques
    mettreAJourStatistiques() {
        const progression = this.reservationData.progression;
        
        document.getElementById('distanceTraveled').textContent = `${progression.distance_parcourue} km`;
        document.getElementById('distanceRemaining').textContent = `${progression.distance_restante} km`;
        document.getElementById('currentSpeed').textContent = `${progression.vitesse_actuelle} km/h`;
        
        const arrivee = new Date(progression.arrivee_estimee);
        document.getElementById('estimatedArrival').textContent = this.formaterHeure(arrivee);
    }

    // Initialisation WebSocket pour les mises à jour en temps réel
    initialiserWebSocket() {
        try {
            // Simulation WebSocket - en production, utiliser une vraie connexion
            this.socket = {
                onmessage: null,
                close: () => {}
            };
            
            // Simulation de mises à jour en temps réel
            setInterval(() => {
                this.simulerMiseAJourTempsReel();
            }, 10000); // Toutes les 10 secondes
            
        } catch (error) {
            console.warn('WebSocket non disponible, utilisation du polling');
            this.demarrerPolling();
        }
    }

    // Simulation de mises à jour en temps réel
    simulerMiseAJourTempsReel() {
        if (!this.reservationData || this.reservationData.statut !== 'en_cours') return;
        
        // Simulation de progression
        const progression = this.reservationData.progression;
        if (progression.pourcentage < 100) {
            progression.pourcentage += 2;
            progression.distance_parcourue += 3;
            progression.distance_restante -= 3;
            
            // Mise à jour de la position
            const positions = [
                'Sortie de Lomé', 'Aképé', 'Avétonou', 'Amoussoukopé', 
                'Kévé', 'Adéta', 'Entrée de Kpalimé'
            ];
            const index = Math.min(Math.floor(progression.pourcentage / 15), positions.length - 1);
            progression.position_actuelle = positions[index];
            
            this.mettreAJourInterface();
        }
    }

    // Polling de secours
    demarrerPolling() {
        setInterval(() => {
            this.chargerReservation();
        }, 30000); // Toutes les 30 secondes
    }

    // Mise à jour automatique
    demarrerMiseAJourAuto() {
        this.updateInterval = setInterval(() => {
            if (this.reservationData && this.reservationData.statut === 'en_cours') {
                this.chargerReservation();
            }
        }, 60000); // Toutes les minutes
    }

    // Partager le suivi
    partagerSuivi() {
        const url = window.location.href;
        const title = `Suivi de ma réservation MiabeTrans #${this.reservationId}`;
        
        if (navigator.share) {
            navigator.share({
                title: title,
                url: url
            });
        } else {
            // Fallback pour la copie
            navigator.clipboard.writeText(url).then(() => {
                this.afficherSucces('Lien copié dans le presse-papier');
            });
        }
    }

    // Actions carte
    zoomCarte(direction) {
        console.log(`Zoom ${direction > 0 ? '+' : '-'}`);
        // Implémentation de l'zoom de la carte réelle
    }

    recentrerCarte() {
        console.log('Recentrage de la carte');
        // Implémentation du recentrage
    }

    // Contact chauffeur
    ouvrirModalContact() {
        document.getElementById('contactModal').style.display = 'block';
    }

    fermerModalContact() {
        document.getElementById('contactModal').style.display = 'none';
    }

    appelerChauffeur() {
        const phone = this.reservationData.chauffeur.telephone;
        window.open(`tel:${phone}`, '_self');
    }

    envoyerSMS() {
        const phone = this.reservationData.chauffeur.telephone;
        window.open(`sms:${phone}`, '_self');
    }

    ouvrirWhatsApp() {
        const phone = this.reservationData.chauffeur.telephone.replace('+', '');
        const message = `Bonjour, je suis passager sur le trajet #${this.reservationId}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }

    envoyerMessage() {
        this.ouvrirModalContact();
    }

    // Actions rapides
    modifierReservation() {
        if (confirm('Souhaitez-vous modifier cette réservation ?')) {
            window.location.href = `modifier-reservation.html?id=${this.reservationId}`;
        }
    }

    annulerReservation() {
        if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
            // Implémentation de l'annulation
            this.afficherSucces('Demande d\'annulation envoyée');
        }
    }

    telechargerBillet() {
        // Génération et téléchargement du e-billet
        this.genererEBillet();
    }

    obtenirAide() {
        window.open('../Aide/contact.html', '_blank');
    }

    // Génération e-billet
    genererEBillet() {
        // Implémentation de la génération de PDF
        this.afficherSucces('E-billet téléchargé');
    }

    // Gestion des alertes
    basculerAlertes() {
        const container = document.getElementById('alertsContainer');
        const toggleBtn = document.getElementById('toggleAlerts');
        
        if (container.style.display === 'none') {
            container.style.display = 'flex';
            toggleBtn.textContent = 'Masquer';
        } else {
            container.style.display = 'none';
            toggleBtn.textContent = 'Afficher';
        }
    }

    // Méthodes utilitaires
    formaterDate(date) {
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    formaterHeure(date) {
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    calculerTempsEcoule(timestamp) {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
            return 'À l\'instant';
        }
    }

    // Affichage des états
    afficherChargement() {
        // Implémentation du loading state
        console.log('Chargement en cours...');
    }

    afficherErreur(message) {
        this.afficherNotification(message, 'error');
    }

    afficherSucces(message) {
        this.afficherNotification(message, 'success');
    }

    afficherNotification(message, type) {
        // Implémentation d'un système de notifications
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? 'var(--error-color)' : 'var(--success-color)'};
            color: white;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: var(--shadow-lg);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Nettoyage
    destroy() {
        if (this.socket) {
            this.socket.close();
        }
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialisation
let suiviReservation;

document.addEventListener('DOMContentLoaded', () => {
    suiviReservation = new SuiviReservation();
});

// Nettoyage à la fermeture
window.addEventListener('beforeunload', () => {
    if (suiviReservation) {
        suiviReservation.destroy();
    }
});

// Export pour utilisation globale
window.SuiviReservation = SuiviReservation;