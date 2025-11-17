import { User } from '../models/User.model.js';
import { Role } from '../models/Role.model.js';
import { STATUS } from '../constants/httpStatus.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import { ROLES } from '../constants/roles.js';
import jwt from 'jsonwebtoken'

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
        const adminPayload = {
            email: process.env.ADMIN_EMAIL,
            role: ROLES.ADMIN,
        };
        
        const accessToken = generateAccessToken(adminPayload);
        const refreshToken = generateRefreshToken(adminPayload);

        return {
            statusCode: STATUS.OK,
            data: {
                accessToken,
                user: { email: process.env.ADMIN_EMAIL, role: ROLES.ADMIN },
            },
            refreshToken,
        };
    }
    
    // employee
    const user = await User.findOne({ email })
        .select('+passwordHash')
        .populate('role', 'name');

    if (!user || user.role.name !== ROLES.EMPLOYEE) {
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

    const userPayload = {
        id: user._id,
        role: user.role.name,
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role.name,
    };

    return {
        statusCode: STATUS.OK,
        data: { accessToken, user: userData },
        refreshToken,
    };
};

/**
 * @desc    Handles new employee registration
 * @param   {string} name
 * @param   {string} email
 * @param   {string} password
 * @param   {string} department
 * @returns {object} { statusCode, data, message }
 */
export const registerNewUser = async (name, email, password, department) => {
    const userExists = await User.findOne({ email });
    if (userExists) {
        return {
            statusCode: STATUS.CONFLICT,
            message: 'User already exists',
        };
    }

    const employeeRole = await Role.findOne({ name: ROLES.EMPLOYEE });
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
        department,
        role: employeeRole._id,
        isApproved: false,
    });

    return {
        statusCode: STATUS.CREATED,
        message: 'Registration successful. Waiting for admin approval.',
    };
};


/**
 * @desc    Validates a refresh token and issues a new access token
 * @param   {string} token - The incoming refresh token
 * @returns {object} { statusCode, accessToken, message }
 */
export const refreshAccessToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        let newAccessToken;
        // for admin
        if (decoded.role === ROLES.ADMIN) {
            newAccessToken = generateAccessToken({
                email: decoded.email,
                role: ROLES.ADMIN,
            });
        } else {
            // user still exist
            const user = await User.findById(decoded.id);
            if (!user) {
                return {
                    statusCode: STATUS.UNAUTHORIZED,
                    message: 'User not found',
                };
            }

            newAccessToken = generateAccessToken({
                id: user._id,
                role: user.role.name,
            });
        }

        return {
            statusCode: STATUS.OK,
            accessToken: newAccessToken,
        };

    } catch (error) {
        return {
            statusCode: STATUS.UNAUTHORIZED,
            message: 'Invalid or expired refresh token',
        };
    }
};