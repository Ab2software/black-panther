const usermodel = require('../model/User');

const cleanupExpiredDemoUsers = async () => {
    try {
        const result = await usermodel.deleteMany({
            isDemoUser: true,
            demoExpiresAt: { $lt: new Date() },
        });
        console.log(`🧹 Cleaned up ${result.deletedCount} expired demo users`);
    } catch (err) {
        console.error('Demo cleanup error:', err.message);
    }
};

module.exports = cleanupExpiredDemoUsers;