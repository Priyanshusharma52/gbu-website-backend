const rateLimit = require('express-rate-limit');

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    errors: [{ field: 'rateLimit', message: 'Rate limit exceeded' }],
  },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
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
