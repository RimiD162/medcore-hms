const express = require('express');
const healthRouter = require('./healthRouter');
const doctorRoutes = require('./doctorRoutes');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/doctor', doctorRoutes);
router.use('/doctors', doctorRoutes); // Alias for doctor routes

module.exports = router;
