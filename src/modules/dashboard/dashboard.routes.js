const express = require("express");
const {
  adminDashboard,
  schoolDashboard,
  facultyDashboard,
} = require("./dashboard.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const ROLES = require("../../constants/roles");

const router = express.Router();

router.use(authenticate);

router.get("/admin", authorize(ROLES.SUPER_ADMIN), adminDashboard);
router.get("/school", authorize(ROLES.SCHOOL), schoolDashboard);
router.get("/faculty", authorize(ROLES.FACULTY), facultyDashboard);

module.exports = router;
