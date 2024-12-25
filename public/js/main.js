document.addEventListener('DOMContentLoaded', () => {
    // Animate stats numbers
    const animateStats = () => {
        const stats = document.querySelectorAll('.stat-number');

        stats.forEach(stat => {
            const targetValue = parseFloat(stat.dataset.value);
            const duration = 2000; // 2 seconds
            const steps = 60;
            const stepValue = targetValue / steps;
            let currentValue = 0;
            let currentStep = 0;

            const updateValue = () => {
                currentStep++;
                currentValue = stepValue * currentStep;

                if (currentValue <= targetValue) {
                    stat.textContent = currentValue.toFixed(1);
                    requestAnimationFrame(updateValue);
                } else {
                    stat.textContent = targetValue;
                }
            };

            updateValue();
        });
    };

    // Ethereum coin interaction
    const ethCoin = document.querySelector('.eth-coin');
    const container = document.querySelector('.ethereum-container');

    if (ethCoin && container) {
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            ethCoin.style.transform = `
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg)
                translateY(${Math.sin(Date.now() / 1000) * 10}px)
            `;
        });

        container.addEventListener('mouseleave', () => {
            ethCoin.style.transform = '';
        });
    }

    // Initialize animations
    animateStats();

    // Smooth scroll for anchor links
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
});

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll functionality
    const learnMoreBtn = document.getElementById('learnMoreBtn');

    learnMoreBtn.addEventListener('click', () => {
        // Get the target section
        const targetSection = document.getElementById('about');

        // Add click animation to button
        learnMoreBtn.classList.add('clicked');

        // Smooth scroll to about section
        targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        // Optional: Add active state to button
        setTimeout(() => {
            learnMoreBtn.classList.remove('clicked');
        }, 300);
    });
});

// Add this to your main.js
document.addEventListener('DOMContentLoaded', () => {
    // Previous button click handler code...

    // Scroll Progress Indicator
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'scroll-progress';
    document.body.appendChild(progressIndicator);

    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressIndicator.style.width = scrolled + '%';
    });
});