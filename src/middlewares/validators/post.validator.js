import joi from 'joi';
import { STATUS } from '../../constants/httpStatus.js';
import { sendError } from '../../utils/apiResponse.js';

const createPostSchema = joi.object({
    title: joi.string().min(3).max(100).required(),
    description: joi.string().min(10).required(),
    subtitle: joi.string().allow('').optional(),
    tags: joi.array().items(joi.string()).optional(),
});

/**
 * @desc    Middleware to validate post creation request body
 */
export const validatePost = (req, res, next) => {
    const { error } = createPostSchema.validate(req.body);

    if (error) {
        return sendError(res, STATUS.BAD_REQUEST, error.details[0].message);
    }

    // Check for file (image)
    if (!req.file) {
        return sendError(res, STATUS.BAD_REQUEST, 'Image file is required');
    }

    next();
};