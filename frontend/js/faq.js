// Gestion de la FAQ - ES6+
class FAQManager {
    constructor() {
        this.faqItems = [];
        this.searchTerm = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAuthSection();
        this.collectFAQItems();
    }

    setupEventListeners() {
        // Navigation par catégories
        this.setupCategoryTabs();
        
        // Accordéon des questions
        this.setupFAQAccordion();
        
        // Recherche
        this.setupSearch();
    }

    setupCategoryTabs() {
        const categoryTabs = document.querySelectorAll('.category-tab');
        
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Retirer la classe active de tous les onglets
                categoryTabs.forEach(t => t.classList.remove('active'));
                
                // Activer l'onglet cliqué
                tab.classList.add('active');
                
                // Afficher la catégorie correspondante
                const category = tab.getAttribute('data-category');
                this.showCategory(category);
            });
        });
    }

    showCategory(category) {
        // Masquer toutes les catégories
        document.querySelectorAll('.faq-category').forEach(cat => {
            cat.classList.remove('active');
        });
        
        // Afficher la catégorie sélectionnée
        const targetCategory = document.getElementById(`${category}-category`);
        if (targetCategory) {
            targetCategory.classList.add('active');
        }
        
        // Réinitialiser la recherche
        this.resetSearch();
    }

    setupFAQAccordion() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('faq-question')) {
                this.toggleFAQItem(e.target.parentElement);
            }
        });
    }

    toggleFAQItem(faqItem) {
        const isActive = faqItem.classList.contains('active');
        
        // Fermer tous les items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Ouvrir l'item cliqué s'il n'était pas actif
        if (!isActive) {
            faqItem.classList.add('active');
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('faqSearch');
        const searchBtn = document.querySelector('.search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.trim();
                this.performSearch();
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }
    }

    collectFAQItems() {
        this.faqItems = Array.from(document.querySelectorAll('.faq-item'));
    }

    performSearch() {
        if (!this.searchTerm) {
            this.resetSearch();
            return;
        }
        
        const searchTermLower = this.searchTerm.toLowerCase();
        let hasResults = false;
        
        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question').textContent.toLowerCase();
            const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
            
            const matches = question.includes(searchTermLower) || answer.includes(searchTermLower);
            
            if (matches) {
                item.style.display = 'block';
                this.highlightText(item, searchTermLower);
                hasResults = true;
                
                // Ouvrir l'item qui correspond
                item.classList.add('active');
            } else {
                item.style.display = 'none';
            }
        });
        
        this.displaySearchResults(hasResults);
    }

    highlightText(element, searchTerm) {
        const question = element.querySelector('.faq-question');
        const answer = element.querySelector('.faq-answer');
        
        // Réinitialiser les surlignages précédents
        this.removeHighlights(question);
        this.removeHighlights(answer);
        
        // Surligner le texte correspondant
        this.highlightElement(question, searchTerm);
        this.highlightElement(answer, searchTerm);
    }

    highlightElement(element, searchTerm) {
        const text = element.innerHTML;
        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        const highlighted = text.replace(regex, '<span class="search-highlight">$1</span>');
        element.innerHTML = highlighted;
    }

    removeHighlights(element) {
        const highlights = element.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    displaySearchResults(hasResults) {
        const categories = document.querySelectorAll('.faq-category');
        
        categories.forEach(category => {
            const visibleItems = category.querySelectorAll('.faq-item[style="display: block"]');
            
            if (visibleItems.length > 0) {
                category.style.display = 'block';
                category.classList.add('active');
            } else {
                category.style.display = 'none';
                category.classList.remove('active');
            }
        });
        
        // Afficher un message si aucun résultat
        if (!hasResults) {
            this.showNoResults();
        }
    }

    showNoResults() {
        const faqContent = document.querySelector('.faq-content');
        let noResults = document.getElementById('no-results-message');
        
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.id = 'no-results-message';
            noResults.className = 'no-results';
            noResults.innerHTML = `
                <div class="no-results-icon">🔍</div>
                <h3>Aucun résultat trouvé</h3>
                <p>Aucune question ne correspond à votre recherche "<strong>${this.searchTerm}</strong>"</p>
                <button class="btn btn-outline" onclick="faqManager.resetSearch()">
                    Afficher toutes les questions
                </button>
            `;
            faqContent.appendChild(noResults);
        }
        
        noResults.style.display = 'block';
    }

    resetSearch() {
        // Réinitialiser la recherche
        const searchInput = document.getElementById('faqSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        this.searchTerm = '';
        
        // Afficher tous les items
        this.faqItems.forEach(item => {
            item.style.display = 'block';
            this.removeHighlights(item.querySelector('.faq-question'));
            this.removeHighlights(item.querySelector('.faq-answer'));
            item.classList.remove('active');
        });
        
        // Masquer le message "aucun résultat"
        const noResults = document.getElementById('no-results-message');
        if (noResults) {
            noResults.style.display = 'none';
        }
        
        // Réafficher toutes les catégories
        document.querySelectorAll('.faq-category').forEach(category => {
            category.style.display = 'block';
        });
        
        // Revenir à la catégorie active
        const activeTab = document.querySelector('.category-tab.active');
        if (activeTab) {
            const category = activeTab.getAttribute('data-category');
            this.showCategory(category);
        }
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
}

// Initialisation
const faqManager = new FAQManager();