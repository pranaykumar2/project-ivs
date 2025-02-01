document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const submitBtn = contactForm.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnIcon = submitBtn.querySelector('.btn-icon');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const successModal = document.querySelector('.success-modal');
    const modalCloseBtn = successModal?.querySelector('.modal-close');
    const inputs = document.querySelectorAll('input, textarea');

    /**
     * Input focus effects
     */

    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
            validateInput(input);
        });

        input.addEventListener('input', () => {
            validateInput(input);
        });
    });

    /**
     * Input validation function
     */

    function validateInput(input) {
        const wrapper = input.parentElement;

        if (input.value.trim() === '') {
            wrapper.classList.remove('valid');
            return false;
        }

        if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                wrapper.classList.remove('valid');
                return false;
            }
        }

        wrapper.classList.add('valid');
        return true;
    }

    /**
     * Form submission handling
     */

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all inputs
        let isValid = true;
        inputs.forEach(input => {
            if (!validateInput(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            showFormError('Please fill in all fields correctly');
            return;
        }

        setLoadingState(true);
        const formData = new FormData(contactForm);
        const formDataObj = Object.fromEntries(formData.entries());

        try {
            await simulateApiCall(formDataObj);
            showSuccessMessage();
            contactForm.reset();
            inputs.forEach(input => {
                input.parentElement.classList.remove('valid', 'focused');
            });

        } catch (error) {
            showFormError('Something went wrong. Please try again.');
        } finally {
            setLoadingState(false);
        }
    });

    function setLoadingState(isLoading) {
        submitBtn.disabled = isLoading;

        if (isLoading) {
            btnText.style.opacity = '0';
            btnIcon.style.opacity = '0';
            btnLoading.style.opacity = '1';
            btnLoading.style.visibility = 'visible';
        } else {
            btnText.style.opacity = '1';
            btnIcon.style.opacity = '1';
            btnLoading.style.opacity = '0';
            btnLoading.style.visibility = 'hidden';
        }
    }

    function showSuccessMessage() {
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Auto hide after 3 seconds
        setTimeout(() => {
            hideSuccessMessage();
        }, 3000);
    }

    function hideSuccessMessage() {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    modalCloseBtn?.addEventListener('click', hideSuccessMessage);
    successModal?.addEventListener('click', (e) => {
        if (e.target === successModal) {
            hideSuccessMessage();
        }
    });

    function showFormError(message) {
        let errorElement = contactForm.querySelector('.form-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            submitBtn.parentElement.insertBefore(errorElement, submitBtn);
        }

        errorElement.textContent = message;
        errorElement.style.opacity = '1';
        errorElement.style.transform = 'translateY(0)';

        setTimeout(() => {
            errorElement.style.opacity = '0';
            errorElement.style.transform = 'translateY(-10px)';
        }, 3000);
    }

    function simulateApiCall(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Form data:', data);
                resolve({ success: true });
            }, 2000);
        });
    }

    const gradientSphere = document.querySelector('.gradient-sphere');
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Smooth animation for gradient sphere
        requestAnimationFrame(() => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const moveX = (mouseX - centerX) * 0.1;
            const moveY = (mouseY - centerY) * 0.1;

            gradientSphere.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
        });
    });
});