const express = require('express');
const healthRouter = require('./healthRouter');
const doctorRoutes = require('./doctorRoutes');
const nurseRoutes = require('./nurseRoutes');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/doctor', doctorRoutes);
router.use('/doctors', doctorRoutes); // Alias for doctor routes
router.use('/nurse', nurseRoutes);
router.use('/nurses', nurseRoutes); // Alias for nurse routes

module.exports = router;
