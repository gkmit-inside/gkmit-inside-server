import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { ROLES } from '../constants/roles.js';

/**
 * @desc    Protects routes by verifying JWT
 */
export const isAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      if (
        decoded.role === ROLES.ADMIN &&
        decoded.email === process.env.ADMIN_EMAIL
      ) {
        req.user = {
          role: ROLES.ADMIN,
          email: process.env.ADMIN_EMAIL,
        };
        return next();
      }

      req.user = await User.findById(decoded.id)
        .select('-passwordHash')
        .populate('role', 'name');

      if (!req.user) {
        return sendError(res, STATUS.UNAUTHORIZED, 'Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error(error);
      if (error.name === 'TokenExpiredError') {
          return sendError(res, STATUS.UNAUTHORIZED, 'Token expired');
      }
      return sendError(res, STATUS.UNAUTHORIZED, 'Not authorized, token failed');
    }
  }

  if (!token) {
    return sendError(res, STATUS.UNAUTHORIZED, 'Not authorized, token failed');
  }
};

/**
 * @desc    Protects routes for ADMINS ONLY
 */
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === ROLES.ADMIN) {
    next();
  } else {
    return sendError(res, STATUS.FORBIDDEN, 'Not authorized as an admin');
  }
};
