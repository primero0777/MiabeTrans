// ===== INTERACTIVITÉ PAGE FONCTIONNALITÉS =====

class FonctionnalitesPage {
    constructor() {
        this.currentCategory = 'recherche';
        this.init();
    }

    init() {
        this.initializeCategoryNavigation();
        this.initializeFeatureInteractions();
        this.initializeAnimations();
        this.initializeDemoSteps();
    }

    // Navigation entre catégories
    initializeCategoryNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const categories = document.querySelectorAll('.features-category');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;
                
                // Mise à jour des boutons actifs
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Affichage de la catégorie
                categories.forEach(cat => {
                    cat.classList.remove('active');
                    if (cat.id === category) {
                        cat.classList.add('active');
                        this.currentCategory = category;
                        
                        // Animation de la nouvelle section
                        this.animateCategoryTransition(cat);
                    }
                });

                // Mise à jour de l'URL
                this.updateUrl(category);
            });
        });

        // Gestion de l'URL au chargement
        this.handleUrlOnLoad();
    }

    // Gestion de l'URL au chargement
    handleUrlOnLoad() {
        const hash = window.location.hash.substring(1);
        if (hash && document.getElementById(hash)) {
            const correspondingButton = document.querySelector(`.nav-btn[data-category="${hash}"]`);
            if (correspondingButton) {
                correspondingButton.click();
            }
        }
    }

    // Mise à jour de l'URL
    updateUrl(category) {
        const newUrl = `${window.location.pathname}#${category}`;
        window.history.pushState({}, '', newUrl);
    }

    // Animation de transition entre catégories
    animateCategoryTransition(categoryElement) {
        categoryElement.style.opacity = '0';
        categoryElement.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            categoryElement.style.transition = 'all 0.5s ease';
            categoryElement.style.opacity = '1';
            categoryElement.style.transform = 'translateY(0)';
        }, 50);
    }

    // Interactions avec les fonctionnalités
    initializeFeatureInteractions() {
        const featureCards = document.querySelectorAll('.feature-card');
        const illustrationItems = document.querySelectorAll('.illustration-item');

        // Hover sur les cartes de fonctionnalités
        featureCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(-5px) scale(1)';
            });
        });

        // Clic sur les éléments d'illustration
        illustrationItems.forEach(item => {
            item.addEventListener('click', () => {
                const feature = item.dataset.feature;
                const correspondingButton = document.querySelector(`.nav-btn[data-category="${feature}"]`);
                
                if (correspondingButton) {
                    correspondingButton.click();
                    
                    // Scroll vers la section
                    setTimeout(() => {
                        document.getElementById(feature).scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }, 100);
                }
            });
        });
    }

    // Animation des démonstrations
    initializeDemoSteps() {
        const demoSteps = document.querySelectorAll('.demo-step');
        
        // Animation automatique des étapes
        if (demoSteps.length > 0) {
            let currentStep = 0;
            
            const animateSteps = () => {
                demoSteps.forEach((step, index) => {
                    step.classList.remove('active');
                    if (index === currentStep) {
                        step.classList.add('active');
                    }
                });
                
                currentStep = (currentStep + 1) % demoSteps.length;
            };
            
            // Démarrer l'animation
            setInterval(animateSteps, 3000);
            animateSteps(); // Premier affichage
        }
    }

    // Initialisation des animations
    initializeAnimations() {
        this.setupScrollAnimations();
        this.setupCounterAnimations();
    }

    // Animations au scroll
    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.feature-card, .app-feature');
        
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

    // Animations des compteurs (si présents)
    setupCounterAnimations() {
        const counters = document.querySelectorAll('.stat-number[data-target]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    }

    // Animation d'un compteur
    animateCounter(counter) {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = Math.floor(current).toLocaleString();
        }, 16);
    }

    // Gestion du responsive
    handleResponsive() {
        this.updateNavForMobile();
    }

    // Mise à jour de la navigation pour mobile
    updateNavForMobile() {
        const nav = document.querySelector('.features-nav');
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            nav.classList.add('mobile-nav');
        } else {
            nav.classList.remove('mobile-nav');
        }
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const fonctionnalitesPage = new FonctionnalitesPage();
    
    // Gestion du redimensionnement
    window.addEventListener('resize', () => {
        fonctionnalitesPage.handleResponsive();
    });
});

// Export pour utilisation globale
window.FonctionnalitesPage = FonctionnalitesPage;