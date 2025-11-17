import { body, param, validationResult } from 'express-validator';
import { sendError } from '../../utils/apiResponse.js';
import { STATUS } from '../../constants/httpStatus.js';

// Middleware to check validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        return sendError(res, STATUS.BAD_REQUEST, errorMessages);
    }
    next();
};

// Validator for the 'id' param specifically on admin routes
export const validateUserIdParam = [
    param('id').isMongoId().withMessage('Invalid User ID format'),
    handleValidationErrors
];

export const validateUpdateUserStatus = [
    body('status')
        .isIn(['approved', 'rejected']).withMessage('Status must be "approved" or "rejected".'),
    handleValidationErrors
];