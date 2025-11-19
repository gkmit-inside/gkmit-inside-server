import { param, validationResult } from 'express-validator';
import { sendError } from '../../utils/apiResponse.js';
import { STATUS } from '../../constants/httpStatus.js';

export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        // request is stoped early
        return sendError(res, STATUS.BAD_REQUEST, errorMessages);
    }
    next();
};

// Validator for a MongoDB ID in the URL params
export const validateIdParam = [
    param('id').isMongoId().withMessage('Invalid ID format in URL parameter'),
    handleValidationErrors
];
