// ===== INTERACTIVITÉ PAGE PRÉSENTATION =====

class PresentationPage {
    constructor() {
        this.animatedCounters = false;
        this.init();
    }

    init() {
        this.initializeAnimations();
        this.initializeEventListeners();
        this.initializeScrollEffects();
    }

    // Initialisation des animations
    initializeAnimations() {
        // Animation des compteurs
        this.setupCounterAnimation();
        
        // Animation de la timeline
        this.setupTimelineAnimation();
        
        // Animation au scroll
        this.setupScrollAnimations();
    }

    // Configuration des compteurs animés
    setupCounterAnimation() {
        const counters = document.querySelectorAll('.stat-number[data-target]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animatedCounters) {
                    this.animateCounters();
                    this.animatedCounters = true;
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    }

    // Animation des compteurs
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number[data-target]');
        
        counters.forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-target'));
            const duration = 2000; // 2 secondes
            const step = target / (duration / 16); // 60fps
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                
                // Formatage différent pour les nombres décimaux
                if (target % 1 !== 0) {
                    counter.textContent = current.toFixed(1);
                } else {
                    counter.textContent = Math.floor(current).toLocaleString();
                }
            }, 16);
        });
    }

    // Animation de la timeline
    setupTimelineAnimation() {
        const timeline = document.querySelector('.timeline-progress');
        const historySection = document.querySelector('.history-section');
        
        if (!timeline || !historySection) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    timeline.style.height = '100%';
                }
            });
        }, { threshold: 0.5 });

        observer.observe(historySection);
    }

    // Animations au scroll
    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.mission-card, .team-member, .stat-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(element => observer.observe(element));
    }

    // Initialisation des écouteurs d'événements
    initializeEventListeners() {
        // Navigation smooth scroll
        this.setupSmoothScroll();
        
        // Interactions des cartes
        this.setupCardInteractions();
    }

    // Configuration du scroll fluide
    setupSmoothScroll() {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Interactions des cartes
    setupCardInteractions() {
        const cards = document.querySelectorAll('.mission-card, .team-member');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }

    // Effets de scroll
    initializeScrollEffects() {
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const navbar = document.querySelector('.navbar');
            
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scroll vers le bas
                navbar.style.transform = 'translateY(-100%)';
            } else {
                // Scroll vers le haut
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollY = currentScrollY;
            
            // Effet parallaxe sur la hero section
            this.updateParallaxEffect();
        });
    }

    // Effet parallaxe
    updateParallaxEffect() {
        const heroSection = document.querySelector('.hero-section');
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        if (heroSection) {
            heroSection.style.transform = `translateY(${rate}px)`;
        }
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    new PresentationPage();
});

// Export pour utilisation globale
window.PresentationPage = PresentationPage;