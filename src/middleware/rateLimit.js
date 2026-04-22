const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const shouldSkipRateLimit = (req) => {
  const path = String(req.path || '').toLowerCase();
  return req.method === 'OPTIONS' || path === '/health' || path === '/api/health';
};

const apiRateLimiter = rateLimit({
  windowMs: env.apiRateLimitWindowMs,
  max: env.apiRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    errors: [{ field: 'rateLimit', message: 'Rate limit exceeded' }],
  },
});

const authRateLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    errors: [{ field: 'rateLimit', message: 'Authentication rate limit exceeded' }],
  },
});

module.exports = {
  apiRateLimiter,
  authRateLimiter,
};
