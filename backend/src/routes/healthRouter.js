const express = require('express');
const prisma = require('../config/prisma');
const ApiResponse = require('../utils/ApiResponse');

const router = express.Router();

/**
 * Health check endpoint verifying backend and database status
 */
router.get('/', async (req, res, next) => {
  try {
    const dbCheck = await prisma.$queryRaw`SELECT 1 as healthy`;

    return ApiResponse.success(
      res,
      {
        status: 'UP',
        service: 'MedCore HMS Doctor API',
        timestamp: new Date().toISOString(),
        database: dbCheck ? 'CONNECTED' : 'DISCONNECTED',
        uptime: process.uptime(),
      },
      'MedCore HMS backend service is healthy'
    );
  } catch (err) {
    return res.status(503).json({
      success: false,
      data: {
        status: 'DEGRADED',
        service: 'MedCore HMS Doctor API',
        timestamp: new Date().toISOString(),
        database: 'ERROR',
        error: err.message,
      },
      message: 'Service database check failed',
      errors: [err.message],
    });
  }
});

module.exports = router;
