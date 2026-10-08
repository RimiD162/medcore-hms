const express = require('express');
const patientAuthController = require('../controllers/patientAuthController');
const { authMiddleware, requirePatient } = require('../middleware/auth');

const router = express.Router();

// Public Patient Auth Endpoints
router.post('/activate', patientAuthController.activatePortalAccount);
router.post('/login', patientAuthController.login);
router.post('/register', patientAuthController.register);
router.post('/forgot-password', patientAuthController.forgotPassword);

// Authenticated Patient Auth Endpoints
router.post('/change-password', authMiddleware, requirePatient, patientAuthController.changePassword);
router.get('/me', authMiddleware, requirePatient, patientAuthController.getMe);

module.exports = router;
