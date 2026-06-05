// Gestion des réservations - ES6+
class ReservationManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.currentStep = 1;
        this.selectedTrajet = null;
        this.reservationData = {};
        this.init();
    }

    init() {
        this.loadTrajetDetails();
        this.setupEventListeners();
        this.setupAuthSection();
        this.calculatePrice();
    }

    async loadTrajetDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const trajetId = urlParams.get('trajet');

        if (!trajetId) {
            this.showError('Aucun trajet sélectionné');
            return;
        }

        try {
            const response = await this.api.getTrajet(trajetId);
            
            if (response.success) {
                this.selectedTrajet = response.data;
                this.displayTrajetSummary();
                this.updateSidebarSummary();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erreur chargement trajet:', error);
            this.showError('Erreur lors du chargement du trajet');
        }
    }

    displayTrajetSummary() {
        const trajetSummary = document.getElementById('trajetSummary');
        if (!trajetSummary || !this.selectedTrajet) return;

        const trajet = this.selectedTrajet;
        
        trajetSummary.innerHTML = `
            <div class="trajet-route">
                ${trajet.ville_depart} → ${trajet.ville_arrivee}
            </div>
            <div class="trajet-details">
                <div class="trajet-detail">
                    <span class="detail-label">📅 Date:</span>
                    <span class="detail-value">${this.formatDate(trajet.date_depart)}</span>
                </div>
                <div class="trajet-detail">
                    <span class="detail-label">⏰ Heure:</span>
                    <span class="detail-value">${trajet.heure_depart}</span>
                </div>
                <div class="trajet-detail">
                    <span class="detail-label">⏱️ Durée:</span>
                    <span class="detail-value">${trajet.duree_estimee || 'Non spécifiée'}</span>
                </div>
                <div class="trajet-detail">
                    <span class="detail-label">💰 Prix:</span>
                    <span class="detail-value">${this.formatPrice(trajet.prix)} FCFA</span>
                </div>
            </div>
            <div class="trajet-availability">
                <span class="detail-label">🚌 Places disponibles:</span>
                <span class="detail-value ${trajet.places_disponibles < 10 ? 'low-availability' : ''}">
                    ${trajet.places_disponibles} place(s)
                </span>
            </div>
        `;

        // Mettre à jour le sélecteur de places
        this.updatePlacesSelector(trajet.places_disponibles);
    }

    updatePlacesSelector(maxPlaces) {
        const placesSelect = document.getElementById('nombre_places');
        if (!placesSelect) return;

        // Vider les options existantes
        placesSelect.innerHTML = '';

        // Ajouter les options disponibles
        const availablePlaces = Math.min(maxPlaces, 5);
        for (let i = 1; i <= availablePlaces; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i} place${i > 1 ? 's' : ''}`;
            placesSelect.appendChild(option);
        }

        if (availablePlaces === 0) {
            const option = document.createElement('option');
            option.value = '0';
            option.textContent = 'Complet';
            option.disabled = true;
            placesSelect.appendChild(option);
            placesSelect.disabled = true;
        }
    }

    setupEventListeners() {
        // Calcul du prix en temps réel
        const placesSelect = document.getElementById('nombre_places');
        if (placesSelect) {
            placesSelect.addEventListener('change', () => {
                this.calculatePrice();
            });
        }

        // Validation des formulaires
        this.setupFormValidation();
    }

    calculatePrice() {
        if (!this.selectedTrajet) return;

        const placesSelect = document.getElementById('nombre_places');
        const nombrePlaces = parseInt(placesSelect?.value) || 1;
        const prixUnitaire = this.selectedTrajet.prix;
        const prixTotal = prixUnitaire * nombrePlaces;

        // Mettre à jour l'affichage
        document.getElementById('prixUnitaire').textContent = `${this.formatPrice(prixUnitaire)} FCFA`;
        document.getElementById('nbPlaces').textContent = nombrePlaces;
        document.getElementById('prixTotal').textContent = `${this.formatPrice(prixTotal)} FCFA`;

        // Mettre à jour les données de réservation
        this.reservationData.nombre_places = nombrePlaces;
        this.reservationData.prix_total = prixTotal;
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

    nextStep(step) {
        // Valider l'étape actuelle
        if (!this.validateStep(this.currentStep)) {
            return;
        }

        // Sauvegarder les données de l'étape
        this.saveStepData(this.currentStep);

        // Passer à l'étape suivante
        this.showStep(step);
    }

    previousStep(step) {
        this.showStep(step);
    }

    showStep(step) {
        // Masquer toutes les étapes
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
        });

        document.querySelectorAll('.step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });

        // Afficher l'étape demandée
        const stepContent = document.getElementById(`step${step}`);
        const stepIndicator = document.querySelector(`.step[data-step="${step}"]`);

        if (stepContent && stepIndicator) {
            stepContent.classList.add('active');
            stepIndicator.classList.add('active');
            this.currentStep = step;
        }

        // Mettre à jour le sidebar
        this.updateSidebarSummary();

        // Charger les données utilisateur si nécessaire
        if (step === 2) {
            this.loadUserData();
        }

        // Traiter la confirmation si étape 3
        if (step === 3) {
            this.processReservation();
        }
    }

    validateStep(step) {
        switch(step) {
            case 1:
                return this.validateStep1();
            case 2:
                return this.validateStep2();
            default:
                return true;
        }
    }

    validateStep1() {
        const placesSelect = document.getElementById('nombre_places');
        if (!placesSelect || parseInt(placesSelect.value) === 0) {
            this.showError('Veuillez sélectionner un nombre de places valide');
            return false;
        }
        return true;
    }

    validateStep2() {
        const requiredFields = ['nom', 'prenom', 'email', 'telephone'];
        let isValid = true;

        requiredFields.forEach(field => {
            const input = document.getElementById(field);
            if (!input || !input.value.trim()) {
                this.showFieldError(field, 'Ce champ est obligatoire');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        // Validation email
        const email = document.getElementById('email');
        if (email && email.value && !this.isValidEmail(email.value)) {
            this.showFieldError('email', 'Format email invalide');
            isValid = false;
        }

        // Validation téléphone
        const telephone = document.getElementById('telephone');
        if (telephone && telephone.value && !this.isValidPhone(telephone.value)) {
            this.showFieldError('telephone', 'Numéro de téléphone invalide');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^(\+228|00228)?[0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
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

    clearFieldError(fieldName) {
        const field = document.getElementById(fieldName);
        if (field) {
            field.classList.remove('invalid');
            const errorElement = field.parentNode.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        }
    }

    saveStepData(step) {
        switch(step) {
            case 1:
                const form1 = document.getElementById('reservationFormStep1');
                if (form1) {
                    const formData = new FormData(form1);
                    this.reservationData.moyen_paiement = formData.get('moyen_paiement');
                }
                break;
                
            case 2:
                const form2 = document.getElementById('reservationFormStep2');
                if (form2) {
                    const formData = new FormData(form2);
                    this.reservationData.nom = formData.get('nom');
                    this.reservationData.prenom = formData.get('prenom');
                    this.reservationData.email = formData.get('email');
                    this.reservationData.telephone = formData.get('telephone');
                    this.reservationData.notes = formData.get('notes');
                }
                break;
        }
    }

    loadUserData() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (user.nom) {
            document.getElementById('nom').value = user.nom || '';
            document.getElementById('prenom').value = user.prenom || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('telephone').value = user.telephone || '';
        }
    }

    async processReservation() {
        if (!this.selectedTrajet) {
            this.showError('Aucun trajet sélectionné');
            return;
        }

        try {
            const reservationPayload = {
                trajet_id: this.selectedTrajet.id,
                nombre_places: this.reservationData.nombre_places,
                moyen_paiement: this.reservationData.moyen_paiement
            };

            const response = await this.api.createReservation(reservationPayload);

            if (response.success) {
                this.displayConfirmation(response.data);
            } else {
                throw new Error(response.message);
            }

        } catch (error) {
            console.error('Erreur réservation:', error);
            this.showError('Erreur lors de la réservation: ' + error.message);
            this.showStep(1); // Revenir à l'étape 1 en cas d'erreur
        }
    }

    displayConfirmation(reservationData) {
        const confirmationDetails = document.getElementById('confirmationDetails');
        if (!confirmationDetails) return;

        confirmationDetails.innerHTML = `
            <div class="confirmation-item">
                <strong>Référence:</strong> ${reservationData.reference}
            </div>
            <div class="confirmation-item">
                <strong>Trajet:</strong> ${this.selectedTrajet.ville_depart} → ${this.selectedTrajet.ville_arrivee}
            </div>
            <div class="confirmation-item">
                <strong>Date:</strong> ${this.formatDate(this.selectedTrajet.date_depart)} à ${this.selectedTrajet.heure_depart}
            </div>
            <div class="confirmation-item">
                <strong>Passagers:</strong> ${this.reservationData.nombre_places} place(s)
            </div>
            <div class="confirmation-item">
                <strong>Total:</strong> ${this.formatPrice(reservationData.prix_total)} FCFA
            </div>
            <div class="confirmation-item">
                <strong>Statut:</strong> <span class="status-confirmed">Confirmée</span>
            </div>
        `;

        // Stocker les données pour le téléchargement
        this.reservationData.reference = reservationData.reference;
        this.reservationData.id = reservationData.reservation_id;
    }

    updateSidebarSummary() {
        const sidebarSummary = document.getElementById('sidebarSummary');
        if (!sidebarSummary || !this.selectedTrajet) return;

        let summaryHTML = '';

        if (this.currentStep >= 1) {
            summaryHTML += `
                <div class="summary-item">
                    <span>Trajet:</span>
                    <span>${this.selectedTrajet.ville_depart} → ${this.selectedTrajet.ville_arrivee}</span>
                </div>
                <div class="summary-item">
                    <span>Date:</span>
                    <span>${this.formatDate(this.selectedTrajet.date_depart)}</span>
                </div>
                <div class="summary-item">
                    <span>Heure:</span>
                    <span>${this.selectedTrajet.heure_depart}</span>
                </div>
            `;
        }

        if (this.currentStep >= 2 && this.reservationData.nombre_places) {
            summaryHTML += `
                <div class="summary-item">
                    <span>Passagers:</span>
                    <span>${this.reservationData.nombre_places}</span>
                </div>
                <div class="summary-item">
                    <span>Paiement:</span>
                    <span>${this.getPaymentMethodLabel(this.reservationData.moyen_paiement)}</span>
                </div>
            `;
        }

        if (this.reservationData.prix_total) {
            summaryHTML += `
                <div class="summary-item total">
                    <span>Total:</span>
                    <span>${this.formatPrice(this.reservationData.prix_total)} FCFA</span>
                </div>
            `;
        }

        sidebarSummary.innerHTML = summaryHTML;
    }

    getPaymentMethodLabel(method) {
        const methods = {
            'especes': 'Espèces',
            'flooz': 'Flooz Money',
            'tmoney': 'T-Money'
        };
        return methods[method] || method;
    }

    downloadTicket() {
        if (!this.reservationData.id) {
            this.showError('Aucune réservation à télécharger');
            return;
        }

        // Générer un ticket PDF (simulation)
        const ticketContent = `
            TICKET DE RÉSERVATION MIABETRANS
            ================================
            
            Référence: ${this.reservationData.reference}
            Date d'émission: ${new Date().toLocaleDateString('fr-FR')}
            
            DÉTAILS DU TRAJET:
            - Départ: ${this.selectedTrajet.ville_depart}
            - Arrivée: ${this.selectedTrajet.ville_arrivee}
            - Date: ${this.formatDate(this.selectedTrajet.date_depart)}
            - Heure: ${this.selectedTrajet.heure_depart}
            
            INFORMATIONS PASSAGER:
            - Nom: ${this.reservationData.nom} ${this.reservationData.prenom}
            - Places: ${this.reservationData.nombre_places}
            - Total: ${this.formatPrice(this.reservationData.prix_total)} FCFA
            
            INSTRUCTIONS:
            - Présentez ce ticket au chauffeur avant le départ
            - Arrivez 15 minutes avant l'heure de départ
            - Gardez une pièce d'identité avec vous
            
            Merci de voyager avec MiabeTrans!
        `;

        const blob = new Blob([ticketContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${this.reservationData.reference}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
            authSection.innerHTML = `
                <a href="../Utilisateurs/connexion.html" class="nav-link btn-login">
                    Connexion
                </a>
            `;
        }
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
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    this.showFieldError(field.id, 'Format email invalide');
                    return false;
                }
                break;
                
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

    showError(message) {
        // Implémentation simple d'affichage d'erreur
        alert(message);
    }
}

// Initialisation
const reservationManager = new ReservationManager();