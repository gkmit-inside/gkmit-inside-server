/**
 * @desc    Creates a standardized success response
 * @param   {number} statusCode - HTTP status code
 * @param   {object | array | string} data - Data to be sent
 * @param   {string} message - Success message
 * @returns {object} Standardized JSON response
 */
export const sendSuccess = (res, statusCode, data, message = 'Success') => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * @desc    Creates a standardized error response
 * @param   {number} statusCode - HTTP status code
 * @param   {string} message - Error message
 * @returns {object} Standardized JSON response
 */
export const sendError = (res, statusCode, message = 'Error') => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};