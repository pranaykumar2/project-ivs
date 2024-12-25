document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navItems = document.querySelectorAll('.nav-item');
    let mobileNav = null;

    // Create mobile navigation
    function createMobileNav() {
        // Create mobile nav container if it doesn't exist
        if (!mobileNav) {
            mobileNav = document.createElement('div');
            mobileNav.className = 'mobile-nav';

            // Clone navigation links
            const navLinks = document.querySelector('.nav-links').cloneNode(true);

            // Clone CTA button
            const ctaButton = document.querySelector('.cta-button').cloneNode(true);

            // Add to mobile nav
            mobileNav.appendChild(navLinks);
            mobileNav.appendChild(ctaButton);

            // Add to body
            document.body.appendChild(mobileNav);

            // Add click events to mobile nav items
            mobileNav.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    closeMobileMenu();
                });
            });
        }
    }

    // Initialize mobile navigation
    createMobileNav();

    // Function to close mobile menu
    function closeMobileMenu() {
        hamburger?.classList.remove('active');
        mobileNav?.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Toggle mobile menu
    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileNav?.classList.toggle('active');

        // Toggle body scroll
        if (mobileNav?.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });

    // Handle navigation items click
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');
        });
    });

    // Smooth hide/show navbar on scroll
    let lastScroll = 0;
    let scrollTimer = null;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Clear previous timeout
        if (scrollTimer) clearTimeout(scrollTimer);

        // Add scrolling class for transition effects
        navbar.classList.add('is-scrolling');

        // Hide/show navbar based on scroll direction
        if (currentScroll > lastScroll && currentScroll > 100) {
            // Scrolling down & past navbar
            navbar.classList.add('navbar-hidden');
            closeMobileMenu();
        } else {
            // Scrolling up or at top
            navbar.classList.remove('navbar-hidden');
        }

        // Update scroll position
        lastScroll = currentScroll;

        // Remove scrolling class after scroll ends
        scrollTimer = setTimeout(() => {
            navbar.classList.remove('is-scrolling');
        }, 150);
    });

    // Close mobile menu on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileNav?.classList.contains('active')) {
            // Check if click is outside mobile nav and hamburger
            if (!mobileNav.contains(e.target) && !hamburger.contains(e.target)) {
                closeMobileMenu();
            }
        }
    });

    // Handle smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add resize observer for dynamic height adjustments
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            if (entry.target === navbar) {
                document.body.style.setProperty('--nav-height', `${entry.contentRect.height}px`);
            }
        }
    });

    resizeObserver.observe(navbar);

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Reset navbar state when page becomes visible
            navbar.classList.remove('navbar-hidden');
        }
    });

    // Add touch event handling for mobile
    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        touchEndY = e.touches[0].clientY;

        const deltaY = touchEndY - touchStartY;

        // Show/hide navbar based on touch direction
        if (deltaY < -50 && window.pageYOffset > 100) {
            navbar.classList.add('navbar-hidden');
            closeMobileMenu();
        } else if (deltaY > 50) {
            navbar.classList.remove('navbar-hidden');
        }
    }, { passive: true });
});