const mongoose = require('mongoose');

const dbConfig = {
    init: () => {
        mongoose.set('strictQuery', true);

        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error closing MongoDB connection:', err);
                process.exit(1);
            }
        });
    },

    isConnected: () => {
        return mongoose.connection.readyState === 1;
    }
};

module.exports = dbConfig;