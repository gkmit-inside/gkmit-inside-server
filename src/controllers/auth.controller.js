import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { Role } from '../models/Role.model.js';

const generateToken = payload => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });
};

/**
 * @desc    Login (Admin or Employee)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: 'Please provide email and password' });
  }

  try {
    // admin check
    const isAdminEmail = email === process.env.ADMIN_EMAIL;
    const isAdminPassword = password === process.env.ADMIN_PASSWORD;

    if (isAdminEmail && isAdminPassword) {
      const token = generateToken({
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
      });
      return res.status(200).json({
        token,
        user: { email: process.env.ADMIN_EMAIL, role: 'admin' },
      });
    }

    // employee check
    const user = await User.findOne({ email })
      .select('+passwordHash')
      .populate('role', 'name');

    if (!user || user.role.name !== 'employee') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        message: 'Account not approved. Please contact admin.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user._id,
      role: user.role.name,
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Register a new employee (pending approval)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all fields' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const employeeRole = await Role.findOne({ name: 'employee' });
    if (!employeeRole) {
      return res.status(500).json({ message: 'Default role not found' });
    }

    const newUser = await User.create({
      name,
      email,
      passwordHash: password,
      role: employeeRole._id,
      isApproved: false,
    });

    if (newUser) {
      res.status(201).json({
        message: 'Registration successful. Waiting for admin approval.',
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
