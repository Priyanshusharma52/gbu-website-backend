const { login, refresh, logout } = require("./auth.service");
const { successResponse, errorResponse } = require("../../utils/response");

const validateCredentials = (email, password) => {
  if (!email || !password) {
    return [
      { field: "email", message: "Email is required" },
      { field: "password", message: "Password is required" },
    ];
  }

  return null;
};

const createRoleLoginHandler = (portalRole, roleLabel) => {
  return async (req, res) => {
    const { email, password } = req.body;

    const validationErrors = validateCredentials(email, password);

    if (validationErrors) {
      return errorResponse(res, "Validation failed", validationErrors, 400);
    }

    const authResult = await login(email, password, portalRole);

    if (!authResult) {
      return errorResponse(
        res,
        "Invalid credentials",
        [
          {
            field: "credentials",
            message: `Email or password is incorrect for ${roleLabel} login`,
          },
        ],
        401,
      );
    }

    return successResponse(
      res,
      `${roleLabel} login successful`,
      authResult,
      200,
    );
  };
};

const teacherLoginHandler = createRoleLoginHandler("teacher", "Teacher");
const schoolLoginHandler = createRoleLoginHandler("school", "School");
const adminLoginHandler = createRoleLoginHandler("admin", "Admin");

const refreshHandler = (req, res) => {
  const { refreshToken } = req.body;
  const tokenResult = refresh(refreshToken);

  if (!tokenResult) {
    return errorResponse(
      res,
      "Invalid refresh token",
      [
        {
          field: "refreshToken",
          message: "Refresh token is invalid or expired",
        },
      ],
      401,
    );
  }

  return successResponse(res, "Access token refreshed", tokenResult, 200);
};

const logoutHandler = (req, res) => {
  const { refreshToken } = req.body;
  const isRemoved = logout(refreshToken);

  if (!isRemoved) {
    return errorResponse(
      res,
      "Invalid refresh token",
      [{ field: "refreshToken", message: "Refresh token is invalid" }],
      400,
    );
  }

  return successResponse(res, "Logged out successfully", {}, 200);
};

const meHandler = (req, res) => {
  return successResponse(res, "User profile fetched", {
    id: req.user.sub,
    email: req.user.email,
    role: req.user.role,
    name: req.user.name,
  });
};

module.exports = {
  teacherLoginHandler,
  schoolLoginHandler,
  adminLoginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
};
