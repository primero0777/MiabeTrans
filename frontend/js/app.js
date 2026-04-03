// Application principale MiabeTrans - ES6+
class MiabeTransApp {
    constructor() {
        this.api = new MiabeTransAPI();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPopularRoutes();
        this.setupSearchForm();
        this.initializeServiceWorker();
    }

    setupEventListeners() {
        // Navigation mobile
        this.setupMobileNavigation();
        
        // Gestion des formulaires
        this.setupFormValidation();
        
        // Interactions utilisateur
        this.setupUserInteractions();
    }

    setupMobileNavigation() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Fermer le menu en cliquant sur un lien
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
    }

    setupSearchForm() {
        const searchForm = document.getElementById('searchTrajets');
        if (searchForm) {
            searchForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSearch(e);
            });
        }
    }

    async handleSearch(event) {
        const form = event.target;
        const formData = new FormData(form);
        
        // Afficher l'état de chargement
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="btn-loading">Recherche...</span>';
        submitBtn.disabled = true;

        try {
            const searchParams = {
                depart: formData.get('ville_depart'),
                arrivee: formData.get('ville_arrivee'),
                date: formData.get('date_voyage'),
                passagers: parseInt(formData.get('passagers'))
            };

            // Validation des données
            if (!this.validateSearchParams(searchParams)) {
                this.showNotification('Veuillez remplir tous les champs correctement', 'error');
                return;
            }

            // Redirection vers la page des résultats
            const queryString = new URLSearchParams(searchParams).toString();
            window.location.href = `../Trajets/liste-trajets.html?${queryString}`;

        } catch (error) {
            console.error('Erreur recherche:', error);
            this.showNotification('Erreur lors de la recherche', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    validateSearchParams(params) {
        if (!params.depart || !params.arrivee || !params.date) {
            return false;
        }

        if (params.date < new Date().toISOString().split('T')[0]) {
            this.showNotification('La date ne peut pas être dans le passé', 'warning');
            return false;
        }

        return true;
    }

    async loadPopularRoutes() {
        try {
            const routes = await this.api.getPopularRoutes();
            this.displayPopularRoutes(routes);
        } catch (error) {
            console.error('Erreur chargement routes populaires:', error);
        }
    }

    displayPopularRoutes(routes) {
        const container = document.getElementById('popularRoutes');
        if (!container) return;

        if (routes.length === 0) {
            container.innerHTML = '<p class="no-routes">Aucun trajet populaire pour le moment</p>';
            return;
        }

        container.innerHTML = routes.map(route => `
            <div class="route-card" role="article">
                <div class="route-info">
                    <h3>${route.ville_depart} → ${route.ville_arrivee}</h3>
                    <p class="route-price">${route.prix} FCFA</p>
                    <p class="route-duration">${route.duree}</p>
                    <button class="btn btn-primary" 
                            onclick="app.selectRoute(${route.id})"
                            aria-label="Réserver le trajet de ${route.ville_depart} à ${route.ville_arrivee}">
                        Réserver
                    </button>
                </div>
            </div>
        `).join('');
    }

    selectRoute(routeId) {
        // Stocker la sélection pour la réservation
        sessionStorage.setItem('selectedRoute', routeId);
        window.location.href = '../Reservations/reserver.html';
    }

    setupFormValidation() {
        // Validation en temps réel
        document.querySelectorAll('input[required]').forEach(input => {
            input.addEventListener('blur', this.validateField.bind(this));
        });
    }

    validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        
        field.classList.remove('valid', 'invalid');
        
        if (!value) {
            field.classList.add('invalid');
            this.showFieldError(field, 'Ce champ est obligatoire');
            return false;
        }

        // Validation spécifique par type
        switch(field.type) {
            case 'email':
                if (!this.isValidEmail(value)) {
                    field.classList.add('invalid');
                    this.showFieldError(field, 'Email invalide');
                    return false;
                }
                break;
            case 'tel':
                if (!this.isValidPhone(value)) {
                    field.classList.add('invalid');
                    this.showFieldError(field, 'Numéro de téléphone invalide');
                    return false;
                }
                break;
        }

        field.classList.add('valid');
        this.clearFieldError(field);
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^(\+228|00228)?[0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    showNotification(message, type = 'info') {
        // Créer une notification toast
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Fermer la notification">×</button>
        `;

        document.body.appendChild(notification);

        // Animation d'entrée
        setTimeout(() => notification.classList.add('show'), 100);

        // Fermeture automatique
        setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);

        // Fermeture manuelle
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

    initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW enregistré:', registration);
                })
                .catch(error => {
                    console.log('Échec enregistrement SW:', error);
                });
        }
    }
}

// Initialisation de l'application
const app = new MiabeTransApp();

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiabeTransApp;
}