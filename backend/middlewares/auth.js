const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        /**
         *Check if token exists in sessions table
         */
        const [session] = await pool.query(
            'SELECT * FROM sessions WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (!session.length) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid or expired token'
            });
        }

        /**
         *Get user details
         */
        const [user] = await pool.query(
            'SELECT id, email, full_name, email_verified, wallet_address FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!user.length) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found'
            });
        }

        req.user = user[0];
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
};

module.exports = {
    verifyToken
};