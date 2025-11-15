import jwt from 'jsonwebtoken';

/**
 * @desc    Generates a short-lived Access Token
 */
export const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
};

/**
 * @desc    Generates a long-lived Refresh Token
 */
export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });
};