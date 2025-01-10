const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify email transport
transporter.verify()
    .then(() => console.log('Email service ready'))
    .catch(err => console.error('Email service error:', err));

class AuthController {
    /**
     * Register new user
     */
    async register(req, res) {
        const connection = req.db;
        try {
            const { email, password, full_name } = req.body;

            // Check if user already exists
            const [existingUsers] = await connection.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email already registered'
                });
            }

            // Generate verification token
            const verificationToken = uuidv4();
            const userId = uuidv4();

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insert user into database
            await connection.execute(
                'INSERT INTO users (id, email, password, full_name, verification_token, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, email, hashedPassword, full_name, verificationToken, false]
            );

            // Send verification email
            const verificationUrl = `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/verify-email?token=${verificationToken}`;

            const mailOptions = {
                from: `"IVS Team" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Verify Your Email - IVS',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Welcome to IVS!</h2>
                        <p>Hello ${full_name},</p>
                        <p>Thank you for registering with IVS. Please verify your email address by clicking the button below:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Verify Email</a>
                        </div>
                        <p>This link will expire in 24 hours.</p>
                        <p>If you didn't create an account, please ignore this email.</p>
                        <p>Best regards,<br>The IVS Team</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);

            res.status(201).json({
                status: 'success',
                message: 'Registration successful! Please check your email for verification.'
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                status: 'error',
                message: error.code === 'ER_DUP_ENTRY'
                    ? 'Email already exists'
                    : 'Registration failed'
            });
        }
    }

    /**
     * Login user
     */
    async login(req, res) {
        const connection = req.db;
        try {
            const { email, password } = req.body;

            // Find user
            const [users] = await connection.execute(
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

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            // Check email verification
            if (!user.email_verified) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Please verify your email first'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Store session
            const sessionId = uuidv4();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            await connection.execute(
                'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
                [sessionId, user.id, token, expiresAt]
            );

            res.status(200).json({
                status: 'success',
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        full_name: user.full_name,
                        wallet_address: user.wallet_address || null
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

    /**
     * Verify email
     */
    async verifyEmail(req, res) {
        const connection = req.db;
        try {
            const { token } = req.query;

            // Find user with verification token
            const [users] = await connection.execute(
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
            await connection.execute(
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

    /**
     * Forgot password
     */
    async forgotPassword(req, res) {
        const connection = req.db;
        try {
            const { email } = req.body;

            // Find user
            const [users] = await connection.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (!users.length) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            // Generate reset token
            const resetToken = uuidv4();
            const resetExpires = new Date();
            resetExpires.setHours(resetExpires.getHours() + 1);

            // Store reset token
            await connection.execute(
                'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
                [resetToken, resetExpires, users[0].id]
            );

            // Send reset email
            const resetUrl = `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/reset-password?token=${resetToken}`;

            const mailOptions = {
                from: `"IVS Team" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Reset Your Password - IVS',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Reset Your Password</h2>
                        <p>You have requested to reset your password. Click the button below to proceed:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
                        </div>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                        <p>Best regards,<br>The IVS Team</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({
                status: 'success',
                message: 'Password reset instructions sent to email'
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to process password reset request'
            });
        }
    }

    /**
     * Reset password
     */
    async resetPassword(req, res) {
        const connection = req.db;
        try {
            const { token, password } = req.body;

            // Find user with valid reset token
            const [users] = await connection.execute(
                'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
                [token]
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
            await connection.execute(
                'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
                [hashedPassword, users[0].id]
            );

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

    /**
     * Logout user
     */
    async logout(req, res) {
        const connection = req.db;
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                await connection.execute(
                    'DELETE FROM sessions WHERE token = ?',
                    [token]
                );
            }

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
}

module.exports = new AuthController();