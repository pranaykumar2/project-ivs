const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { ethers } = require('ethers');

const authController = {
    register: async (request, reply) => {
        try {
            const { name, email, password, walletAddress } = request.body;

            /**
             * Check if user exists
             */

            let user = await User.findOne({ email });
            if (user) {
                return reply.code(400).send({
                    status: 'error',
                    message: 'User already exists'
                });
            }

            /**
             * Create new user
             */

            user = new User({
                name,
                email,
                password,
                walletAddress
            });

            await user.save();

            /**
             * Generate JWT
             */

            const token = await generateToken(user._id);

            return reply.code(201).send({
                status: 'success',
                data: {
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        walletAddress: user.walletAddress
                    }
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            return reply.code(500).send({
                status: 'error',
                message: error.message || 'Internal server error'
            });
        }
    },

    login: async (request, reply) => {
        try {
            const { email, password } = request.body;

            /**
             * Find user
             */

            const user = await User.findOne({ email });
            if (!user) {
                return reply.code(401).send({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            /**
             * Check password
             */

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return reply.code(401).send({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            /**
             * Generate JWT
             */

            const token = await generateToken(user._id);

            return reply.send({
                status: 'success',
                data: {
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        walletAddress: user.walletAddress
                    }
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            return reply.code(500).send({
                status: 'error',
                message: error.message || 'Internal server error'
            });
        }
    },

    web3Auth: async (request, reply) => {
        try {
            const { signature, walletAddress, message } = request.body;

            /**
             * Verify signature using ethers
             */

            const recoveredAddress = ethers.verifyMessage(message, signature);

            if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                return reply.code(401).send({
                    status: 'error',
                    message: 'Invalid signature'
                });
            }

            /**
             * Find or create user
             */

            let user = await User.findOne({ walletAddress });
            if (!user) {
                user = new User({
                    name: `User-${walletAddress.slice(2, 8)}`,
                    email: `${walletAddress.slice(2, 8)}@wallet.user`,
                    password: ethers.hexlify(ethers.randomBytes(32)),
                    walletAddress
                });
                await user.save();
            }

            /**
             * Generate JWT
             */

            const token = await generateToken(user._id);

            return reply.send({
                status: 'success',
                data: {
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        walletAddress: user.walletAddress
                    }
                }
            });
        } catch (error) {
            console.error('Web3 auth error:', error);
            return reply.code(500).send({
                status: 'error',
                message: error.message || 'Internal server error'
            });
        }
    }
};

module.exports = authController;