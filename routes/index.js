const { Router } = require('express');

const userRoutes = require('./userRoutes');
const patientRoutes = require('./patientRoutes');
const analysisRoutes = require('./analysisRoutes');
const authRoutes = require('./authRoutes');
const doctorRoutes = require('./doctorRoutes');
const recommendationRoutes = require('./recommendationRoutes');

const router = Router();

// Health-check (sin autenticación)
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'RetiScan SaaS API',
        timestamp: new Date().toISOString(),
    });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/analyses', analysisRoutes);
router.use('/recommendations', recommendationRoutes);

module.exports = router;
