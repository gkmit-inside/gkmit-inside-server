import { User } from '../models/User.model.js';
import { Role } from '../models/Role.model.js';
import { STATUS } from '../constants/httpStatus.js';
import { generateToken } from '../utils/generateToken.js';

/**
 * @desc    Handles Admin or Employee login
 * @param   {string} email
 * @param   {string} password
 * @returns {object} { statusCode, data, message }
 */
export const loginUser = async (email, password) => {
    // admin
    const isAdminEmail = email === process.env.ADMIN_EMAIL;
    const isAdminPassword = password === process.env.ADMIN_PASSWORD;
    if (isAdminEmail && isAdminPassword) {
        const token = generateToken({
            email: process.env.ADMIN_EMAIL,
            role: 'admin',
        });
        return {
            statusCode: STATUS.OK,
            data: {
                token,
                user: { email: process.env.ADMIN_EMAIL, role: 'admin' },
            },
        };
    }
    // employee
    const user = await User.findOne({ email })
        .select('+passwordHash')
        .populate('role', 'name');

    if (!user || user.role.name !== 'employee') {
        return {
            statusCode: STATUS.UNAUTHORIZED,
            message: 'Invalid credentials',
        };
    }

    if (!user.isApproved) {
        return {
            statusCode: STATUS.FORBIDDEN,
            message: 'Account not approved. Please contact admin.',
        };
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return {
            statusCode: STATUS.UNAUTHORIZED,
            message: 'Invalid credentials',
        };
    }

    const token = generateToken({
        id: user._id,
        role: user.role.name,
    });

    const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role.name,
    };

    return {
        statusCode: STATUS.OK,
        data: { token, user: userData },
    };
};

/**
 * @desc    Handles new employee registration
 * @param   {string} name
 * @param   {string} email
 * @param   {string} password
 * @returns {object} { statusCode, data, message }
 */
export const registerNewUser = async (name, email, password) => {
    const userExists = await User.findOne({ email });
    if (userExists) {
        return {
            statusCode: STATUS.BAD_REQUEST,
            message: 'User already exists',
        };
    }

    const employeeRole = await Role.findOne({ name: 'employee' });
    if (!employeeRole) {
        return {
            statusCode: STATUS.INTERNAL_SERVER_ERROR,
            message: 'Default role not found',
        };
    }

    await User.create({
        name,
        email,
        passwordHash: password,
        role: employeeRole._id,
        isApproved: false,
    });

    return {
        statusCode: STATUS.CREATED,
        message: 'Registration successful. Waiting for admin approval.',
    };
};