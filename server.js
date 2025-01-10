const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');

// Middleware
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false // You might need to adjust this based on your needs
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Database connection for serverless environment
const getConnection = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: {
                rejectUnauthorized: true
            }
        });
        return connection;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
};

// Make database connection available to routes
app.use(async (req, res, next) => {
    try {
        req.db = await getConnection();
        next();
    } catch (error) {
        console.error('Database middleware error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

// Routes
const authRoutes = require('./backend/routes/authRoutes');
app.use('/api/auth', authRoutes);

// Frontend routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'auth.html'));
});

// Handle 404
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});

// Export for serverless use
module.exports = app;

// Only listen when running locally
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}