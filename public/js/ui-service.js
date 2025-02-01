class UIService {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAOS();
        this.initializeFilePond();
    }

    initializeElements() {
        this.sidebar = document.querySelector('.sidebar');
        this.navItems = document.querySelectorAll('.nav-item');
        this.contentSections = document.querySelectorAll('.content-section');
        this.avatarInput = document.getElementById('avatarInput');
        this.profileAvatar = document.getElementById('profileAvatar');
        this.userNameDisplay = document.getElementById('userName');
        this.userEmailDisplay = document.getElementById('userEmail');
        this.connectWalletBtn = document.getElementById('connectMetaMask');
        this.walletStatus = document.getElementById('connectionStatus');
        this.walletAddress = document.getElementById('walletAddressDisplay');
        this.notificationPanel = document.getElementById('notificationPanel');
        this.notificationList = document.querySelector('.notification-list');
        this.modals = document.querySelectorAll('.modal');
    }

    setupEventListeners() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        this.avatarInput?.addEventListener('change', (e) => this.handleAvatarUpload(e));

        this.connectWalletBtn?.addEventListener('click', () => this.handleWalletConnection());

        this.modals.forEach(modal => {
            const closeBtn = modal.querySelector('.close-modal');
            closeBtn?.addEventListener('click', () => this.closeModal(modal));
        });

        document.addEventListener(EVENTS.WALLET_CONNECTED, (e) => this.updateWalletUI(e.detail));
        document.addEventListener(EVENTS.WALLET_DISCONNECTED, () => this.resetWalletUI());
    }

    handleNavigation(e) {
        e.preventDefault();
        const targetSection = e.currentTarget.dataset.section;

        this.navItems.forEach(item => item.classList.remove('active'));
        e.currentTarget.classList.add('active');

        this.contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${targetSection}Section`) {
                section.classList.add('active');
            }
        });
    }

    updateProfileUI(profileData) {
        this.userNameDisplay.textContent = profileData.name;
        this.userEmailDisplay.textContent = profileData.email;
        if (profileData.avatar) {
            this.profileAvatar.src = profileData.avatar;
        }
    }

    updateWalletUI({ account, networkId }) {
        this.walletStatus.innerHTML = `
            <span class="status-dot connected"></span>
            <span class="status-text">Connected</span>
        `;
        this.walletAddress.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
        this.connectWalletBtn.classList.add('connected');
    }

    resetWalletUI() {
        this.walletStatus.innerHTML = `
            <span class="status-dot disconnected"></span>
            <span class="status-text">Not Connected</span>
        `;
        this.walletAddress.textContent = 'Connect your wallet to continue';
        this.connectWalletBtn.classList.remove('connected');
    }

    showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="ph ph-${type === 'success' ? 'check-circle' :
            type === 'error' ? 'x-circle' :
                'info'}"></i>
            <span>${message}</span>
        `;

        document.getElementById('toastContainer').appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    initializeAOS() {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }

    initializeFilePond() {
        FilePond.registerPlugin(FilePondPluginImagePreview);

        const inputElement = document.querySelector('input[type="file"].filepond');
        if (inputElement) {
            const pond = FilePond.create(inputElement, {
                allowMultiple: false,
                maxFileSize: CONFIG.MAX_FILE_SIZE,
                acceptedFileTypes: CONFIG.SUPPORTED_FILE_TYPES,
                server: {
                    process: {
                        url: `${CONFIG.API_URL}${ENDPOINTS.DOCUMENTS}`,
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        }
                    }
                }
            });
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal?.classList.add('active');
    }

    closeModal(modal) {
        modal.classList.remove('active');
    }
}

const uiService = new UIService();