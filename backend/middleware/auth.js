const auth = {
    validateToken: async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                reply.code(401).send({
                    status: 'error',
                    message: 'Authentication token is required'
                });
                return;
            }

            const token = authHeader.slice(7);

            const decoded = await User.verifyToken(token);

            if (!decoded || !decoded._id) {
                reply.code(401).send({
                    status: 'error',
                    message: 'Invalid token format'
                });
                return;
            }

            const user = await User.findById(decoded._id).select('-password');

            if (!user) {
                reply.code(401).send({
                    status: 'error',
                    message: 'User not found'
                });
                return;
            }

            request.user = user;

        } catch (error) {
            console.error('Token verification error:', error);
            reply.code(401).send({
                status: 'error',
                message: 'Invalid or expired token'
            });
            return;
        }
    }
};

module.exports = auth;