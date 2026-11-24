const demoGuard = (req, res, next) => {
    // req.user is already set by authMiddleware
    if (req.user?.isDemo) {
        return res.status(403).json({
            success: false,
            message: 'Demo users cannot perform this action. Please register to continue.',
            isDemoRestricted: true, // frontend can use this flag to show a signup prompt
        });
    }
    next();
};

module.exports = demoGuard;