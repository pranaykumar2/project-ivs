document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const header = document.querySelector('.header-nav');
    const navbar = document.querySelector('.navbar');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    // Scroll variables
    let lastScroll = 0;
    let isScrolling = false;

    // Handle scroll
    function handleScroll() {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const currentScroll = window.pageYOffset;

                // Show/hide navbar
                if (currentScroll > lastScroll && currentScroll > 100) {
                    header.style.transform = 'translate(-50%, -100%)';
                    // Close mobile menu if open
                    if (mobileMenu.classList.contains('active')) {
                        toggleMobileMenu();
                    }
                } else {
                    header.style.transform = 'translate(-50%, 0)';
                }

                // Update background opacity
                if (currentScroll > 50) {
                    navbar.style.background = 'rgba(16, 20, 35, 0.95)';
                } else {
                    navbar.style.background = 'rgba(16, 20, 35, 0.85)';
                }

                lastScroll = currentScroll;
                isScrolling = false;
            });
        }
        isScrolling = true;
    }

    // Toggle mobile menu
    function toggleMobileMenu() {
        mobileToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    }

    // Smooth scroll
    function smoothScroll(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            if (mobileMenu.classList.contains('active')) {
                toggleMobileMenu();
            }

            const navHeight = navbar.offsetHeight;
            const targetPosition = targetSection.offsetTop - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    mobileToggle.addEventListener('click', toggleMobileMenu);
    navLinks.forEach(link => link.addEventListener('click', smoothScroll));

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('active') &&
            !mobileMenu.contains(e.target) &&
            !mobileToggle.contains(e.target)) {
            toggleMobileMenu();
        }
    });

    // Cleanup
    window.addEventListener('unload', () => {
        window.removeEventListener('scroll', handleScroll);
        mobileToggle.removeEventListener('click', toggleMobileMenu);
        navLinks.forEach(link => link.removeEventListener('click', smoothScroll));
    });
});