document.addEventListener('DOMContentLoaded', () => {

    /**
     * Initialize AOS (Animate On Scroll)
     */

    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });

    /**
     * Hover effect for use case cards
     */

    const useCards = document.querySelectorAll('.use-case-card');
    useCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const hoverContent = card.querySelector('.card-hover-content');
            hoverContent.style.opacity = '1';
            hoverContent.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 8px 32px rgba(108, 99, 255, 0.2)';
            card.style.borderColor = 'rgba(108, 99, 255, 0.3)';
        });

        card.addEventListener('mouseleave', () => {
            const hoverContent = card.querySelector('.card-hover-content');
            hoverContent.style.opacity = '0';
            hoverContent.style.transform = 'translateY(100%)';
            card.style.boxShadow = '';
            card.style.borderColor = '';
        });
    });

    /**
     * Animate workflow steps on scroll
     */

    const steps = document.querySelectorAll('.step');
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    };

    const stepObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                const stepNumber = entry.target.querySelector('.step-number');
                stepNumber.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    stepNumber.style.transform = 'scale(1)';
                }, 300);
            }
        });
    }, observerOptions);

    steps.forEach(step => stepObserver.observe(step));

    /**
     * Parallax effect for background spheres
     */

    window.addEventListener('scroll', () => {
        const spheres = document.querySelectorAll('.gradient-sphere');
        const scrolled = window.pageYOffset;

        spheres.forEach((sphere, index) => {
            const speed = index + 1 * 0.2;
            sphere.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    /**
     * Animated counter for statistics
     */
    function animateNumber(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);

        function updateNumber() {
            start += increment;
            if (start < target) {
                element.textContent = Math.floor(start);
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = target;
            }
        }

        updateNumber();
    }

    /**
     * Smooth scroll for navigation
     */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));

            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    /**
     * Interactive timeline navigation
     */

    const timelineSteps = document.querySelectorAll('.step');
    let currentStep = 0;

    function highlightStep(index) {
        timelineSteps.forEach((step, i) => {
            if (i === index) {
                step.classList.add('active');
                step.querySelector('.step-number').style.transform = 'scale(1.1)';
            } else {
                step.classList.remove('active');
                step.querySelector('.step-number').style.transform = 'scale(1)';
            }
        });
    }

    /**
     * Auto advance timeline
     */

    setInterval(() => {
        currentStep = (currentStep + 1) % timelineSteps.length;
        highlightStep(currentStep);
    }, 3000);
    const cards = document.querySelectorAll('.use-case-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const angleX = (y - centerY) / 20;
            const angleY = (centerX - x) / 20;

            card.style.transform = `
                perspective(1000px)
                rotateX(${angleX}deg)
                rotateY(${angleY}deg)
                translateY(-10px)
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    /**
     * Add floating particles in background
     */

    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    document.querySelector('.about-section').appendChild(particlesContainer);

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 3 + 2}s`;
        particle.style.animationDelay = `${Math.random() * 2}s`;
        particlesContainer.appendChild(particle);
    }
});

const particleStyles = `
.particles-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
}

.particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(108, 99, 255, 0.2);
    border-radius: 50%;
    animation: float-particle linear infinite;
}

@keyframes float-particle {
    0% {
        transform: translateY(0) scale(1);
        opacity: 0;
    }
    50% {
        opacity: 0.5;
        transform: translateY(-100px) scale(1.2);
    }
    100% {
        transform: translateY(-200px) scale(1);
        opacity: 0;
    }
}
`;

class Particle {
    constructor(container) {
        if (!container) return;
        this.container = container;
        this.element = document.createElement('div');
        this.element.className = 'particle';
        this.size = Math.random() * 4 + 2;
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.opacity = Math.random() * 0.5 + 0.2;

        this.position = {
            x: Math.random() * 100,
            y: Math.random() * 100
        };

        this.velocity = {
            x: (Math.random() - 0.5) * 2,
            y: -Math.random() * 1.5 - 0.5
        };

        this.element.style.left = `${this.position.x}%`;
        this.element.style.top = `${this.position.y}%`;

        this.container.appendChild(this.element);
    }

    update() {
        if (!this.element || !this.container) return; // Guard clause

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Wrap around screen
        if (this.position.x < 0) this.position.x = 100;
        if (this.position.x > 100) this.position.x = 0;
        if (this.position.y < 0) this.position.y = 100;
        if (this.position.y > 100) this.position.y = 0;

        this.element.style.left = `${this.position.x}%`;
        this.element.style.top = `${this.position.y}%`;
    }
}

/**
 * Initialize particle system
 */

const particleSystem = {
    particles: [],
    init() {
        let container = document.querySelector('.particles-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'particles-container';
            const aboutSection = document.querySelector('.about-section');
            if (aboutSection) {
                aboutSection.appendChild(container);
            } else {
                console.warn('About section not found, particles will not be initialized');
                return;
            }
        }
        this.particles = [];
        container.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const particle = new Particle(container);
            if (particle.element) {
                this.particles.push(particle);
            }
        }
        this.animate();
    },
    animate() {
        if (this.particles.length === 0) return;

        this.particles.forEach(particle => particle.update());
        requestAnimationFrame(() => this.animate());
    }
};



document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        particleSystem.init();
    }, 100);
});

const styleSheet = document.createElement('style');
styleSheet.textContent = particleStyles;
document.head.appendChild(styleSheet);