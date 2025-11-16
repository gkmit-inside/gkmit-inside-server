import { STATUS } from '../constants/httpStatus.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * @desc    Global error handling middleware
 * @note    This MUST be the last middleware added in server.js
 */
export const globalErrorHandler = (err, req, res, next) => {
    console.error('GLOBAL ERROR HANDLER:', err);

    // default as 500
    const statusCode = err.statusCode || STATUS.INTERNAL_SERVER_ERROR;
    const message = err.message || 'An unexpected error occurred';

    return sendError(res, statusCode, message);
};

/**
 * @desc    A wrapper for async controller functions to catch errors
 * and pass them to the globalErrorHandler
 */
export const asyncHandler = (fn) => (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
};