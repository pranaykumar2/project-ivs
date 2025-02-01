const CONFIG = {
    API_URL: 'https://api.ivs-testing.vercel.app',
    SUPPORTED_NETWORKS: {
        1: 'Ethereum Mainnet',
        5: 'Goerli Testnet',
        11155111: 'Sepolia Testnet',
        137: 'Polygon Mainnet'
    },
    CONTRACT_ADDRESSES: {
        1: '0x1234...', // Mainnet
        5: '0x5678...', // Goerli
        11155111: '0x9abc...', // Sepolia
        137: '0xdef0...' // Polygon
    },
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
    IPFS_GATEWAY: 'https://ipfs.io/ipfs/'
};

// API Endpoints
const ENDPOINTS = {
    PROFILE: '/api/user/profile',
    DOCUMENTS: '/api/documents',
    VERIFICATION: '/api/verify',
    NOTIFICATIONS: '/api/notifications'
};

// Event Names
const EVENTS = {
    WALLET_CONNECTED: 'walletConnected',
    WALLET_DISCONNECTED: 'walletDisconnected',
    DOCUMENT_UPLOADED: 'documentUploaded',
    VERIFICATION_STATUS_CHANGED: 'verificationStatusChanged'
};