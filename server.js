require('dotenv').config();
const fastify = require('fastify')({
    logger: true,
    trustProxy: true,
    ignoreTrailingSlash: true
});
const path = require('path');
const mongoose = require('mongoose');

/**
 * CORS Configuration
 */

fastify.register(require('@fastify/cors'), {
    origin: [
        'http://localhost:3000',
        'http://localhost:9002',
        'https://project-ivs.vercel.app',
        'https://api.project-ivs.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
});

/**
 * Helmet Configuration for Security Headers
 */

fastify.register(require('@fastify/helmet'), {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "cdnjs.cloudflare.com",
                "cdn.jsdelivr.net",
                "unpkg.com",
                "https://cdn.ethers.io",
                "https://api.project-ivs.vercel.app"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "fonts.googleapis.com",
                "cdn.jsdelivr.net",
                "unpkg.com",
                "cdnjs.cloudflare.com",
                "https://unpkg.com/@phosphor-icons/web@2.0.3"
            ],
            fontSrc: [
                "'self'",
                "fonts.gstatic.com",
                "cdn.jsdelivr.net",
                "cdnjs.cloudflare.com",
                "https://unpkg.com/@phosphor-icons",
                "https://unpkg.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "i.ibb.co",
                "unpkg.com",
                "blob:",
                "https://api.project-ivs.vercel.app"
            ],
            connectSrc: [
                "'self'",
                "api.etherscan.io",
                "unpkg.com",
                "cdn.jsdelivr.net",
                "cdnjs.cloudflare.com",
                "https://*.mongodb.net",
                "https://api.project-ivs.vercel.app",
                "wss://api.ivs-testing.vercel.app",
                "https://unpkg.com/@phosphor-icons",
                process.env.NODE_ENV === 'development' ? "http://localhost:3000" : null,
                "https://project-ivs.vercel.app"
            ].filter(Boolean),
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" }
});

/**
 * Static file serving
 */

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/'
});

/**
 * Form body parser
  */

fastify.register(require('@fastify/formbody'));

/**
 * Security headers middleware
  */

fastify.addHook('onRequest', (request, reply, done) => {
    reply.headers({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    done();
});

/**
 * MongoDB connection with retry logic
 */

const connectDB = async () => {
    const MAX_RETRIES = 3;
    let currentRetry = 0;

    while (currentRetry < MAX_RETRIES) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            console.log('Connected to MongoDB');
            return true;
        } catch (err) {
            currentRetry++;
            console.error(`MongoDB connection attempt ${currentRetry} failed:`, err);
            if (currentRetry === MAX_RETRIES) {
                if (!process.env.VERCEL) {
                    process.exit(1);
                }
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
};

/**
 *MongoDB connection event handlers
 */

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
});

/**
 * Health check endpoint
 */

fastify.get('/api/health', async (request, reply) => {
    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    };
});

/**
 * Register routes
 */

fastify.register(require('./backend/routes/authRoutes'), { prefix: '/api/auth' });
fastify.register(require('./backend/routes/userRoutes'), { prefix: '/api/user' });

/**
 * Serve static files for public routes
 */
fastify.get('/', async (request, reply) => {
    return reply.sendFile('index.html');
});

fastify.get('/auth', async (request, reply) => {
    return reply.sendFile('auth.html');
});



/**
 * API Error Handler
 */
fastify.setErrorHandler(function (error, request, reply) {
    this.log.error(error);

    /**
     * Handle MongoDB errors
     */

    if (error.name === 'MongoError' || error.name === 'MongooseError') {
        return reply.status(500).send({
            status: 'error',
            message: 'Database error occurred',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }

    /**
     * Handle validation errors
     */
    if (error.validation) {
        return reply.status(400).send({
            status: 'error',
            message: 'Validation failed',
            errors: error.validation
        });
    }

    /**
     * Default error response
     */
    reply.status(error.statusCode || 500).send({
        status: 'error',
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

/**
 * Catch-all route for SPA
 */

fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/')) {
        reply.code(404).send({
            status: 'error',
            message: 'API endpoint not found'
        });
    } else {
        reply.sendFile('index.html');
    }
});

/**
 * Graceful shutdown handler
 */

const closeGracefully = async (signal) => {
    console.log(`Received signal to terminate: ${signal}`);

    // Close MongoDB connection
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
    }

    // Close Fastify server
    try {
        await fastify.close();
        console.log('Fastify server closed');
    } catch (err) {
        console.error('Error closing Fastify server:', err);
    }

    process.exit(0);
};

process.on('SIGINT', closeGracefully);
process.on('SIGTERM', closeGracefully);

// Server startup
const start = async () => {
    try {
        await connectDB();

        if (!process.env.VERCEL) {
            await fastify.listen({
                port: process.env.PORT || 3000,
                host: '0.0.0.0'
            });
            console.log(`Server running on port ${process.env.PORT || 3000}`);
        }
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

/**
 * Start server if not in Vercel environment
 */

if (!process.env.VERCEL) {
    start();
}

/**
 * Export for Vercel
 */

module.exports = async (req, res) => {
    await fastify.ready();
    fastify.server.emit('request', req, res);
};

