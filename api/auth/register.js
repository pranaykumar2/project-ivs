const mongoose = require('mongoose');
const User = require('../../backend/models/User');

const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 15000,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw new Error('Database connection failed');
    }
};

const handler = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            status: 'error',
            message: 'Method not allowed'
        });
    }

    try {
        await connectDB();

        const { name, email, password, walletAddress } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'User already exists'
            });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password, // Password will be hashed by the User model pre-save hook
            walletAddress
        });

        await user.save();

        // Return success without sensitive data
        return res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                walletAddress: user.walletAddress
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during registration'
        });
    }
};

module.exports = handler;