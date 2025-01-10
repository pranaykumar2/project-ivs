const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { sendVerificationEmail } = require('../services/mailService');
const mailService = require('../services/mailService');
const { body, validationResult } = require('express-validator');

class AuthController {
    async register(req, res) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { email, password, full_name } = req.body;

            // Check if user already exists
            const [existingUser] = await connection.query(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUser.length) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email already registered'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Generate verification token
            const verificationToken = uuidv4();

            // Create user
            const userId = uuidv4();
            await connection.query(
                'INSERT INTO users (id, email, password, full_name, verification_token) VALUES (?, ?, ?, ?, ?)',
                [userId, email, hashedPassword, full_name, verificationToken]
            );

            try {
                // Send verification email
                await mailService.sendVerificationEmail(email, verificationToken);
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Continue with registration even if email fails
            }

            await connection.commit();

            res.status(201).json({
                status: 'success',
                message: 'Registration successful. Please check your email for verification.',
                // If email sending failed, provide the verification token in development
                ...(process.env.NODE_ENV === 'development' && {
                    verificationToken
                })
            });
        } catch (error) {
            await connection.rollback();
            console.error('Registration error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Registration failed'
            });
        } finally {
            connection.release();
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Get user
            const [users] = await pool.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (!users.length) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            const user = users[0];

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            // Check if email is verified
            if (!user.email_verified) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Please verify your email first'
                });
            }

            // Generate token
            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            // Calculate token expiration
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

            // Store session
            await pool.query(
                'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
                [uuidv4(), user.id, token, expiresAt]
            );

            res.status(200).json({
                status: 'success',
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        full_name: user.full_name,
                        wallet_address: user.wallet_address
                    }
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Login failed'
            });
        }
    }

    // Add these methods to the existing AuthController class

    async verifyEmail(req, res) {
        try {
            const { token } = req.query;

            // Find user with verification token
            const [users] = await pool.query(
                'SELECT id FROM users WHERE verification_token = ? AND email_verified = ?',
                [token, false]
            );

            if (!users.length) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid or expired verification token'
                });
            }

            // Update user verification status
            await pool.query(
                'UPDATE users SET email_verified = ?, verification_token = NULL WHERE id = ?',
                [true, users[0].id]
            );

            res.status(200).json({
                status: 'success',
                message: 'Email verified successfully'
            });
        } catch (error) {
            console.error('Email verification error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Email verification failed'
            });
        }
    }

    async resendVerification(req, res) {
        try {
            const { email } = req.body;

            // Find user
            const [users] = await pool.query(
                'SELECT id, email_verified FROM users WHERE email = ?',
                [email]
            );

            if (!users.length) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            if (users[0].email_verified) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email already verified'
                });
            }

            // Generate new verification token
            const verificationToken = uuidv4();

            // Update user's verification token
            await pool.query(
                'UPDATE users SET verification_token = ? WHERE id = ?',
                [verificationToken, users[0].id]
            );

            // Send new verification email
            await sendVerificationEmail(email, verificationToken);

            res.status(200).json({
                status: 'success',
                message: 'Verification email sent successfully'
            });
        } catch (error) {
            console.error('Resend verification error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to resend verification email'
            });
        }
    }

    async logout(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No token provided'
                });
            }

            // Remove session
            await pool.query('DELETE FROM sessions WHERE token = ?', [token]);

            res.status(200).json({
                status: 'success',
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Logout failed'
            });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            // Find user
            const [users] = await pool.query(
                'SELECT id, email FROM users WHERE email = ?',
                [email]
            );

            if (!users.length) {
                return res.status(404).json({
                    status: 'error',
                    message: 'No account found with this email'
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

            // Hash the reset token
            const hashedToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            // Save reset token and expiry
            await pool.query(
                'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
                [hashedToken, resetTokenExpiry, users[0].id]
            );

            // Send password reset email
            await mailService.sendPasswordResetEmail(email, resetToken);

            res.status(200).json({
                status: 'success',
                message: 'Password reset instructions sent to your email'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to process password reset request'
            });
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, password } = req.body;

            // Hash the token from the URL
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // Find user with valid reset token
            const [users] = await pool.query(
                'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
                [hashedToken]
            );

            if (!users.length) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid or expired reset token'
                });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Update password and clear reset token
            await pool.query(
                'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
                [hashedPassword, users[0].id]
            );

            // Invalidate all existing sessions for this user
            await pool.query('DELETE FROM sessions WHERE user_id = ?', [users[0].id]);

            res.status(200).json({
                status: 'success',
                message: 'Password reset successful'
            });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to reset password'
            });
        }
    }
}

module.exports = new AuthController();