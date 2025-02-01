class Web3Service {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.networkId = null;
        this.setupEventListeners();
    }

    async init() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed');
        }
        this.web3 = new Web3(window.ethereum);
    }

    async connectWallet() {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            this.account = accounts[0];
            this.networkId = await this.web3.eth.getChainId();

            const contractAddress = CONFIG.CONTRACT_ADDRESSES[this.networkId];
            this.contract = new this.web3.eth.Contract(ContractABI, contractAddress);

            document.dispatchEvent(new CustomEvent(EVENTS.WALLET_CONNECTED, {
                detail: { account: this.account, networkId: this.networkId }
            }));

            return this.account;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        }
    }

    async signMessage(message) {
        try {
            const signature = await this.web3.eth.personal.sign(
                message,
                this.account
            );
            return signature;
        } catch (error) {
            console.error('Error signing message:', error);
            throw error;
        }
    }

    setupEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
            window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
            window.ethereum.on('disconnect', this.handleDisconnect.bind(this));
        }
    }

    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.handleDisconnect();
        } else {
            this.account = accounts[0];
            document.dispatchEvent(new CustomEvent(EVENTS.WALLET_CONNECTED, {
                detail: { account: this.account }
            }));
        }
    }

    handleChainChanged(chainId) {
        window.location.reload();
    }

    handleDisconnect() {
        this.account = null;
        this.contract = null;
        document.dispatchEvent(new CustomEvent(EVENTS.WALLET_DISCONNECTED));
    }
}

const web3Service = new Web3Service();