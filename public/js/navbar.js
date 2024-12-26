document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const header = document.querySelector('.header-nav');
    const navbar = document.querySelector('.navbar');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    // Scroll and position tracking variables
    let lastScroll = 0;
    let isScrolling = false;

    // Scroll handler with throttling
    function handleScroll() {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const currentScroll = window.pageYOffset;

                // Show/hide navbar based on scroll direction
                if (currentScroll > lastScroll && currentScroll > 100) {
                    header.classList.add('hide');
                } else {
                    header.classList.remove('hide');
                }

                // Add shadow/background when scrolled
                if (currentScroll > 50) {
                    navbar.style.background = 'rgba(16, 20, 35, 0.98)';
                } else {
                    navbar.style.background = 'rgba(16, 20, 35, 0.95)';
                }

                lastScroll = currentScroll;
                isScrolling = false;
            });
        }
        isScrolling = true;
    }

    // Mobile menu toggle
    function toggleMobileMenu() {
        mobileToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    }

    // Smooth scroll to section
    function smoothScroll(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            // Close mobile menu if open
            if (mobileMenu.classList.contains('active')) {
                toggleMobileMenu();
            }

            // Calculate scroll position
            const navHeight = navbar.offsetHeight;
            const targetPosition = targetSection.offsetTop - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Initialize navbar animation
    function initializeNavbar() {
        navbar.classList.add('animate-in');

        // Remove animation class after completion
        setTimeout(() => {
            navbar.classList.remove('animate-in');
        }, 500);
    }

    // Event Listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    mobileToggle.addEventListener('click', toggleMobileMenu);

    // Add smooth scroll to all nav links
    navLinks.forEach(link => link.addEventListener('click', smoothScroll));
    mobileNavLinks.forEach(link => link.addEventListener('click', smoothScroll));

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('active') &&
            !mobileMenu.contains(e.target) &&
            !mobileToggle.contains(e.target)) {
            toggleMobileMenu();
        }
    });

    // Initialize navbar
    initializeNavbar();

    // Cleanup function
    function cleanup() {
        window.removeEventListener('scroll', handleScroll);
        mobileToggle.removeEventListener('click', toggleMobileMenu);
        navLinks.forEach(link => link.removeEventListener('click', smoothScroll));
        mobileNavLinks.forEach(link => link.removeEventListener('click', smoothScroll));
    }

    // Handle cleanup on page unload
    window.addEventListener('unload', cleanup);
});