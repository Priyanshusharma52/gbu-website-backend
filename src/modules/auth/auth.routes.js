const express = require('express');
const {
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');
const { authRateLimiter } = require('../../middleware/rateLimit');

const router = express.Router();

router.post('/login', authRateLimiter, loginHandler);
router.post('/refresh', authRateLimiter, refreshHandler);
router.post('/logout', authRateLimiter, logoutHandler);
router.get('/me', authenticate, meHandler);

module.exports = router;
