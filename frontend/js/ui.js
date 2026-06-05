// Gestion de l'interface utilisateur et des interactions
class UIHandler {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserPreferences();
        this.initializeComponents();
    }

    setupEventListeners() {
        // Navigation mobile
        this.setupMobileNavigation();
        
        // Modales
        this.setupModals();
        
        // Toast notifications
        this.setupToast();
        
        // Loading states
        this.setupLoadingStates();
    }

    setupMobileNavigation() {
        const menuToggle = document.querySelector('.menu-toggle');
        const navMenu = document.querySelector('.nav-menu');

        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }

        // Fermer le menu en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-menu') && !e.target.closest('.menu-toggle')) {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    }

    setupModals() {
        // Ouvrir modale
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-modal-target')) {
                const modalId = e.target.getAttribute('data-modal-target');
                this.openModal(modalId);
            }

            // Fermer modale
            if (e.target.classList.contains('modal-close') || 
                e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target.closest('.modal'));
            }
        });

        // Fermer avec ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus sur le premier élément interactif
            const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable) focusable.focus();
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            this.closeModal(modal);
        });
    }

    setupToast() {
        // Créer le conteneur de toast s'il n'existe pas
        if (!document.getElementById('toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icon}</span>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        toastContainer.appendChild(toast);

        // Animation d'entrée
        setTimeout(() => toast.classList.add('show'), 100);

        // Suppression automatique
        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }
            }, duration);
        }

        return toast;
    }

    getToastIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    setupLoadingStates() {
        // Gérer les états de chargement des boutons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-loading]');
            if (button) {
                this.setButtonLoading(button, true);
            }
        });
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.setAttribute('data-original-text', button.textContent);
            button.innerHTML = '<span class="loading-spinner"></span> Chargement...';
            button.disabled = true;
        } else {
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.textContent = originalText;
                button.removeAttribute('data-original-text');
            }
            button.disabled = false;
        }
    }

    loadUserPreferences() {
        // Charger les préférences utilisateur depuis le localStorage
        const theme = localStorage.getItem('theme') || 'light';
        this.setTheme(theme);

        const language = localStorage.getItem('language') || 'fr';
        this.setLanguage(language);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    setLanguage(lang) {
        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);
        
        // Déclencher un événement pour mettre à jour les textes
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    }

    initializeComponents() {
        // Initialiser les composants communs
        this.initializeDropdowns();
        this.initializeTabs();
        this.initializeAccordions();
    }

    initializeDropdowns() {
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = toggle.closest('.dropdown');
                dropdown.classList.toggle('active');
            });
        });

        // Fermer les dropdowns en cliquant à l'extérieur
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        });
    }

    initializeTabs() {
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabContainer = button.closest('.tabs');
                const tabId = button.getAttribute('data-tab');
                
                // Désactiver tous les onglets
                tabContainer.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                tabContainer.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Activer l'onglet courant
                button.classList.add('active');
                const targetContent = document.getElementById(tabId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    initializeAccordions() {
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const accordion = header.closest('.accordion');
                accordion.classList.toggle('active');
            });
        });
    }

    // Méthode pour formater les dates
    formatDate(date, format = 'short') {
        const dateObj = new Date(date);
        const options = {
            short: {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            },
            long: {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            },
            time: {
                hour: '2-digit',
                minute: '2-digit'
            }
        };

        return dateObj.toLocaleDateString('fr-FR', options[format] || options.short);
    }

    // Méthode pour formater les devises
    formatCurrency(amount, currency = 'EUR') {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // Méthode pour gérer les erreurs réseau
    handleNetworkError(error) {
        console.error('Erreur réseau:', error);
        this.showToast(
            'Erreur de connexion. Veuillez vérifier votre connexion internet.',
            'error',
            5000
        );
    }
}

// Initialisation globale
document.addEventListener('DOMContentLoaded', () => {
    window.ui = new UIHandler();
});

// Export pour les modules ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIHandler;
}