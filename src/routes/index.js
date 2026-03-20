const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const { successResponse } = require("../utils/response");
const bookingRoutes = require("../modules/booking");
const academicRoutes = require("../modules/academics");
const router = express.Router();

router.get("/health", (req, res) => {
  return successResponse(res, "Service is healthy", {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);

router.use("/bookings", bookingRoutes);
router.use("/academics", academicRoutes);
module.exports = router;
