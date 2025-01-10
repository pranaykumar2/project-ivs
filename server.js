require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./backend/config/database');
const { cleanupExpiredSessions } = require('./backend/utils/sessionCleanup');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Rate Limiting
 * */

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});


/**
 * Middleware
 * */

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "https://cdn.ethers.io",
                "https://unpkg.com"
            ],

            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net",
                "https://unpkg.com",
                "https://cdn.remixicon.com"
            ],

            imgSrc: ["'self'", "data:", "https:", "blob:"],

            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "https://cdn.remixicon.com"
            ],

            connectSrc: ["'self'", "https://api.etherscan.io", "https://mainnet.infura.io"],
            frameSrc: ["'self'"],
            mediaSrc: ["'self'"],
            objectSrc: ["'none'"],
            manifestSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/', limiter);

/**
 * Static file serving
 * */

app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/assets', express.static(path.join(__dirname, 'frontend', 'assets')));
app.use('/css', express.static(path.join(__dirname, 'frontend', 'css')));
app.use('/js', express.static(path.join(__dirname, 'frontend', 'js')));

/**
 * Import routes
 */

const authRoutes = require('./backend/routes/authRoutes');

/**
 *API Routes
 */
app.use('/api/auth', authRoutes);

/**
 *Frontend Routes
 */

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'auth.html'));
});

app.get('/verify-email', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'auth.html'));
});

app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'auth.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html'));
});

/**
 *API Health check
 */

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        environment: process.env.NODE_ENV
    });
});

/**
 *404 handler for API routes
 */

app.use('/api/*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'API route not found'
    });
});

/**
 *404 handler for frontend routes
 */

app.use('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', '404.html'));
});

/**
 *Error handling middlewares
 */

app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body
    });

    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

// Add request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
        body: req.body,
        query: req.query,
        headers: req.headers
    });
    next();
});

/**
 *Database connection and server start
 */
async function startServer() {
    try {
        // Test database connection
        await testConnection();

        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

/**
 * Handle uncaught exceptions and unhandled promise rejections
  */

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

/**
 * Cleanup expired sessions
 */
cleanupExpiredSessions().then(r => console.log('Expired sessions cleanup completed'));


/**
 * Start the server
 */
startServer();

module.exports = app;