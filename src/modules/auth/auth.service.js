const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const ROLES = require("../../constants/roles");

const refreshTokenStore = new Set();

const users = [
  {
    id: 1,
    name: "Super Admin",
    email: "admin@gbu.ac.in",
    role: ROLES.SUPER_ADMIN,
    passwordHash: bcrypt.hashSync("Admin@123", 10),
  },
  {
    id: 2,
    name: "School User",
    email: "school@gbu.ac.in",
    role: ROLES.SCHOOL,
    passwordHash: bcrypt.hashSync("School@123", 10),
  },
  {
    id: 3,
    name: "Faculty User",
    email: "faculty@gbu.ac.in",
    role: ROLES.FACULTY,
    passwordHash: bcrypt.hashSync("Faculty@123", 10),
  },
];

const signAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn },
  );
};

const signRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      type: "refresh",
    },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn },
  );
};

const login = async (email, password) => {
  const user = users.find(
    (item) => item.email.toLowerCase() === String(email).toLowerCase(),
  );

  if (!user) {
    return null;
  }

  const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordMatch) {
    return null;
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  refreshTokenStore.add(refreshToken);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

const refresh = (token) => {
  if (!token || !refreshTokenStore.has(token)) {
    return null;
  }

  try {
    const payload = jwt.verify(token, env.jwtRefreshSecret);
    const user = users.find((item) => item.id === payload.sub);

    if (!user) {
      return null;
    }

    const accessToken = signAccessToken(user);
    return { accessToken };
  } catch (error) {
    refreshTokenStore.delete(token);
    return null;
  }
};

const logout = (token) => {
  if (!token) {
    return false;
  }

  return refreshTokenStore.delete(token);
};

module.exports = {
  login,
  refresh,
  logout,
};
