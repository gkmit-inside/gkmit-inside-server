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
    return sendSuccess(res, result.statusCode, result.data);
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