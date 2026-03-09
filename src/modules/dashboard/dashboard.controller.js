const { successResponse } = require('../../utils/response');

const adminDashboard = (req, res) => {
  return successResponse(res, 'Admin dashboard data fetched', {
    dashboard: 'admin',
    role: req.user.role,
    widgets: ['user-management', 'audit-logs', 'system-settings', 'reports'],
  });
};

const schoolDashboard = (req, res) => {
  return successResponse(res, 'School dashboard data fetched', {
    dashboard: 'school',
    role: req.user.role,
    widgets: ['school-updates', 'department-summary', 'school-notices'],
  });
};

const facultyDashboard = (req, res) => {
  return successResponse(res, 'Faculty dashboard data fetched', {
    dashboard: 'faculty',
    role: req.user.role,
    widgets: ['profile', 'publications', 'teaching-load', 'research-work'],
  });
};

module.exports = {
  adminDashboard,
  schoolDashboard,
  facultyDashboard,
};
