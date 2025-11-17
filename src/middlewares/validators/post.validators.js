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

// Validator for the 'id' param specifically on post routes
export const validatePostIdParam = [
    param('id').isMongoId().withMessage('Invalid Post ID format'),
    handleValidationErrors
];

export const validateCreatePost = [
    body('title')
        .notEmpty().withMessage('Title is required.')
        .isLength({ min: 3 }).withMessage('Title must be at least 3 characters long.'),
    body('description')
        .notEmpty().withMessage('Description is required.'),
    handleValidationErrors
];

export const validateUpdatePost = [
    body('title')
        .optional()
        .isLength({ min: 3 }).withMessage('Title must be at least 3 characters long.'),
    body('description')
        .optional(),
    handleValidationErrors
];

export const validateAddComment = [
    body('content')
        .notEmpty().withMessage('Comment content cannot be empty.')
        .isLength({ max: 500 }).withMessage('Comment must be under 500 characters.'),
    handleValidationErrors
];

export const validateUpdatePostStatus = [
    body('status')
        .isIn(['approved', 'rejected']).withMessage('Status must be "approved" or "rejected".'),
    handleValidationErrors
];