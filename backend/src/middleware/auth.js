const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');

// Protect routes - Verify access token (Strict)
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new ApiError(401, 'Please log in to access this resource.'));
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError(401, 'The user belonging to this token no longer exists.'));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(401, 'Not authorized. Invalid or expired token.'));
  }
};

// Optional Protect - Verifies token if exists, but does not block guests
const optionalProtect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Fail silently for guests, proceed without user object
    next();
  }
};

// Role-Based Access Control (RBAC)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }
    next();
  };
};

module.exports = {
  protect,
  optionalProtect,
  authorize
};
