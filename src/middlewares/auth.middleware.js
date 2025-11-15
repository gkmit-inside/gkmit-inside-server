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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
        return res
          .status(401)
          .json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * @desc    Protects routes for ADMINS ONLY
 */
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === ROLES.ADMIN) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};
