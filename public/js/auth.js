class AuthController {
    constructor() {
        this.initializeElements();
        this.setupAuthState();
        this.bindEvents();
        this.setupBackgroundEffects();
        this.initializeWeb3();
    }

    showError(message) {
        console.error('Registration error:', message);
        this.showToast(message, 'error');
    }

    // Clear Forms Method
    clearForms() {
        [this.loginForm, this.registerForm].forEach(form => {
            if (form) {
                form.reset();
                form.querySelectorAll('.form-group').forEach(group => {
                    group.classList.remove('error');
                    const errorElement = group.querySelector('.error-message');
                    if (errorElement) errorElement.textContent = '';
                });
            }
        });
    }

    // Show Success Modal Method
    showSuccessModal() {
        if (this.successModal) {
            this.successModal.classList.add('active');
            setTimeout(() => {
                this.successModal.classList.remove('active');
                this.switchForm('login');
            }, 2000);
        } else {
            // Fallback if modal element doesn't exist
            this.showToast('Account created successfully!', 'success');
            setTimeout(() => this.switchForm('login'), 2000);
        }
    }

    // Helper method to handle errors
    showError(element, message) {
        this.showToast(message, 'error');
    }

    // Initialize Web3
    async initializeWeb3() {
        this.web3State = {
            provider: null,
            signer: null,
            account: null,
            chainId: null,
            connected: false
        };

        if (typeof window.ethereum !== 'undefined') {
            try {
                // Initialize ethers provider
                this.web3State.provider = new ethers.providers.Web3Provider(window.ethereum);

                // Setup event listeners
                this.setupWeb3Events();

                // Check if already connected
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.userAccount = accounts[0];
                    this.isConnected = true;
                    this.updateWalletUI();
                }
            } catch (error) {
                console.error('Web3 initialization error:', error);
            }
        }
    }

    // Initialize DOM Elements
    initializeElements() {
        // Forms
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.switchButtons = document.querySelectorAll('.switch-btn');

        // Modals
        this.successModal = document.querySelector('.success-modal');
        this.web3Modal = document.getElementById('web3Modal');

        // Web3 Elements
        this.web3LoginBtn = document.getElementById('web3LoginBtn');
        this.walletOptions = document.querySelectorAll('.wallet-option');
        this.closeWeb3Modal = document.getElementById('closeWeb3Modal');
        this.walletStatus = document.querySelector('.wallet-status');

        // Current active form
        this.currentForm = 'login';

        // Web3 state initialization
        this.web3State = {
            provider: null,
            signer: null,
            account: null,
            chainId: null,
            connected: false
        };

        // Add specific references for the switcher
        this.formSwitcher = document.querySelector('.form-switcher');
        this.switchIndicator = document.querySelector('.switch-indicator');
    }

    // Bind Event Listeners
    bindEvents() {
        // Form switching
        this.switchButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchForm(btn.dataset.form));
        });

        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleSubmit(e, 'login'));
        this.registerForm.addEventListener('submit', (e) => this.handleSubmit(e, 'register'));

        // Web3 related events
        this.web3LoginBtn.addEventListener('click', () => this.showWeb3Modal());
        this.closeWeb3Modal.addEventListener('click', () => this.hideWeb3Modal());

        this.walletOptions.forEach(option => {
            option.addEventListener('click', () => this.connectWallet(option.dataset.wallet));
        });

        // Password toggles
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePassword(e));
        });

        // Input validations
        document.querySelectorAll('.input-field').forEach(input => {
            input.addEventListener('blur', (e) => this.validateInput(e));
            input.addEventListener('input', (e) => this.clearError(e));
        });

        // Setup Web3 events if provider exists
        if (window.ethereum) {
            this.setupWeb3Events();
        }
    }

    // Setup Web3 Event Listeners
    setupWeb3Events() {
        if (window.ethereum) {
            // Handle account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.handleDisconnect();
                } else {
                    this.handleAccountsChanged(accounts);
                }
            });

            // Handle chain changes
            window.ethereum.on('chainChanged', (chainId) => {
                this.handleChainChanged(chainId);
            });

            // Handle disconnect
            window.ethereum.on('disconnect', (error) => {
                this.handleDisconnect();
            });
        }
    }

    // Web3 Modal Management
    showWeb3Modal() {
        this.web3Modal.classList.add('active');
    }

    hideWeb3Modal() {
        this.web3Modal.classList.remove('active');
    }

    // Update wallet status UI
    updateWalletStatus(message, isLoading = true) {
        this.walletStatus.style.display = 'block';
        const statusIcon = this.walletStatus.querySelector('.status-icon i');
        const statusMessage = this.walletStatus.querySelector('.status-message');

        statusIcon.className = isLoading ? 'ri-loader-4-line' : 'ri-checkbox-circle-line';
        statusMessage.textContent = message;
    }

    // Wallet Connection
    async connectWallet(walletType) {
        try {
            this.updateWalletStatus('Connecting to wallet...');
            let accounts;

            switch (walletType) {
                case 'metamask':
                    if (!window.ethereum) {
                        this.showToast('Please install MetaMask!', 'error');
                        return;
                    }

                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    await provider.send("eth_requestAccounts", []);
                    const signer = provider.getSigner();
                    accounts = [await signer.getAddress()];

                    // Update web3 state
                    this.web3State.provider = provider;
                    this.web3State.signer = signer;
                    break;

                case 'walletconnect':
                    this.showToast('WalletConnect coming soon!', 'info');
                    return;

                case 'coinbase':
                    this.showToast('Coinbase Wallet coming soon!', 'info');
                    return;

                default:
                    this.showToast('Unsupported wallet type', 'error');
                    return;
            }

            if (accounts && accounts[0]) {
                this.userAccount = accounts[0];
                this.isConnected = true;
                this.web3State.account = accounts[0];
                this.web3State.connected = true;

                // Get chain ID
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                this.web3State.chainId = chainId;

                this.updateWalletStatus('Connected successfully!', false);
                setTimeout(() => {
                    this.hideWeb3Modal();
                    this.updateWalletUI();
                }, 1500);

                this.showToast('Wallet connected successfully!', 'success');
            }
        } catch (error) {
            this.updateWalletStatus('Connection failed', false);
            if (error.code === 4001) {
                this.showToast('Connection rejected by user', 'error');
            } else {
                this.showToast(error.message, 'error');
            }
        } finally {
            setTimeout(() => {
                this.walletStatus.style.display = 'none';
            }, 2000);
        }
    }

    // Handle account changes
    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.handleDisconnect();
        } else if (accounts[0] !== this.web3State.account) {
            this.web3State.account = accounts[0];
            this.userAccount = accounts[0];
            this.updateWalletUI();
            this.showToast('Account changed', 'info');
        }
    }

    // Handle chain changes
    handleChainChanged(chainId) {
        this.web3State.chainId = chainId;
        this.showToast(`Network changed to ${this.getNetworkName(chainId)}`, 'info');
        window.location.reload();
    }

    // Handle disconnect
    handleDisconnect() {
        this.web3State.connected = false;
        this.web3State.account = null;
        this.userAccount = null;
        this.isConnected = false;
        this.updateWalletUI();
        this.showToast('Wallet disconnected', 'info');
    }

    // Update UI after wallet connection
    updateWalletUI() {
        if (this.isConnected && this.userAccount) {
            this.web3LoginBtn.classList.add('connected');
            const shortAddress = `${this.userAccount.slice(0, 6)}...${this.userAccount.slice(-4)}`;
            this.web3LoginBtn.innerHTML = `
                <i class="ri-wallet-3-line"></i>
                <span>${shortAddress}</span>
            `;
        } else {
            this.web3LoginBtn.classList.remove('connected');
            this.web3LoginBtn.innerHTML = `
                <i class="ri-wallet-3-line"></i>
                <span>Connect Wallet</span>
            `;
        }
    }

    // Get network name from chain ID
    getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum Mainnet',
            '0x3': 'Ropsten',
            '0x4': 'Rinkeby',
            '0x5': 'Goerli',
            '0x2a': 'Kovan',
            '0x38': 'BSC Mainnet',
            '0x61': 'BSC Testnet',
            '0x89': 'Polygon Mainnet',
            '0x13881': 'Mumbai Testnet',
            '0xa86a': 'Avalanche'
        };
        return networks[chainId] || 'Unknown Network';
    }

    // Toast Notification System
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="ri-${type === 'success' ? 'checkbox-circle' :
            type === 'error' ? 'error-warning' :
                type === 'warning' ? 'alert-line' :
                    'information'}-line"></i>
            <span>${message}</span>
        `;

        const container = document.getElementById('toastContainer');
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.id = 'toastContainer';
            newContainer.className = 'toast-container';
            document.body.appendChild(newContainer);
        }

        container.appendChild(toast);

        // Trigger reflow for animation
        toast.offsetHeight;

        // Add show class
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Form switching
    switchForm(formType) {
        if (this.currentForm === formType) return;

        this.switchButtons.forEach(btn => {
            const isActive = btn.dataset.form === formType;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });

        const currentForm = document.getElementById(`${this.currentForm}Form`);
        const targetForm = document.getElementById(`${formType}Form`);

        currentForm.classList.add('inactive');
        targetForm.classList.remove('inactive');

        this.updateSwitchIndicator(formType);
        this.currentForm = formType;
        this.clearForms();
    }

    // Update switch indicator position
    updateSwitchIndicator(formType) {
        this.switchIndicator.style.transition = 'none';
        this.switchIndicator.offsetHeight;

        const activeButton = this.formSwitcher.querySelector(`[data-form="${formType}"]`);
        const switcherRect = this.formSwitcher.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();

        const leftPosition = buttonRect.left - switcherRect.left;

        // Re-enable transition and move
        this.switchIndicator.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        this.switchIndicator.style.transform = `translateX(${leftPosition}px)`;
    }

    // Password Visibility Toggle
    togglePassword(e) {
        const button = e.currentTarget;
        const input = button.parentElement.querySelector('.input-field');
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('ri-eye-line', 'ri-eye-off-line');
        } else {
            input.type = 'password';
            icon.classList.replace('ri-eye-off-line', 'ri-eye-line');
        }
    }

    // Form Validation
    validateInput(e) {
        const input = e.target;
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch(input.type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                errorMessage = isValid ? '' : 'Please enter a valid email address';
                break;

            case 'password':
                const minLength = value.length >= 8;
                const hasUpperCase = /[A-Z]/.test(value);
                const hasLowerCase = /[a-z]/.test(value);
                const hasNumber = /\d/.test(value);
                const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

                isValid = minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

                if (!isValid) {
                    errorMessage = 'Password must:';
                    if (!minLength) errorMessage += '\n• Be at least 8 characters';
                    if (!hasUpperCase) errorMessage += '\n• Contain at least one uppercase letter';
                    if (!hasLowerCase) errorMessage += '\n• Contain at least one lowercase letter';
                    if (!hasNumber) errorMessage += '\n• Contain at least one number';
                    if (!hasSpecialChar) errorMessage += '\n• Contain at least one special character';
                }
                break;

            case 'text':
                isValid = value.length >= 2;
                errorMessage = isValid ? '' : 'This field is required';
                break;
        }

        this.setInputStatus(input, isValid, errorMessage);
        return isValid;
    }

    // Set Input Status
    setInputStatus(input, isValid, message = '') {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');

        formGroup.classList.toggle('error', !isValid);
        if (errorElement) {
            if (message.includes('\n')) {
                // Handle multiline error messages
                const messageLines = message.split('\n');
                errorElement.innerHTML = `
                <i class="ri-error-warning-line"></i>
                <div class="error-list">
                    ${messageLines.map(line => `<div>${line}</div>`).join('')}
                </div>
            `;
            } else {
                errorElement.innerHTML = message ? `<i class="ri-error-warning-line"></i>${message}` : '';
            }
        }
    }

    // Clear Error State
    clearError(e) {
        const formGroup = e.target.closest('.form-group');
        formGroup.classList.remove('error');
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) errorElement.textContent = '';
    }

    // Form Submission Handler
    async handleSubmit(e, formType) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('.submit-btn');

        // Validate all inputs
        let isValid = true;
        form.querySelectorAll('.input-field').forEach(input => {
            if (!this.validateInput({ target: input })) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showToast('Please fill all required fields correctly', 'error');
            return;
        }

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            // Prepare form data
            const data = {
                ...(formType === 'login' ? {
                    email: form.querySelector('#loginEmail')?.value?.trim(),
                    password: form.querySelector('#loginPassword')?.value
                } : {
                    name: form.querySelector('#registerName')?.value?.trim(),
                    email: form.querySelector('#registerEmail')?.value?.trim(),
                    password: form.querySelector('#registerPassword')?.value,
                    walletAddress: this.isConnected ? this.userAccount : null
                })
            };

            // Make the API call
            const response = await this.simulateApiCall(formType, data);

            if (response.status === 'success') {
                this.showToast(response.message, 'success');

                if (formType === 'register') {
                    // Show success modal and switch to login
                    this.showSuccessModal();
                    setTimeout(() => {
                        this.switchForm('login');
                    }, 2000);
                } else if (formType === 'login') {
                    // Redirect to dashboard after successful login
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 1000);
                }
            }
        } catch (error) {
            this.showToast(error.message || 'An error occurred', 'error');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    // Update the simulateApiCall method in AuthController class
    async simulateApiCall(type, data) {
        const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/register';

        try {
            console.log(`Making ${type} request to ${endpoint}`, data); // Add data logging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(data),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const responseData = await response.json();
            console.log(`${type} response:`, responseData);

            if (!response.ok) {
                throw new Error(responseData.message || `${type} failed`);
            }

            if (type === 'login' && responseData.data?.token) {
                localStorage.setItem('authToken', `Bearer ${responseData.data.token}`);
                localStorage.setItem('userData', JSON.stringify(responseData.data.user));
            }

            return responseData;
        } catch (error) {
            console.error(`${type} error:`, error);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            throw error;
        }
    }


    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        return !!token;
    }
    // Background Effects
    setupBackgroundEffects() {
        const spheres = document.querySelectorAll('.gradient-sphere');

        // Parallax effect on mouse move
        document.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            spheres.forEach((sphere, index) => {
                const speed = index === 0 ? 0.02 : 0.01;
                const x = (clientX - centerX) * speed;
                const y = (clientY - centerY) * speed;

                sphere.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
    }
    // Add this method to the AuthController class
    setupAuthState() {
        // Check if user is already logged in
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');

        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                // Add any additional auth state setup
                return true;
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.logout();
                return false;
            }
        }
        return false;
    }

// Add logout method
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/auth';
    }

    getUserData() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthController();
});