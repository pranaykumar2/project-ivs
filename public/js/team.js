document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });

    // Card Interaction Effects
    const cards = document.querySelectorAll('.card-wrapper');

    cards.forEach(card => {
        // Mouse move parallax effect
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate rotation and movement
            const rotateX = ((y - centerY) / centerY) * 10;
            const rotateY = ((centerX - x) / centerX) * 10;

            // Apply transform with smooth transition
            card.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                scale3d(1.02, 1.02, 1.02)
            `;

            // Dynamic shadow effect
            const shadowX = (x - centerX) / 10;
            const shadowY = (y - centerY) / 10;
            card.style.boxShadow = `
                ${shadowX}px ${shadowY}px 30px rgba(0, 0, 0, 0.2),
                inset ${-shadowX}px ${-shadowY}px 30px rgba(255, 255, 255, 0.05)
            `;

            // Glow effect following cursor
            const profileGlow = card.querySelector('.profile-glow');
            if (profileGlow) {
                profileGlow.style.background = `
                    radial-gradient(
                        circle at ${x}px ${y}px,
                        rgba(108, 99, 255, 0.4),
                        rgba(108, 99, 255, 0) 50%
                    )
                `;
            }
        });

        // Reset card on mouse leave
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
            const profileGlow = card.querySelector('.profile-glow');
            if (profileGlow) {
                profileGlow.style.background = '';
            }
        });
    });

    // Skill Tags Animation
    const skillTags = document.querySelectorAll('.skill-tag');
    skillTags.forEach(tag => {
        tag.addEventListener('mouseenter', () => {
            tag.style.transform = 'scale(1.1) rotate(2deg)';
            tag.style.background = 'var(--gradient-primary)';
            tag.style.border = 'none';
        });

        tag.addEventListener('mouseleave', () => {
            tag.style.transform = '';
            tag.style.background = '';
            tag.style.border = '';
        });
    });

    // Action Buttons Effects
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            // Create ripple effect
            const ripple = document.createElement('span');
            ripple.className = 'btn-ripple';
            btn.appendChild(ripple);

            // Position the ripple
            const rect = btn.getBoundingClientRect();
            ripple.style.left = '50%';
            ripple.style.top = '50%';

            // Animate and remove
            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        });

        btn.addEventListener('click', (e) => {
            // Add click animation
            btn.classList.add('clicked');
            setTimeout(() => btn.classList.remove('clicked'), 300);

            // Show success feedback
            if (btn.classList.contains('connect-btn')) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="ri-check-line"></i><span>Connected!</span>';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 2000);
            }
        });
    });

    // Interactive Background
    const bg = document.querySelector('.interactive-bg');
    const orb = document.querySelector('.glow-orb');

    document.addEventListener('mousemove', (e) => {
        if (orb) {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;

            // Move orb with parallax effect
            orb.style.transform = `translate(
                ${mouseX * 100 - 50}px,
                ${mouseY * 100 - 50}px
            )`;
        }
    });

    // Smooth section transitions
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Animate skill tags sequentially
                const skillTags = entry.target.querySelectorAll('.skill-tag');
                skillTags.forEach((tag, index) => {
                    setTimeout(() => {
                        tag.style.transform = 'translateY(0) scale(1)';
                        tag.style.opacity = '1';
                    }, index * 100);
                });

                // Animate social icons
                const socialIcons = entry.target.querySelectorAll('.social-icon');
                socialIcons.forEach((icon, index) => {
                    setTimeout(() => {
                        icon.style.transform = 'translateY(0) scale(1)';
                        icon.style.opacity = '1';
                    }, index * 100 + 500);
                });
            }
        });
    }, {
        threshold: 0.2
    });

    // Observe team cards
    document.querySelectorAll('.team-card').forEach(card => {
        observer.observe(card);
    });

    // Performance optimization for animations
    let frameRequest;
    window.addEventListener('scroll', () => {
        if (!frameRequest) {
            frameRequest = requestAnimationFrame(() => {
                updateParallax();
                frameRequest = null;
            });
        }
    });

    function updateParallax() {
        const scrolled = window.pageYOffset;
        const bg = document.querySelector('.interactive-bg');
        if (bg) {
            bg.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    }

    // Initialize tooltips with custom timing
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        let timeout;
        tooltip.addEventListener('mouseenter', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                tooltip.classList.add('tooltip-visible');
            }, 200);
        });

        tooltip.addEventListener('mouseleave', () => {
            clearTimeout(timeout);
            tooltip.classList.remove('tooltip-visible');
        });
    });
});