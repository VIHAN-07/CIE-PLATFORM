// ==========================================
// Rate Limiter — Especially for AI endpoints
// ==========================================

const rateLimit = require('express-rate-limit');
const { AI_RATE_LIMIT_WINDOW_MS, AI_RATE_LIMIT_MAX } = require('../config/env');

/** General API rate limiter */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Stricter limiter for AI endpoints */
const aiLimiter = rateLimit({
  windowMs: AI_RATE_LIMIT_WINDOW_MS,
  max: AI_RATE_LIMIT_MAX,
  message: { message: 'AI rate limit exceeded. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, aiLimiter };
