// ===== FONCTIONNALITÉS PRINCIPALES ET UTILITAIRES =====

class MiabeTransApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.setupMobileNavigation();
        this.setupGlobalEventListeners();
        this.setupServiceWorker();
        this.setupErrorHandling();
    }

    // Chargement de l'utilisateur actuel
    loadCurrentUser() {
        const token = localStorage.getItem('miabetrans_token');
        const userData = localStorage.getItem('miabetrans_user');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateUIForLoggedInUser();
            } catch (error) {
                console.error('Erreur parsing user data:', error);
                this.logout();
            }
        } else {
            this.updateUIForGuest();
        }
    }

    // Mise à jour de l'UI pour utilisateur connecté
    updateUIForLoggedInUser() {
        const authSections = document.querySelectorAll('#authSection');
        
        authSections.forEach(section => {
            if (this.currentUser) {
                section.innerHTML = this.generateUserMenu();
                this.setupUserMenuInteractions();
            }
        });

        // Mettre à jour les éléments spécifiques utilisateur
        this.updateUserSpecificElements();
    }

    // Mise à jour de l'UI pour visiteur
    updateUIForGuest() {
        const authSections = document.querySelectorAll('#authSection');
        
        authSections.forEach(section => {
            section.innerHTML = `
                <li class="nav-item">
                    <a href="../pages/Utilisateurs/connexion.html" class="nav-link">Connexion</a>
                </li>
                <li class="nav-item">
                    <a href="../pages/Utilisateurs/inscription.html" class="btn btn-primary btn-sm">Inscription</a>
                </li>
            `;
        });
    }

    // Génération du menu utilisateur
    generateUserMenu() {
        const user = this.currentUser;
        const role = localStorage.getItem('miabetrans_role');
        
        let dashboardLink = '';
        if (role === 'admin') {
            dashboardLink = '<a href="../pages/Admin/dashboard.html">Dashboard Admin</a>';
        } else if (role === 'chauffeur') {
            dashboardLink = '<a href="../pages/Chauffeurs/dashboard.html">Dashboard Chauffeur</a>';
        } else {
            dashboardLink = '<a href="../pages/Reservations/historique.html">Mes réservations</a>';
        }

        return `
            <div class="nav-user">
                <div class="user-greeting">
                    <span>Bonjour, ${user.prenom || user.nom || 'Utilisateur'}</span>
                </div>
                <div class="user-dropdown">
                    <button class="user-menu-btn" aria-label="Menu utilisateur">
                        <div class="user-avatar">
                            ${(user.prenom?.[0] || user.nom?.[0] || 'U').toUpperCase()}
                        </div>
                    </button>
                    <div class="user-dropdown-content">
                        <div class="user-info">
                            <strong>${user.prenom || ''} ${user.nom || ''}</strong>
                            <span class="user-email">${user.email || ''}</span>
                        </div>
                        <div class="dropdown-divider"></div>
                        ${dashboardLink}
                        <a href="../pages/Utilisateurs/profil.html">Mon profil</a>
                        <a href="../pages/Reservations/historique.html">Mes réservations</a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="logout-btn" onclick="miabeTransApp.logout()">Déconnexion</a>
                    </div>
                </div>
            </div>
        `;
    }

    // Configuration des interactions du menu utilisateur
    setupUserMenuInteractions() {
        const userMenuBtns = document.querySelectorAll('.user-menu-btn');
        
        userMenuBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = btn.nextElementSibling;
                dropdown.classList.toggle('show');
            });
        });

        // Fermer les dropdowns en cliquant ailleurs
        document.addEventListener('click', () => {
            document.querySelectorAll('.user-dropdown-content.show').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        });
    }

    // Mise à jour des éléments spécifiques utilisateur
    updateUserSpecificElements() {
        // Mettre à jour les éléments qui dépendent de l'état de connexion
        const protectedElements = document.querySelectorAll('[data-auth-required]');
        protectedElements.forEach(element => {
            element.style.display = this.currentUser ? 'block' : 'none';
        });

        const guestElements = document.querySelectorAll('[data-guest-only]');
        guestElements.forEach(element => {
            element.style.display = this.currentUser ? 'none' : 'block';
        });
    }

    // Navigation mobile
    setupMobileNavigation() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Fermer le menu en cliquant sur un lien
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
    }

    // Gestionnaires d'événements globaux
    setupGlobalEventListeners() {
        // Gestion des formulaires
        document.addEventListener('submit', this.handleFormSubmit.bind(this));
        
        // Gestion des clics sur les boutons
        document.addEventListener('click', this.handleGlobalClicks.bind(this));
        
        // Gestion du scroll
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Gestion du resize
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
    }

    // Gestion des soumissions de formulaire
    handleFormSubmit(event) {
        const form = event.target;
        
        // Validation basique
        if (form.hasAttribute('data-needs-validation')) {
            if (!this.validateForm(form)) {
                event.preventDefault();
                this.showFormErrors(form);
                return;
            }
        }

        // Ajouter un état de chargement
        if (form.classList.contains('async-form')) {
            event.preventDefault();
            this.handleAsyncFormSubmit(form);
        }
    }

    // Validation de formulaire
    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                this.markFieldInvalid(input, 'Ce champ est obligatoire');
            } else {
                this.markFieldValid(input);
            }
        });

        // Validation email
        const emailInputs = form.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            if (input.value && !this.isValidEmail(input.value)) {
                isValid = false;
                this.markFieldInvalid(input, 'Format d\'email invalide');
            }
        });

        return isValid;
    }

    // Marquer un champ comme invalide
    markFieldInvalid(field, message) {
        field.classList.add('invalid');
        field.classList.remove('valid');
        
        // Ajouter le message d'erreur
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    // Marquer un champ comme valide
    markFieldValid(field) {
        field.classList.add('valid');
        field.classList.remove('invalid');
        
        // Supprimer le message d'erreur
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Validation d'email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Affichage des erreurs de formulaire
    showFormErrors(form) {
        const firstInvalidField = form.querySelector('.invalid');
        if (firstInvalidField) {
            firstInvalidField.focus();
        }
        
        this.showNotification('Veuillez corriger les erreurs dans le formulaire', 'error');
    }

    // Gestion des formulaires asynchrones
    async handleAsyncFormSubmit(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent;
        
        // État de chargement
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="loading-spinner-small"></div> Chargement...';
        }

        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: form.method,
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(result.message || 'Action réussie', 'success');
                if (form.dataset.redirect) {
                    setTimeout(() => {
                        window.location.href = form.dataset.redirect;
                    }, 1000);
                }
            } else {
                throw new Error(result.message || 'Une erreur est survenue');
            }

        } catch (error) {
            console.error('Erreur formulaire:', error);
            this.showNotification(error.message, 'error');
        } finally {
            // Restaurer le bouton
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }

    // Gestion des clics globaux
    handleGlobalClicks(event) {
        const target = event.target;

        // Gestion des modals
        if (target.classList.contains('modal-close') || target.classList.contains('modal')) {
            this.closeModal(target.closest('.modal'));
        }

        // Gestion des dropdowns
        if (target.hasAttribute('data-toggle-dropdown')) {
            event.preventDefault();
            const dropdown = document.querySelector(target.getAttribute('data-toggle-dropdown'));
            if (dropdown) {
                dropdown.classList.toggle('show');
            }
        }

        // Gestion des tooltips
        if (target.hasAttribute('data-tooltip')) {
            this.showTooltip(target, target.getAttribute('data-tooltip'));
        }
    }

    // Gestion du scroll
    handleScroll() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }

        // Animation des éléments au scroll
        this.animateOnScroll();
    }

    // Animation des éléments au scroll
    animateOnScroll() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        
        animatedElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('animated');
            }
        });
    }

    // Gestion du redimensionnement
    handleResize() {
        // Fermer les menus mobiles en desktop
        if (window.innerWidth > 768) {
            const hamburger = document.querySelector('.hamburger');
            const navMenu = document.querySelector('.nav-menu');
            
            if (hamburger && navMenu) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        }
    }

    // Service Worker pour le caching
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('../sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    // Gestion des erreurs globales
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Erreur globale:', event.error);
            this.logError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rejetée:', event.reason);
            this.logError(event.reason);
        });
    }

    // Journalisation des erreurs
    logError(error) {
        // En production, envoyer à un service de logging
        if (process.env.NODE_ENV === 'production') {
            // this.sendToErrorLoggingService(error);
        }
    }

    // Gestion de la déconnexion
    logout() {
        localStorage.removeItem('miabetrans_token');
        localStorage.removeItem('miabetrans_user');
        localStorage.removeItem('miabetrans_role');
        
        this.currentUser = null;
        this.updateUIForGuest();
        
        // Rediriger vers l'accueil si on est sur une page protégée
        const protectedPages = ['/profil', '/reservations', '/admin', '/chauffeurs'];
        const currentPath = window.location.pathname;
        
        if (protectedPages.some(page => currentPath.includes(page))) {
            window.location.href = '../public/index.html';
        } else {
            window.location.reload();
        }
    }

    // Notification système
    showNotification(message, type = 'info') {
        // Supprimer les notifications existantes
        const existingNotifications = document.querySelectorAll('.global-notification');
        existingNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });

        const notification = document.createElement('div');
        notification.className = `global-notification ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    &times;
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animation d'entrée
        setTimeout(() => notification.classList.add('show'), 100);

        // Suppression automatique
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }

    // Ouverture de modal
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Focus sur le premier élément interactif
            const firstInput = modal.querySelector('input, button, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    // Fermeture de modal
    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Affichage de tooltip
    showTooltip(element, message) {
        let tooltip = document.getElementById('global-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'global-tooltip';
            tooltip.className = 'tooltip';
            document.body.appendChild(tooltip);
        }

        tooltip.textContent = message;
        tooltip.style.display = 'block';

        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';

        setTimeout(() => {
            tooltip.style.display = 'none';
        }, 3000);
    }

    // Formatage de date
    formatDate(date, format = 'short') {
        const dateObj = new Date(date);
        const options = {
            short: {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            },
            long: {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            },
            time: {
                hour: '2-digit',
                minute: '2-digit'
            }
        };

        return dateObj.toLocaleDateString('fr-FR', options[format]);
    }

    // Formatage de prix
    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(price);
    }

    // Debounce function
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

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Vérification de la connexion
    checkAuth() {
        return !!localStorage.getItem('miabetrans_token');
    }

    // Redirection si non connecté
    requireAuth(redirectUrl = '../pages/Utilisateurs/connexion.html') {
        if (!this.checkAuth()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    // Vérification des rôles
    hasRole(requiredRole) {
        const userRole = localStorage.getItem('miabetrans_role');
        return userRole === requiredRole;
    }

    // Redirection si mauvais rôle
    requireRole(requiredRole, redirectUrl = '../public/index.html') {
        if (!this.hasRole(requiredRole)) {
            this.showNotification('Accès non autorisé', 'error');
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 2000);
            return false;
        }
        return true;
    }

    // Chargement de données API
    async apiCall(endpoint, options = {}) {
        const token = localStorage.getItem('miabetrans_token');
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        try {
            const response = await fetch(`../../api/${endpoint}`, {
                ...defaultOptions,
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}

// Initialisation de l'application
const miabeTransApp = new MiabeTransApp();

// Export pour utilisation globale
window.miabeTransApp = miabeTransApp;

// Polyfills et helpers supplémentaires
if (!String.prototype.format) {
    String.prototype.format = function(...args) {
        return this.replace(/{(\d+)}/g, (match, number) => {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

// Gestion du chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Ajouter la classe loaded pour les animations
    document.body.classList.add('loaded');
    
    // Initialiser les composants communs
    miabeTransApp.setupMobileNavigation();
    miabeTransApp.animateOnScroll();
});

// Gestion avant déchargement de la page
window.addEventListener('beforeunload', () => {
    // Sauvegarder l'état si nécessaire
});