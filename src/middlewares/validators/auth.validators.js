import joi from 'joi'
import { STATUS } from '../../constants/httpStatus.js';
import { sendError } from '../../utils/apiResponse.js';

// registration 
const registerSchema = joi.object({
    name: joi.string().min(3).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    department: joi.string().required()
});

// login 
const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
});

/**
 * @desc    Middleware to validate request body against a Joi schema
 * @param   {joi.Schema} schema - The Joi schema to validate against
 */
export const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
        return sendError(res, STATUS.BAD_REQUEST, error.details[0].message);
    }

    next();
};

export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);