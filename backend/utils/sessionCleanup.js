const { pool } = require('../config/database');

async function cleanupExpiredSessions() {
    try {
        const [result] = await pool.query(
            'DELETE FROM sessions WHERE expires_at < NOW()'
        );
        console.log(`Cleaned up ${result.affectedRows} expired sessions`);
    } catch (error) {
        console.error('Session cleanup error:', error);
    }
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 3600000);

module.exports = {
    cleanupExpiredSessions
};