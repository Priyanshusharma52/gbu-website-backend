const { login, refresh, logout } = require('./auth.service');
const { successResponse, errorResponse } = require('../../utils/response');

const loginHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 'Validation failed', [
      { field: 'email', message: 'Email is required' },
      { field: 'password', message: 'Password is required' },
    ], 400);
  }

  const authResult = await login(email, password);

  if (!authResult) {
    return errorResponse(res, 'Invalid credentials', [
      { field: 'credentials', message: 'Email or password is incorrect' },
    ], 401);
  }

  return successResponse(res, 'Login successful', authResult, 200);
};

const refreshHandler = (req, res) => {
  const { refreshToken } = req.body;
  const tokenResult = refresh(refreshToken);

  if (!tokenResult) {
    return errorResponse(res, 'Invalid refresh token', [
      { field: 'refreshToken', message: 'Refresh token is invalid or expired' },
    ], 401);
  }

  return successResponse(res, 'Access token refreshed', tokenResult, 200);
};

const logoutHandler = (req, res) => {
  const { refreshToken } = req.body;
  const isRemoved = logout(refreshToken);

  if (!isRemoved) {
    return errorResponse(res, 'Invalid refresh token', [
      { field: 'refreshToken', message: 'Refresh token is invalid' },
    ], 400);
  }

  return successResponse(res, 'Logged out successfully', {}, 200);
};

const meHandler = (req, res) => {
  return successResponse(res, 'User profile fetched', {
    id: req.user.sub,
    email: req.user.email,
    role: req.user.role,
    name: req.user.name,
  });
};

module.exports = {
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
};
