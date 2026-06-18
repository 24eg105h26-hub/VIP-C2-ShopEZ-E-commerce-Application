const crypto = require('crypto');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const ApiError = require('../utils/ApiError');
const { sendEmail } = require('../services/emailService');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');

// Utility to set secure cookie
const setRefreshTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  res.cookie('refreshToken', token, cookieOptions);
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  const { name, email, password, role, storeName } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, 'Email already registered.'));
    }

    const assignedRole = role === 'seller' ? 'seller' : 'customer';

    if (assignedRole === 'seller' && !storeName) {
      return next(new ApiError(400, 'Store name is required for seller registration.'));
    }

    // Create user (auto-verified)
    const user = new User({
      name,
      email,
      password,
      role: assignedRole,
      isVerified: true
    });

    await user.save();

    // If role is seller, create Seller profile (inactive until verified/approved)
    if (assignedRole === 'seller') {
      const existingStore = await Seller.findOne({ storeName });
      if (existingStore) {
        // Rollback user creation
        await User.findByIdAndDelete(user._id);
        return next(new ApiError(400, 'Store name already taken.'));
      }
      await Seller.create({
        user: user._id,
        storeName
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email address
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res, next) => {
  const { token } = req.body;

  try {
    if (!token) {
      return next(new ApiError(400, 'Token is required.'));
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired verification token.'));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log in user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ApiError(401, 'Invalid credentials.'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid credentials.'));
    }

    // Generate tokens
    const accessToken = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id);

    // Save refresh token to user array
    user.refreshTokens.push(refreshToken);
    await user.save();

    // Set cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rotate JWT and sessions (Refresh Token Rotation)
// @route   POST /api/auth/refresh
// @access  Public
const refresh = async (req, res, next) => {
  const cookies = req.cookies;
  if (!cookies || !cookies.refreshToken) {
    return next(new ApiError(401, 'Authentication required. No refresh token.'));
  }

  const oldRefreshToken = cookies.refreshToken;
  res.clearCookie('refreshToken');

  try {
    // Find user by refresh token
    const user = await User.findOne({ refreshTokens: oldRefreshToken });

    // Detected Reuse Attempt
    if (!user) {
      try {
        // Malicious user might have leaked refresh token. Invalidate ALL tokens of whoever owns this token
        const decoded = verifyRefreshToken(oldRefreshToken);
        const hackedUser = await User.findById(decoded.id);
        if (hackedUser) {
          hackedUser.refreshTokens = [];
          await hackedUser.save();
        }
      } catch (err) {
        // Token was invalid/expired anyway
      }
      return next(new ApiError(403, 'Compromised session. Please re-authenticate.'));
    }

    // Validate old refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(oldRefreshToken);
    } catch (err) {
      // Expired or corrupt token. Remove it from database
      user.refreshTokens = user.refreshTokens.filter(t => t !== oldRefreshToken);
      await user.save();
      return next(new ApiError(403, 'Session expired. Please log in again.'));
    }

    // Clear old token from array
    user.refreshTokens = user.refreshTokens.filter(t => t !== oldRefreshToken);

    // Generate new tokens
    const newAccessToken = signAccessToken(user._id, user.role);
    const newRefreshToken = signRefreshToken(user._id);

    user.refreshTokens.push(newRefreshToken);
    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log out user / revoke refresh token
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  const cookies = req.cookies;
  if (!cookies || !cookies.refreshToken) {
    res.clearCookie('refreshToken');
    return res.status(204).json({ success: true });
  }

  const refreshToken = cookies.refreshToken;
  res.clearCookie('refreshToken');

  try {
    const user = await User.findOne({ refreshTokens: refreshToken });
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request forgot password code
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(404, 'No account found with this email.'));
    }

    const resetToken = user.getPasswordResetToken();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const emailHtml = `
      <h1>Reset your password</h1>
      <p>Hello ${user.name},</p>
      <p>A request has been made to reset your password. Please click the link below to verify your request:</p>
      <a href="${resetUrl}" target="_blank" style="padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>If you did not request this, you can safely ignore this email.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'shopEZ Password Reset Request',
        html: emailHtml
      });
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  try {
    if (!token) {
      return next(new ApiError(400, 'Reset token is required.'));
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired reset token.'));
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Clear active sessions on password change
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Delete related entities depending on role
    if (req.user.role === 'seller') {
      await Seller.findOneAndDelete({ user: userId });
    }

    await Cart.findOneAndDelete({ user: userId });
    await Wishlist.findOneAndDelete({ user: userId });

    await User.findByIdAndDelete(userId);

    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Your account has been permanently deleted.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export account data
// @route   GET /api/auth/export
// @access  Private
const exportData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    const orders = await Order.find({ user: userId }).populate('items.product', 'name price');
    const reviews = await Review.find({ user: userId }).populate('product', 'name');
    const wishlist = await Wishlist.findOne({ user: userId }).populate('products', 'name price');

    const exportedData = {
      profile: {
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses,
        joinedAt: user.createdAt
      },
      orders: orders.map(ord => ({
        id: ord._id,
        status: ord.orderStatus,
        totalPrice: ord.totalPrice,
        paymentMethod: ord.paymentMethod,
        items: ord.items,
        date: ord.createdAt
      })),
      reviews: reviews.map(rev => ({
        rating: rev.rating,
        comment: rev.comment,
        product: rev.product?.name,
        date: rev.createdAt
      })),
      wishlist: wishlist ? wishlist.products.map(p => p.name) : []
    };

    res.status(200).json({
      success: true,
      data: exportedData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  const { name, avatar } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses
      },
      message: 'Profile updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  try {
    if (!oldPassword || !newPassword) {
      return next(new ApiError(400, 'Please provide both current and new passwords.'));
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return next(new ApiError(401, 'Current password is incorrect.'));
    }

    if (newPassword.length < 8) {
      return next(new ApiError(400, 'New password must be at least 8 characters long.'));
    }

    user.password = newPassword;
    user.refreshTokens = []; // invalidate other sessions on password change
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add address to profile
// @route   POST /api/auth/address
// @access  Private
const addAddress = async (req, res, next) => {
  const { street, city, state, postalCode, country, phone, isDefault } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    // If this is the first address, or isDefault is true, set others to false
    const setAsDefault = user.addresses.length === 0 || isDefault === true;
    if (setAsDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    user.addresses.push({
      street,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault: setAsDefault
    });

    await user.save();

    res.status(200).json({
      success: true,
      data: user.addresses,
      message: 'Address added successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update address details
// @route   PUT /api/auth/address/:addressId
// @access  Private
const updateAddress = async (req, res, next) => {
  const { addressId } = req.params;
  const { street, city, state, postalCode, country, phone, isDefault } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return next(new ApiError(404, 'Address not found.'));
    }

    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (postalCode) address.postalCode = postalCode;
    if (country) address.country = country;
    if (phone) address.phone = phone;

    if (isDefault === true) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
      address.isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user.addresses,
      message: 'Address updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete address from profile
// @route   DELETE /api/auth/address/:addressId
// @access  Private
const deleteAddress = async (req, res, next) => {
  const { addressId } = req.params;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return next(new ApiError(404, 'Address not found.'));
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(addressId);

    // If we deleted the default address and have other addresses left, set the first one as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user.addresses,
      message: 'Address removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  deleteAccount,
  exportData,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress
};

