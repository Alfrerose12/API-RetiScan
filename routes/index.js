const { Router } = require('express');

const userRoutes = require('./userRoutes');
const patientRoutes = require('./patientRoutes');
const analysisRoutes = require('./analysisRoutes');
const twoFactorRoutes = require('./twoFactorRoutes');
const adminRoutes = require('./adminRoutes');

const router = Router();

// Health-check endpoint (no auth required)
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'RetiScan API',
        timestamp: new Date().toISOString(),
    });
});

router.use('/users', userRoutes);
router.use('/patients', patientRoutes);
router.use('/analyses', analysisRoutes);
router.use('/auth', twoFactorRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
