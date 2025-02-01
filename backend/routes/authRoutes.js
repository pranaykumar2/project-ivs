const { validateRegistration, validateLogin } = require('../middleware/validate');
const authController = require('../controllers/authController');

async function routes(fastify, options) {
    fastify.post('/register', {
        schema: {
            body: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    walletAddress: { type: 'string' }
                }
            }
        }
    }, authController.register);

    fastify.post('/login', {
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                }
            }
        }
    }, authController.login);

    fastify.post('/web3-auth', {
        schema: {
            body: {
                type: 'object',
                required: ['signature', 'walletAddress', 'message'],
                properties: {
                    signature: { type: 'string' },
                    walletAddress: { type: 'string' },
                    message: { type: 'string' }
                }
            }
        }
    }, authController.web3Auth);
}

module.exports = routes;