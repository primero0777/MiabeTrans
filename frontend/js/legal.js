// Gestion des pages légales - ES6+
class LegalManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupAuthSection();
        this.setupPrintButton();
        this.setupSmoothScrolling();
        this.highlightCurrentSection();
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

    setupPrintButton() {
        // Ajouter un bouton d'impression si nécessaire
        const legalHeader = document.querySelector('.legal-header');
        if (legalHeader) {
            const printButton = document.createElement('button');
            printButton.className = 'btn btn-outline btn-print';
            printButton.innerHTML = '🖨️ Imprimer';
            printButton.addEventListener('click', () => window.print());
            
            const buttonContainer = document.createElement('div');
            buttonContainer.style.marginTop = '1rem';
            buttonContainer.appendChild(printButton);
            legalHeader.appendChild(buttonContainer);
        }
    }

    setupSmoothScrolling() {
        // Navigation fluide vers les ancres
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    highlightCurrentSection() {
        // Mettre en évidence la section en cours de lecture
        const sections = document.querySelectorAll('.legal-section');
        const observerOptions = {
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                } else {
                    entry.target.classList.remove('active');
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            observer.observe(section);
        });
    }
}

// Initialisation
const legalManager = new LegalManager();