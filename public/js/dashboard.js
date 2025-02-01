class Dashboard {
    constructor() {
        this.apiConfig = {
            baseUrl: 'https://project-ivs.vercel.app',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            this.handleUnauthorized();
            return;
        }

        this.apiConfig.headers.Authorization = authToken;

        this.initializeApp();
        this.setupEventListeners();
        this.initializeFilePond();
    }

    async initializeApp() {
        this.showLoader();
        try {
            await this.loadUserProfile();
            this.setupNavigation();
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            if (error.status === 401) {
                this.handleUnauthorized();
            } else {
                this.showNotification('Failed to load user data', 'error');
            }
        } finally {
            this.hideLoader();
        }
    }

    setupNavigation() {
        const defaultNavItem = document.querySelector('.nav-item');
        if (defaultNavItem) {
            this.handleNavigation(defaultNavItem);
        }

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.toggleMobileMenu(false);
                }
            });
        });

        const hamburgerBtn = document.getElementById('hamburgerBtn');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        document.addEventListener('click', (e) => {
            const navContainer = document.getElementById('navContainer');
            const hamburgerBtn = document.getElementById('hamburgerBtn');
            if (window.innerWidth <= 768 && navContainer && hamburgerBtn) {
                if (!navContainer.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                    this.toggleMobileMenu(false);
                }
            }
        });
    }

    async loadUserProfile() {
        try {
            console.log('Making request to:', `${this.apiConfig.baseUrl}/api/user/profile`);
            console.log('With headers:', this.apiConfig.headers);

            const response = await fetch(`${this.apiConfig.baseUrl}/api/user/profile`, {
                method: 'GET',
                headers: this.apiConfig.headers
            });

            console.log('Response status:', response.status);
            const responseText = await response.text();
            console.log('Raw response:', responseText);

            let userData;
            try {
                userData = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                throw new Error('Invalid response format from server');
            }

            if (response.status === 401) {
                this.handleUnauthorized();
                throw { status: 401, message: userData.message || 'Session expired' };
            }

            if (!response.ok) {
                throw new Error(userData.message || `HTTP error! status: ${response.status}`);
            }

            if (userData.status === 'success' && userData.data) {
                this.updateProfileUI(userData.data);
                this.userData = userData.data;
                return userData.data;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            if (error.status === 401) {
                this.handleUnauthorized();
            } else {
                this.showNotification('Failed to load user profile. Please refresh the page.', 'error');
            }
            throw error;
        }
    }

    updateProfileUI(userData) {
        const profileWrapper = document.getElementById('userProfileWrapper');
        if (!profileWrapper) return;

        const loader = document.getElementById('profileLoader');
        if (loader) loader.style.display = 'none';

        const defaultProfileImage = 'https://i.ibb.co/KqCnT6M/2023-02-12-07-03-07-UTC-profile-pic.jpg';

        const profileContent = `
            <img src="${userData.profileImage || defaultProfileImage}" 
                 alt="Profile" 
                 class="profile-image"
                 onerror="this.src='${defaultProfileImage}'">
            <div class="profile-tooltip">
                <div class="user-info">
                    <span class="username">${userData.name}</span>
                    <span class="email">${userData.email}</span>
                    ${userData.walletAddress ?
            `<span class="wallet">${this.formatWalletAddress(userData.walletAddress)}</span>`
            : ''}
                </div>
                <div class="profile-actions">
                    <button onclick="window.dashboard.handleLogout()" class="logout-btn">
                        <i class="bi bi-box-arrow-right"></i> Logout
                    </button>
                </div>
            </div>
        `;

        profileWrapper.innerHTML = profileContent;

        if (window.innerWidth <= 768) {
            const profileImage = profileWrapper.querySelector('.profile-image');
            profileImage.addEventListener('click', () => {
                const tooltip = profileWrapper.querySelector('.profile-tooltip');
                tooltip.classList.toggle('show');
            });
        }
    }

    formatWalletAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = e.currentTarget.dataset.section;
                if (sectionId) {
                    this.handleNavigation(e.currentTarget);
                    if (window.innerWidth <= 768) {
                        this.toggleMobileMenu(false);
                    }
                }
            });
        });

        const hamburgerBtn = document.getElementById('hamburgerBtn');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMobileMenu();
            });
        }

        document.addEventListener('click', (e) => {
            const navContainer = document.getElementById('navContainer');
            const hamburgerBtn = document.getElementById('hamburgerBtn');

            if (window.innerWidth <= 768 &&
                navContainer &&
                hamburgerBtn &&
                !navContainer.contains(e.target) &&
                !hamburgerBtn.contains(e.target)) {
                this.toggleMobileMenu(false);
            }
        });

        window.addEventListener('scroll', () => {
            const nav = document.querySelector('.floating-nav');
            if (window.scrollY > 20) {
                nav.style.background = 'var(--surface-dark)';
            } else {
                nav.style.background = 'var(--nav-bg)';
            }
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth > 768) { // Only for desktop
                const profileWrapper = document.getElementById('userProfileWrapper');
                if (profileWrapper && !profileWrapper.contains(e.target)) {
                    const tooltip = profileWrapper.querySelector('.profile-tooltip');
                    if (tooltip) tooltip.classList.remove('show');
                }
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.toggleMobileMenu(false);
            }
        });
    }

    toggleMobileMenu(show = null) {
        const navContainer = document.getElementById('navContainer');
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        let overlay = document.querySelector('.mobile-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-overlay';
            document.body.appendChild(overlay);

            overlay.addEventListener('click', () => {
                this.toggleMobileMenu(false);
            });
        }

        if (show === null) {
            show = !navContainer.classList.contains('active');
        }

        if (show) {
            navContainer.classList.add('active');
            overlay.classList.add('active');
            hamburgerBtn.classList.add('active');
            hamburgerBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
            document.body.style.overflow = 'hidden';
        } else {
            navContainer.classList.remove('active');
            overlay.classList.remove('active');
            hamburgerBtn.classList.remove('active');
            hamburgerBtn.innerHTML = '<i class="bi bi-list"></i>';
            document.body.style.overflow = '';
        }
    }

    initializeFilePond() {
        FilePond.registerPlugin(FilePondPluginImagePreview);
        document.querySelectorAll('input[type="file"].filepond').forEach(inputElement => {
            const pond = FilePond.create(inputElement, {
                allowMultiple: false,
                maxFileSize: '3MB',
                allowFileTypeValidation: true,
                acceptedFileTypes: ['image/*', 'application/pdf'],
                labelIdle: 'Drag & Drop your files or <span class="filepond--label-action">Browse</span>',
                styleButtonRemoveItemPosition: 'right',
                styleLoadIndicatorPosition: 'center',
                styleProgressIndicatorPosition: 'center',
                styleButtonProcessItemPosition: 'right',
                server: {
                    process: {
                        url: `${this.apiConfig.baseUrl}/api/upload`,
                        headers: this.apiConfig.headers,
                        onload: (response) => {
                            this.showNotification('File uploaded successfully!', 'success');
                            return response;
                        },
                        onerror: (response) => {
                            this.showNotification('Failed to upload file', 'error');
                            return response;
                        }
                    }
                }
            });

            pond.on('addfile', (error, file) => {
                if (error) {
                    this.showNotification(error.message, 'error');
                    return;
                }
            });
        });
    }

    handleNavigation(navItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        navItem.classList.add('active');
        const sectionId = navItem.dataset.section;
        this.showSection(sectionId);
    }

    showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(`${sectionId}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    showLoader() {
        const loader = document.querySelector('.loader-wrapper');
        loader.classList.add('active');
    }

    hideLoader() {
        const loader = document.querySelector('.loader-wrapper');
        loader.classList.remove('active');
    }

    showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="ri-${type === 'success' ? 'checkbox-circle' :
            type === 'error' ? 'error-warning' :
                type === 'warning' ? 'alert-line' : 'information'}-line"></i>
            <span>${message}</span>
        `;

        const container = document.getElementById('toastContainer') || (() => {
            const newContainer = document.createElement('div');
            newContainer.id = 'toastContainer';
            newContainer.className = 'toast-container';
            document.body.appendChild(newContainer);
            return newContainer;
        })();

        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    }

    handleUnauthorized() {
        console.log('Handling unauthorized access...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        this.showNotification('Session expired. Please login again.', 'warning');

        setTimeout(() => {
            window.location.href = '/auth.html';
        }, 2000);
    }

    async handleLogout() {
        try {
            localStorage.removeItem('authToken');
            this.showNotification('Successfully logged out', 'success');
            setTimeout(() => {
                window.location.href = '/auth';
            }, 1000);
        } catch (error) {
            console.error('Error during logout:', error);
            this.showNotification('Error during logout', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});