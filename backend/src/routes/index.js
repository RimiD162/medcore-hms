const express = require('express');
const healthRouter = require('./healthRouter');
const doctorRoutes = require('./doctorRoutes');
const nurseRoutes = require('./nurseRoutes');
const receptionistRoutes = require('./receptionistRoutes');
const pharmacistRoutes = require('./pharmacistRoutes');

const router = express.Router();

router.use('/health', healthRouter);
router.use('/doctor', doctorRoutes);
router.use('/doctors', doctorRoutes); // Alias for doctor routes
router.use('/nurse', nurseRoutes);
router.use('/nurses', nurseRoutes); // Alias for nurse routes
router.use('/receptionist', receptionistRoutes);
router.use('/receptionists', receptionistRoutes); // Alias for receptionist routes
router.use('/pharmacist', pharmacistRoutes);
router.use('/pharmacists', pharmacistRoutes); // Alias for pharmacist routes

module.exports = router;

