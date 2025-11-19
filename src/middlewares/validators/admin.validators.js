import { body, param, validationResult } from 'express-validator';
import { sendError } from '../../utils/apiResponse.js';
import { STATUS } from '../../constants/httpStatus.js';
import { handleValidationErrors } from './common.validators.js';


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