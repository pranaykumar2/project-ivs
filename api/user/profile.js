const mongoose = require('mongoose');
const User = require('../models/User');  // Updated path to match your structure
const { jwtVerify } = require('jose');
const { TextEncoder } = require('util');

module.exports = async (req, res) => {
    console.log('Profile API called - Method:', req.method);

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET' && req.query.health === 'check') {
        return res.status(200).json({ status: 'healthy' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            status: 'error',
            message: 'Method not allowed'
        });
    }

    try {
        console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Exists' : 'Missing');

        if (mongoose.connection.readyState !== 1) {
            console.log('Connecting to MongoDB...');
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('MongoDB connected successfully');
        }

        const authHeader = req.headers.authorization;
        console.log('Auth header present:', !!authHeader);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('Verifying token...');

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

        const { payload } = await jwtVerify(token, secretKey, {
            issuer: 'project-ivs',
            audience: 'user'
        });

        console.log('Token verified, user ID:', payload._id);

        const user = await User.findById(payload._id).select('-password');
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        console.log('User found:', user.email);

        const response = {
            status: 'success',
            data: {
                name: user.name,
                email: user.email,
                walletAddress: user.walletAddress,
                profileImage: user.profileImage || 'https://i.ibb.co/KqCnT6M/2023-02-12-07-03-07-UTC-profile-pic.jpg'
            }
        };

        console.log('Sending response:', response);
        return res.status(200).json(response);

    } catch (error) {
        console.error('Profile API Error:', error);

        if (error.code === 'ERR_JWT_INVALID') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token'
            });
        }

        if (error.code === 'ERR_JWT_EXPIRED') {
            return res.status(401).json({
                status: 'error',
                message: 'Token expired'
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};