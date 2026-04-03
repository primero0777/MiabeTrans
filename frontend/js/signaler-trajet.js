// ===== GESTION DES SIGNALEMENTS D'INCIDENT =====

class SignalerTrajet {
    constructor() {
        this.trajets = [];
        this.categorieSelectionnee = null;
        this.trajetSelectionne = null;
        this.fichiers = [];
        this.brouillonSauvegarde = null;
        
        this.init();
    }

    init() {
        this.chargerTrajets();
        this.initialiserEvenements();
        this.chargerBrouillon();
        this.chargerHistorique();
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
        document.getElementById('emergencyBtn').addEventListener('click', () => {
            this.ouvrirModalUrgence();
        });

        document.getElementById('quickReportBtn').addEventListener('click', () => {
            this.rapportRapide();
        });

        // Sélection de trajet
        document.getElementById('tripSelect').addEventListener('change', (e) => {
            this.selectionnerTrajet(e.target.value);
        });

        // Catégories d'incident
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectionnerCategorie(card.dataset.category);
            });
        });

        // Compteur de caractères
        document.getElementById('incidentDescription').addEventListener('input', (e) => {
            this.mettreAJourCompteurCaracteres(e.target.value);
        });

        // Upload de fichiers
        this.initialiserUploadFichiers();

        // Localisation
        document.getElementById('getLocationBtn').addEventListener('click', () => {
            this.obtenirLocalisation();
        });

        // Actions du formulaire
        document.getElementById('saveDraftBtn').addEventListener('click', () => {
            this.sauvegarderBrouillon();
        });

        document.getElementById('incidentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.envoyerSignalement();
        });

        // Assistance
        document.getElementById('callEmergency').addEventListener('click', () => {
            this.appelerUrgences();
        });

        document.getElementById('callSupport').addEventListener('click', () => {
            this.appelerSupport();
        });

        // Modals
        document.getElementById('closeConfirmationModal').addEventListener('click', () => {
            this.fermerModalConfirmation();
        });

        document.getElementById('closeEmergencyModal').addEventListener('click', () => {
            this.fermerModalUrgence();
        });

        document.getElementById('confirmEmergency').addEventListener('click', () => {
            this.confirmerUrgence();
        });

        document.getElementById('contactSupportEmergency').addEventListener('click', () => {
            this.contacterSupportUrgence();
        });

        document.getElementById('newReportBtn').addEventListener('click', () => {
            this.nouveauSignalement();
        });

        document.getElementById('viewReportBtn').addEventListener('click', () => {
            this.voirSignalement();
        });

        // Historique
        document.getElementById('viewAllReports').addEventListener('click', () => {
            this.voirTousSignalements();
        });

        // Clic en dehors des modals
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.fermerModalConfirmation();
                this.fermerModalUrgence();
            }
        });
    }

    // Chargement des trajets du chauffeur
    async chargerTrajets() {
        try {
            const token = localStorage.getItem('miabetrans_token');
            const response = await fetch('../../api/chauffeurs/trajets-actifs.php', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.trajets = data.trajets || [];
                this.mettreAJourSelectTrajets();
            } else {
                // Données de démonstration
                this.chargerTrajetsDemo();
            }
        } catch (error) {
            console.error('Erreur chargement trajets:', error);
            this.chargerTrajetsDemo();
        }
    }

    // Données de démonstration pour les trajets
    chargerTrajetsDemo() {
        this.trajets = [
            {
                id: 'TR-001234',
                ville_depart: 'Lomé',
                ville_arrivee: 'Kpalimé',
                date_depart: '2024-12-15T14:30:00',
                date_arrivee: '2024-12-15T17:00:00',
                passagers: 12,
                statut: 'en_cours'
            },
            {
                id: 'TR-001235',
                ville_depart: 'Lomé',
                ville_arrivee: 'Sokodé',
                date_depart: '2024-12-15T18:00:00',
                date_arrivee: '2024-12-15T22:30:00',
                passagers: 8,
                statut: 'a_venir'
            }
        ];
        this.mettreAJourSelectTrajets();
    }

    // Mise à jour du select des trajets
    mettreAJourSelectTrajets() {
        const select = document.getElementById('tripSelect');
        select.innerHTML = '<option value="">Choisir un trajet...</option>';
        
        this.trajets.forEach(trajet => {
            const option = document.createElement('option');
            option.value = trajet.id;
            option.textContent = `#${trajet.id} - ${trajet.ville_depart} → ${trajet.ville_arrivee}`;
            select.appendChild(option);
        });
    }

    // Sélection d'un trajet
    selectionnerTrajet(trajetId) {
        this.trajetSelectionne = this.trajets.find(t => t.id === trajetId);
        
        const infoSection = document.getElementById('selectedTripInfo');
        
        if (this.trajetSelectionne) {
            this.mettreAJourInfoTrajet();
            infoSection.style.display = 'block';
        } else {
            infoSection.style.display = 'none';
        }
        
        this.verifierAffichageFormulaire();
    }

    // Mise à jour des informations du trajet sélectionné
    mettreAJourInfoTrajet() {
        const trajet = this.trajetSelectionne;
        const depart = new Date(trajet.date_depart);
        const arrivee = new Date(trajet.date_arrivee);
        
        document.getElementById('tripFrom').textContent = trajet.ville_depart;
        document.getElementById('tripTo').textContent = trajet.ville_arrivee;
        document.getElementById('tripDate').textContent = this.formaterDate(depart);
        document.getElementById('tripTime').textContent = 
            `${this.formaterHeure(depart)} - ${this.formaterHeure(arrivee)}`;
        document.getElementById('tripPassengers').textContent = `${trajet.passagers} passagers`;
    }

    // Sélection d'une catégorie d'incident
    selectionnerCategorie(categorie) {
        this.categorieSelectionnee = categorie;
        
        // Mise à jour de l'interface
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.querySelector(`[data-category="${categorie}"]`).classList.add('selected');
        
        // Affichage des champs dynamiques
        this.afficherChampsCategorie(categorie);
        
        // Affichage du formulaire
        this.verifierAffichageFormulaire();
    }

    // Affichage des champs spécifiques à la catégorie
    afficherChampsCategorie(categorie) {
        const container = document.getElementById('dynamicFields');
        
        const champs = {
            retard: this.genererChampsRetard(),
            vehicule: this.genererChampsVehicule(),
            trafic: this.genererChampsTrafic(),
            passager: this.genererChampsPassager(),
            sante: this.genererChampsSante(),
            autre: this.genererChampsAutre()
        };
        
        container.innerHTML = champs[categorie] || '';
    }

    // Génération des champs pour retard
    genererChampsRetard() {
        return `
            <div class="form-group">
                <label for="retardCause" class="form-label required">Cause du retard</label>
                <select id="retardCause" class="form-select" required>
                    <option value="">Sélectionner une cause...</option>
                    <option value="trafic">Trafic dense</option>
                    <option value="accident">Accident sur la route</option>
                    <option value="travaux">Travaux routiers</option>
                    <option value="meteo">Mauvaises conditions météo</option>
                    <option value="vehicule">Problème véhicule</option>
                    <option value="passager">Retard passager</option>
                    <option value="autre">Autre cause</option>
                </select>
            </div>
            <div class="form-group">
                <label for="retardDuration" class="form-label required">Durée estimée du retard (minutes)</label>
                <input type="number" id="retardDuration" class="form-input" min="5" max="480" required>
            </div>
        `;
    }

    // Génération des champs pour problème véhicule
    genererChampsVehicule() {
        return `
            <div class="form-group">
                <label for="vehiculeProbleme" class="form-label required">Type de problème</label>
                <select id="vehiculeProbleme" class="form-select" required>
                    <option value="">Sélectionner un problème...</option>
                    <option value="moteur">Problème moteur</option>
                    <option value="freins">Problème de freins</option>
                    <option value="pneus">Crevaison/Problème pneus</option>
                    <option value="electrique">Problème électrique</option>
                    <option value="carburant">Panne d'essence</option>
                    <option value="autre">Autre problème mécanique</option>
                </select>
            </div>
            <div class="form-group">
                <label for="vehiculeAction" class="form-label">Action entreprise</label>
                <select id="vehiculeAction" class="form-select">
                    <option value="">Sélectionner une action...</option>
                    <option value="depannage">Dépannage appelé</option>
                    <option value="garage">Véhicule en garage</option>
                    <option value="remplacement">Véhicule de remplacement</option>
                    <option value="reparation_minime">Réparation effectuée</option>
                </select>
            </div>
        `;
    }

    // Génération des champs pour conditions route
    genererChampsTrafic() {
        return `
            <div class="form-group">
                <label for="conditionType" class="form-label required">Type de condition</label>
                <select id="conditionType" class="form-select" required>
                    <option value="">Sélectionner...</option>
                    <option value="trafic_dense">Trafic dense</option>
                    <option value="accident">Accident</option>
                    <option value="travaux">Travaux routiers</option>
                    <option value="inondation">Inondation/Pluie</option>
                    <option value="brouillard">Brouillard</option>
                    <option value="manifestation">Manifestation</option>
                    <option value="barrage">Barrage de police</option>
                </select>
            </div>
            <div class="form-group">
                <label for="routeAlternative" class="form-label">Itinéraire alternatif utilisé</label>
                <input type="text" id="routeAlternative" class="form-input" placeholder="Décrire l'itinéraire alternatif...">
            </div>
        `;
    }

    // Génération des champs pour incident passager
    genererChampsPassager() {
        return `
            <div class="form-group">
                <label for="passagerType" class="form-label required">Type d'incident</label>
                <select id="passagerType" class="form-select" required>
                    <option value="">Sélectionner...</option>
                    <option value="comportement">Mauvais comportement</option>
                    <option value="retard">Retard important</option>
                    <option value="bagage">Problème bagages</option>
                    <option value="sante">Problème de santé</option>
                    <option value="conflit">Conflit entre passagers</option>
                    <option value="autre">Autre incident</option>
                </select>
            </div>
            <div class="form-group">
                <label for="passagerResolution" class="form-label">Résolution</label>
                <select id="passagerResolution" class="form-select">
                    <option value="">Sélectionner...</option>
                    <option value="dialogue">Résolu par dialogue</option>
                    <option value="exclusion">Passager exclu</option>
                    <option value="autorites">Autorités contactées</option>
                    <option value="medical">Assistance médicale</option>
                    <option value="en_cours">En cours de résolution</option>
                </select>
            </div>
        `;
    }

    // Génération des champs pour problème santé
    genererChampsSante() {
        return `
            <div class="form-group">
                <label for="santeType" class="form-label required">Type de problème</label>
                <select id="santeType" class="form-select" required>
                    <option value="">Sélectionner...</option>
                    <option value="passager_malade">Passager malade</option>
                    <option value="chauffeur_malade">Chauffeur malade</option>
                    <option value="blessure">Blessure</option>
                    <option value="urgence_medicale">Urgence médicale</option>
                    <option value="maladie_chronique">Maladie chronique</option>
                </select>
            </div>
            <div class="form-group">
                <label for="santeAction" class="form-label">Action entreprise</label>
                <select id="santeAction" class="form-select">
                    <option value="">Sélectionner...</option>
                    <option value="samu">SAMU appelé</option>
                    <option value="hopital">Direction hôpital</option>
                    <option value="medicaments">Médicaments administrés</option>
                    <option value="repos">Repos pris</option>
                    <option value="aucune">Aucune action nécessaire</option>
                </select>
            </div>
        `;
    }

    // Génération des champs pour autre incident
    genererChampsAutre() {
        return `
            <div class="form-group">
                <label for="autreType" class="form-label required">Nature de l'incident</label>
                <input type="text" id="autreType" class="form-input" placeholder="Décrire la nature de l'incident..." required>
            </div>
        `;
    }

    // Vérification de l'affichage du formulaire
    verifierAffichageFormulaire() {
        const formulaire = document.getElementById('reportForm');
        
        if (this.trajetSelectionne && this.categorieSelectionnee) {
            formulaire.style.display = 'block';
            // Scroll vers le formulaire
            formulaire.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Mise à jour du compteur de caractères
    mettreAJourCompteurCaracteres(texte) {
        const count = texte.length;
        document.getElementById('charCount').textContent = count;
        
        // Changement de couleur si approche de la limite
        const charCount = document.getElementById('charCount');
        if (count > 450) {
            charCount.style.color = 'var(--error-color)';
        } else if (count > 400) {
            charCount.style.color = 'var(--warning-color)';
        } else {
            charCount.style.color = 'var(--text-secondary)';
        }
    }

    // Initialisation de l'upload de fichiers
    initialiserUploadFichiers() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseFiles');

        // Clic sur le bouton parcourir
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // Changement de fichier
        fileInput.addEventListener('change', (e) => {
            this.ajouterFichiers(e.target.files);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.ajouterFichiers(e.dataTransfer.files);
        });
    }

    // Ajout de fichiers
    ajouterFichiers(files) {
        for (let file of files) {
            // Vérification de la taille (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                this.afficherErreur(`Le fichier "${file.name}" dépasse la taille limite de 5MB`);
                continue;
            }

            // Vérification du type
            const typesAcceptes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 
                                 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!typesAcceptes.includes(file.type)) {
                this.afficherErreur(`Le format "${file.type}" n'est pas accepté`);
                continue;
            }

            this.fichiers.push(file);
            this.afficherFichier(file);
        }
    }

    // Affichage d'un fichier dans la liste
    afficherFichier(file) {
        const fileList = document.getElementById('fileList');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const extension = file.name.split('.').pop().toLowerCase();
        const icones = {
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️',
            'pdf': '📄',
            'doc': '📝', 'docx': '📝'
        };
        
        fileItem.innerHTML = `
            <div class="file-icon">${icones[extension] || '📎'}</div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${this.formaterTailleFichier(file.size)}</div>
            </div>
            <button class="file-remove" data-filename="${file.name}">🗑️</button>
        `;
        
        fileList.appendChild(fileItem);
        
        // Écouteur pour la suppression
        fileItem.querySelector('.file-remove').addEventListener('click', (e) => {
            this.supprimerFichier(file.name);
            fileItem.remove();
        });
    }

    // Suppression d'un fichier
    supprimerFichier(nomFichier) {
        this.fichiers = this.fichiers.filter(f => f.name !== nomFichier);
    }

    // Formatage de la taille du fichier
    formaterTailleFichier(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Obtention de la localisation
    obtenirLocalisation() {
        if (!navigator.geolocation) {
            this.afficherErreur('La géolocalisation n\'est pas supportée par votre navigateur');
            return;
        }

        document.getElementById('getLocationBtn').textContent = '📍 Localisation...';
        document.getElementById('getLocationBtn').disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Mise à jour de l'interface
                document.getElementById('locationCoords').style.display = 'block';
                document.getElementById('coordinatesText').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                
                // Récupération de l'adresse (reverse geocoding)
                this.obtenirAdresseFromCoords(lat, lng);
                
                document.getElementById('getLocationBtn').textContent = '📍 Position obtenue';
                setTimeout(() => {
                    document.getElementById('getLocationBtn').textContent = '📍 Utiliser ma position';
                    document.getElementById('getLocationBtn').disabled = false;
                }, 2000);
            },
            (error) => {
                console.error('Erreur géolocalisation:', error);
                this.afficherErreur('Impossible d\'obtenir votre position');
                document.getElementById('getLocationBtn').textContent = '📍 Utiliser ma position';
                document.getElementById('getLocationBtn').disabled = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    // Obtention de l'adresse à partir des coordonnées
    async obtenirAdresseFromCoords(lat, lng) {
        try {
            // Utilisation d'un service de géocodage (exemple avec Nominatim)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            
            if (response.ok) {
                const data = await response.json();
                const adresse = data.display_name;
                document.getElementById('incidentLocation').value = adresse;
            }
        } catch (error) {
            console.warn('Impossible de récupérer l\'adresse:', error);
        }
    }

    // Sauvegarde du brouillon
    sauvegarderBrouillon() {
        const donnees = this.collecterDonneesFormulaire();
        this.brouillonSauvegarde = donnees;
        
        localStorage.setItem('brouillon_signalement', JSON.stringify(donnees));
        this.afficherSucces('Brouillon sauvegardé');
    }

    // Chargement du brouillon
    chargerBrouillon() {
        const brouillon = localStorage.getItem('brouillon_signalement');
        if (brouillon) {
            this.brouillonSauvegarde = JSON.parse(brouillon);
            
            if (confirm('Un brouillon de signalement a été trouvé. Souhaitez-vous le charger ?')) {
                this.chargerDonneesBrouillon();
            }
        }
    }

    // Chargement des données du brouillon
    chargerDonneesBrouillon() {
        // Implémentation du chargement des données
        console.log('Chargement du brouillon:', this.brouillonSauvegarde);
    }

    // Envoi du signalement
    async envoyerSignalement() {
        if (!this.validerFormulaire()) {
            return;
        }

        try {
            const donnees = this.collecterDonneesFormulaire();
            const token = localStorage.getItem('miabetrans_token');
            
            // Création FormData pour l'envoi des fichiers
            const formData = new FormData();
            formData.append('donnees', JSON.stringify(donnees));
            
            // Ajout des fichiers
            this.fichiers.forEach(file => {
                formData.append('fichiers[]', file);
            });

            const response = await fetch('../../api/chauffeurs/signaler-incident.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                // Suppression du brouillon
                localStorage.removeItem('brouillon_signalement');
                this.brouillonSauvegarde = null;
                
                this.afficherConfirmation(donnees);
            } else {
                throw new Error('Erreur lors de l\'envoi du signalement');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.afficherErreur('Impossible d\'envoyer le signalement');
        }
    }

    // Collecte des données du formulaire
    collecterDonneesFormulaire() {
        return {
            trajet_id: this.trajetSelectionne.id,
            categorie: this.categorieSelectionnee,
            description: document.getElementById('incidentDescription').value,
            retard_minutes: document.getElementById('delayMinutes').value,
            passagers_affectes: document.getElementById('affectedPassengers').value,
            localisation: document.getElementById('incidentLocation').value,
            gravite: document.querySelector('input[name="severity"]:checked')?.value,
            actions: Array.from(document.querySelectorAll('input[name="actions"]:checked')).map(cb => cb.value),
            champs_specifiques: this.collecterChampsSpecifiques(),
            timestamp: new Date().toISOString()
        };
    }

    // Collecte des champs spécifiques à la catégorie
    collecterChampsSpecifiques() {
        const champs = {};
        
        switch (this.categorieSelectionnee) {
            case 'retard':
                champs.cause = document.getElementById('retardCause').value;
                champs.duree = document.getElementById('retardDuration').value;
                break;
            case 'vehicule':
                champs.probleme = document.getElementById('vehiculeProbleme').value;
                champs.action = document.getElementById('vehiculeAction').value;
                break;
            case 'trafic':
                champs.condition = document.getElementById('conditionType').value;
                champs.alternative = document.getElementById('routeAlternative').value;
                break;
            case 'passager':
                champs.type = document.getElementById('passagerType').value;
                champs.resolution = document.getElementById('passagerResolution').value;
                break;
            case 'sante':
                champs.type = document.getElementById('santeType').value;
                champs.action = document.getElementById('santeAction').value;
                break;
            case 'autre':
                champs.nature = document.getElementById('autreType').value;
                break;
        }
        
        return champs;
    }

    // Validation du formulaire
    validerFormulaire() {
        // Validation de base
        if (!this.trajetSelectionne) {
            this.afficherErreur('Veuillez sélectionner un trajet');
            return false;
        }

        if (!this.categorieSelectionnee) {
            this.afficherErreur('Veuillez sélectionner une catégorie d\'incident');
            return false;
        }

        if (!document.getElementById('incidentDescription').value.trim()) {
            this.afficherErreur('Veuillez décrire l\'incident');
            return false;
        }

        if (!document.querySelector('input[name="severity"]:checked')) {
            this.afficherErreur('Veuillez indiquer le niveau de gravité');
            return false;
        }

        return true;
    }

    // Affichage de la confirmation
    afficherConfirmation(donnees) {
        const modal = document.getElementById('confirmationModal');
        const summary = document.getElementById('reportSummary');
        
        summary.innerHTML = `
            <div><strong>Trajet:</strong> ${this.trajetSelectionne.ville_depart} → ${this.trajetSelectionne.ville_arrivee}</div>
            <div><strong>Catégorie:</strong> ${this.getCategorieText(donnees.categorie)}</div>
            <div><strong>Gravité:</strong> ${this.getGraviteText(donnees.gravite)}</div>
            <div><strong>Heure:</strong> ${this.formaterDate(new Date())}</div>
        `;
        
        modal.style.display = 'block';
    }

    // Rapport rapide
    rapportRapide() {
        // Pré-remplissage pour un rapport rapide
        this.selectionnerCategorie('retard');
        document.getElementById('incidentDescription').value = 'Retard dû aux conditions de circulation.';
        document.querySelector('input[name="severity"][value="faible"]').checked = true;
        this.afficherSucces('Formulaire pré-rempli pour un rapport rapide');
    }

    // Gestion des urgences
    ouvrirModalUrgence() {
        document.getElementById('emergencyModal').style.display = 'block';
    }

    fermerModalUrgence() {
        document.getElementById('emergencyModal').style.display = 'none';
    }

    confirmerUrgence() {
        window.open('tel:117', '_self'); // Numéro d'urgence Togo
    }

    contacterSupportUrgence() {
        window.open('tel:+22890000000', '_self');
    }

    // Appels
    appelerUrgences() {
        window.open('tel:117', '_self');
    }

    appelerSupport() {
        window.open('tel:+22890000000', '_self');
    }

    // Navigation
    nouveauSignalement() {
        this.fermerModalConfirmation();
        this.reinitialiserFormulaire();
    }

    voirSignalement() {
        this.fermerModalConfirmation();
        // Redirection vers la page des détails du signalement
        console.log('Voir le signalement');
    }

    fermerModalConfirmation() {
        document.getElementById('confirmationModal').style.display = 'none';
    }

    // Historique des signalements
    async chargerHistorique() {
        try {
            const token = localStorage.getItem('miabetrans_token');
            const response = await fetch('../../api/chauffeurs/signalements-recents.php', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.afficherHistorique(data.signalements);
            } else {
                // Données de démonstration
                this.chargerHistoriqueDemo();
            }
        } catch (error) {
            console.error('Erreur chargement historique:', error);
            this.chargerHistoriqueDemo();
        }
    }

    // Historique de démonstration
    chargerHistoriqueDemo() {
        const signalements = [
            {
                id: 'SIG-001',
                titre: 'Retard trafic',
                categorie: 'retard',
                date: new Date(Date.now() - 2 * 60 * 60 * 1000),
                statut: 'traite',
                description: 'Retard de 15 minutes dû au trafic dense sur la RN5.'
            },
            {
                id: 'SIG-002',
                titre: 'Problème mécanique',
                categorie: 'vehicule',
                date: new Date(Date.now() - 24 * 60 * 60 * 1000),
                statut: 'en_attente',
                description: 'Problème de freins détecté, véhicule en révision.'
            }
        ];
        
        this.afficherHistorique(signalements);
    }

    // Affichage de l'historique
    afficherHistorique(signalements) {
        const container = document.getElementById('reportsList');
        const emptyState = document.getElementById('noReportsState');
        
        if (signalements.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        container.style.display = 'flex';
        emptyState.style.display = 'none';
        
        container.innerHTML = signalements.map(signalement => 
            this.creerItemHistorique(signalement)
        ).join('');
    }

    // Création d'un item d'historique
    creerItemHistorique(signalement) {
        return `
            <div class="report-item">
                <div class="report-header">
                    <div class="report-title">${signalement.titre}</div>
                    <div class="report-meta">
                        <span class="report-category">${this.getCategorieText(signalement.categorie)}</span>
                        <span class="report-date">${this.formaterDate(signalement.date)}</span>
                        <span class="report-status status-${signalement.statut}">
                            ${this.getStatutText(signalement.statut)}
                        </span>
                    </div>
                </div>
                <div class="report-preview">${signalement.description}</div>
            </div>
        `;
    }

    voirTousSignalements() {
        // Redirection vers la page complète des signalements
        console.log('Voir tous les signalements');
    }

    // Réinitialisation du formulaire
    reinitialiserFormulaire() {
        document.getElementById('incidentForm').reset();
        this.categorieSelectionnee = null;
        this.trajetSelectionne = null;
        this.fichiers = [];
        
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.getElementById('selectedTripInfo').style.display = 'none';
        document.getElementById('reportForm').style.display = 'none';
        document.getElementById('fileList').innerHTML = '';
        document.getElementById('locationCoords').style.display = 'none';
        document.getElementById('dynamicFields').innerHTML = '';
    }

    // Méthodes utilitaires
    getCategorieText(categorie) {
        const categories = {
            'retard': 'Retard',
            'vehicule': 'Problème Véhicule',
            'trafic': 'Conditions Route',
            'passager': 'Incident Passager',
            'sante': 'Problème Santé',
            'autre': 'Autre Incident'
        };
        return categories[categorie] || categorie;
    }

    getGraviteText(gravite) {
        const gravites = {
            'faible': 'Faible',
            'moyen': 'Moyen',
            'eleve': 'Élevé',
            'critique': 'Critique'
        };
        return gravites[gravite] || gravite;
    }

    getStatutText(statut) {
        const statuts = {
            'en_attente': 'En attente',
            'traite': 'Traité',
            'urgent': 'Urgent'
        };
        return statuts[statut] || statut;
    }

    formaterDate(date) {
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formaterHeure(date) {
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Affichage des messages
    afficherErreur(message) {
        this.afficherNotification(message, 'error');
    }

    afficherSucces(message) {
        this.afficherNotification(message, 'success');
    }

    afficherNotification(message, type) {
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
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialisation
let signalerTrajet;

document.addEventListener('DOMContentLoaded', () => {
    signalerTrajet = new SignalerTrajet();
});

// Export pour utilisation globale
window.SignalerTrajet = SignalerTrajet;