// ===== GESTION DE LA PAGE D'ACCUEIL =====

class HomeManager {
    constructor() {
        this.api = new MiabeTransAPI();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAuthSection();
        this.loadPopularDestinations();
        this.animateStats();
        this.setupScrollAnimations();
    }

    setupEventListeners() {
        // Recherche rapide
        const quickSearchBtn = document.querySelector('.quick-search-widget .btn');
        if (quickSearchBtn) {
            quickSearchBtn.addEventListener('click', () => {
                this.quickSearch();
            });
        }

        // Entrée dans les champs de recherche
        const searchInputs = document.querySelectorAll('#quick-depart, #quick-arrivee');
        searchInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.quickSearch();
                }
            });
        });

        // Clic sur les destinations populaires
        document.addEventListener('click', (e) => {
            if (e.target.closest('.destination-card')) {
                const card = e.target.closest('.destination-card');
                const from = card.querySelector('.destination-from').textContent;
                const to = card.querySelector('.destination-to').textContent;
                this.selectDestination(from, to);
            }
        });
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
                            <a href="../pages/Utilisateurs/profil.html">Mon profil</a>
                            <a href="../pages/Reservations/historique.html">Mes réservations</a>
                            <a href="#" onclick="homeManager.logout()">Déconnexion</a>
                        </div>
                    </div>
                </div>
            `;
        } else {
            authSection.innerHTML = `
                <li class="nav-item">
                    <a href="../pages/Utilisateurs/connexion.html" class="nav-link">Connexion</a>
                </li>
                <li class="nav-item">
                    <a href="../pages/Utilisateurs/inscription.html" class="btn btn-primary btn-sm">Inscription</a>
                </li>
            `;
        }
    }

    async quickSearch() {
        const depart = document.getElementById('quick-depart').value.trim();
        const arrivee = document.getElementById('quick-arrivee').value.trim();
        const date = document.getElementById('quick-date').value;

        if (!depart || !arrivee) {
            this.showNotification('Veuillez saisir les villes de départ et d\'arrivée', 'error');
            return;
        }

        // Construction de l'URL de recherche
        const params = new URLSearchParams();
        params.append('depart', depart);
        params.append('arrivee', arrivee);
        if (date) params.append('date', date);

        // Redirection vers la page de recherche
        window.location.href = `../pages/Trajets/liste-trajets.html?${params.toString()}`;
    }

    selectDestination(from, to) {
        document.getElementById('quick-depart').value = from;
        document.getElementById('quick-arrivee').value = to;
        this.showNotification(`Destination sélectionnée: ${from} → ${to}`, 'success');
    }

    async loadPopularDestinations() {
        try {
            const response = await this.api.getPopularRoutes();
            
            if (response.success) {
                this.displayPopularDestinations(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement destinations:', error);
            // Données de démonstration
            this.displayPopularDestinations(this.getDemoDestinations());
        }
    }

    getDemoDestinations() {
        return [
            { ville_depart: 'Lomé', ville_arrivee: 'Kpalimé', prix: 2500, duree: '2h 30min' },
            { ville_depart: 'Lomé', ville_arrivee: 'Sokodé', prix: 5000, duree: '4h 30min' },
            { ville_depart: 'Lomé', ville_arrivee: 'Kara', prix: 6000, duree: '5h 30min' },
            { ville_depart: 'Kpalimé', ville_arrivee: 'Atakpamé', prix: 3500, duree: '3h' },
            { ville_depart: 'Sokodé', ville_arrivee: 'Kara', prix: 2000, duree: '1h 30min' },
            { ville_depart: 'Lomé', ville_arrivee: 'Dapaong', prix: 8000, duree: '7h' }
        ];
    }

    displayPopularDestinations(destinations) {
        const container = document.getElementById('popularDestinations');
        if (!container) return;

        container.innerHTML = destinations.map(destination => `
            <div class="destination-card">
                <div class="destination-route">
                    <div class="destination-cities">
                        <div class="destination-from">${destination.ville_depart}</div>
                        <div class="destination-arrow">→</div>
                        <div class="destination-to">${destination.ville_arrivee}</div>
                    </div>
                </div>
                <div class="destination-price">${this.formatPrice(destination.prix)} FCFA</div>
                <div class="destination-duration">${destination.duree}</div>
            </div>
        `).join('');
    }

    animateStats() {
        const stats = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        stats.forEach(stat => observer.observe(stat));
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            if (target === 99) {
                // Pourcentage avec décimale
                element.textContent = current.toFixed(1) + '%';
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    }

    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.feature-card, .destination-card, .testimonial-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            observer.observe(element);
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'} ${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : '#eff6ff'};
            border: 1px solid ${type === 'error' ? '#fecaca' : type === 'success' ? '#bbf7d0' : '#bfdbfe'};
            color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#166534' : '#1e40af'};
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    logout() {
        localStorage.removeItem('miabetrans_token');
        localStorage.removeItem('miabetrans_user');
        localStorage.removeItem('miabetrans_role');
        window.location.reload();
    }

    // Méthodes utilitaires
    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR').format(price);
    }
}

// Initialisation
let homeManager;

document.addEventListener('DOMContentLoaded', () => {
    homeManager = new HomeManager();
});

// Ajout de l'animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Export pour utilisation globale
window.HomeManager = HomeManager;