const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const { successResponse } = require('../utils/response');

const router = express.Router();

router.get('/health', (req, res) => {
  return successResponse(res, 'Service is healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
