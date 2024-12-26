// navbar.js
document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-item');
    let mobileNav = null;

    // Create mobile navigation
    function createMobileNav() {
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

            // Add click events to mobile nav links
            const mobileNavItems = mobileNav.querySelectorAll('.nav-item');
            mobileNavItems.forEach(item => {
                item.addEventListener('click', handleNavClick);
            });
        }
    }

    // Handle navigation click
    function handleNavClick(e) {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href');

        // Remove active class from all items
        document.querySelectorAll('.nav-item').forEach(item =>
            item.classList.remove('active')
        );

        // Add active class to clicked item
        e.currentTarget.classList.add('active');

        // Scroll to section
        scrollToSection(targetId);

        // Close mobile menu
        closeMobileMenu();
    }

    // Function to scroll to section
    function scrollToSection(targetId) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const navHeight = navbar.offsetHeight;
            const targetPosition = targetElement.offsetTop - navHeight - 20; // Added extra offset

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Function to close mobile menu
    function closeMobileMenu() {
        hamburger?.classList.remove('active');
        mobileNav?.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Initialize mobile navigation
    createMobileNav();

    // Toggle mobile menu
    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileNav?.classList.toggle('active');
        document.body.style.overflow = mobileNav?.classList.contains('active') ? 'hidden' : '';
    });

    // Add click events to desktop nav items
    navItems.forEach(item => {
        item.addEventListener('click', handleNavClick);
    });

    // Update active section on scroll
    function updateActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        const navHeight = navbar.offsetHeight;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - navHeight - 100;
            const sectionBottom = sectionTop + section.offsetHeight;
            const scrollPosition = window.scrollY;

            const sectionId = `#${section.id}`;
            const navItems = document.querySelectorAll(`.nav-item[href="${sectionId}"]`);

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                document.querySelectorAll('.nav-item').forEach(item =>
                    item.classList.remove('active')
                );
                navItems.forEach(item => item.classList.add('active'));
            }
        });
    }

    // Handle scroll events
    let lastScroll = 0;
    let scrollTimer = null;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (scrollTimer) clearTimeout(scrollTimer);
        navbar.classList.add('is-scrolling');

        if (currentScroll > lastScroll && currentScroll > 100) {
            navbar.classList.add('navbar-hidden');
            closeMobileMenu();
        } else {
            navbar.classList.remove('navbar-hidden');
        }

        lastScroll = currentScroll;
        updateActiveSection();

        scrollTimer = setTimeout(() => {
            navbar.classList.remove('is-scrolling');
        }, 150);
    });

    // Close mobile menu on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileNav?.classList.contains('active')) {
            if (!mobileNav.contains(e.target) && !hamburger.contains(e.target)) {
                closeMobileMenu();
            }
        }
    });

    // Initialize active section
    updateActiveSection();
});