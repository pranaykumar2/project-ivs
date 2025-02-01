const auth = require('../middleware/auth');

async function routes(fastify, options) {
    fastify.get('/profile', {
        preHandler: auth.validateToken,
        schema: {
            response: {
                200: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string' },
                        walletAddress: { type: 'string' },
                        profileImage: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const user = await request.user;

            return {
                status: 'success',
                data: {
                    name: user.name,
                    email: user.email,
                    walletAddress: user.walletAddress,
                    profileImage: user.profileImage || 'https://i.ibb.co/KqCnT6M/2023-02-12-07-03-07-UTC-profile-pic.jpg'
                }
            };
        } catch (error) {
            reply.code(500).send({
                status: 'error',
                message: 'Error fetching user profile'
            });
        }
    });
}

module.exports = routes;