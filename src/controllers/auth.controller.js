import { STATUS } from '../constants/httpStatus.js';
import * as AuthService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

/**
 * @desc    Unified Login (Admin or Employee)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await AuthService.loginUser(email, password);
    if (result.message) {
        return sendError(res, result.statusCode, result.message);
    }
    const { accessToken, user } = result.data;
    const { refreshToken } = result;

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, // Makes it inaccessible to JavaScript
        secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches token)
        sameSite: 'strict', // Helps prevent CSRF
    });

    return sendSuccess(res, result.statusCode, { accessToken, user });
});

/**
 * @desc    Register a new employee (pending approval)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const result = await AuthService.registerNewUser(name, email, password);
    if (result.message) {
        if (result.statusCode === STATUS.CREATED) {
            return sendSuccess(res, result.statusCode, null, result.message);
        }
        return sendError(res, result.statusCode, result.message);
    }
});


/**
 * @desc    Get a new access token using a refresh token
 * @route   POST /api/auth/refresh
 * @access  Public (Relies on httpOnly cookie)
 */
export const handleRefreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken;

    if (!token) {
        return sendError(res, STATUS.UNAUTHORIZED, 'No refresh token provided');
    }

    const result = await AuthService.refreshAccessToken(token);

    if (result.message) {
        return sendError(res, result.statusCode, result.message);
    }

    return sendSuccess(res, result.statusCode, {
        accessToken: result.accessToken,
    });
});