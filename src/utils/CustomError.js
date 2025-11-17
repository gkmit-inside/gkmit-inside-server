/**
 * CustomError Class
 * Extends the built-in Error class to include a statusCode
 * for consistent, centralized error handling.
 */
export class CustomError extends Error {
    /**
     * @param {string} message - The error message
     * @param {number} statusCode - The HTTP status code
     */
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}