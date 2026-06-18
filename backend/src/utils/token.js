const jwt = require('jsonwebtoken');

const signAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_12345',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

const signRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_67890',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_12345'
  );
};

const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_67890'
  );
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
