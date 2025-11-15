import jwt from 'jsonwebtoken';

/**
 * @desc    Generates a JWT token
 * @param   {object} payload - The payload to sign
 * @returns {string} The generated JWT
 */
export const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '8h',
    });
};