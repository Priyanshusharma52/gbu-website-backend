const express = require("express");
const {
  teacherLoginHandler,
  schoolLoginHandler,
  adminLoginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} = require("./auth.controller");
const { authenticate } = require("../../middleware/auth");
const { authRateLimiter } = require("../../middleware/rateLimit");

const router = express.Router();

router.post("/login/teacher", authRateLimiter, teacherLoginHandler);
router.post("/login/school", authRateLimiter, schoolLoginHandler);
router.post("/login/admin", authRateLimiter, adminLoginHandler);
router.post("/refresh", authRateLimiter, refreshHandler);
router.post("/logout", authRateLimiter, logoutHandler);
router.get("/me", authenticate, meHandler);

module.exports = router;
