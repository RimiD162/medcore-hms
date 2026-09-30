const express = require('express');
const { pool } = require('../config/db');
const ApiResponse = require('../utils/ApiResponse');

const router = express.Router();

// GET /api/health
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT NOW() AS db_time, current_database() AS db_name');
    res.json(new ApiResponse(200, {
      server: 'running',
      app: process.env.APP_NAME,
      api_version: process.env.API_VERSION,
      environment: process.env.NODE_ENV,
      database: {
        status: 'connected',
        name: result.rows[0].db_name,
        time: result.rows[0].db_time,
      },
    }, 'MedCore HMS API is healthy'));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
