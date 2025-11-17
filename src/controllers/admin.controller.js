import * as AdminService from '../services/admin.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { STATUS } from '../constants/httpStatus.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

/**
 * @desc    Get users by status
 * @route   GET /api/admin/users
 */
export const getUsers = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const result = await AdminService.getUsersByStatus(status);
    return sendSuccess(res, result.statusCode, result.data);
});

/**
 * @desc    Update a user's status (approve/reject)
 * @route   PATCH /api/admin/users/:id/status
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 

    const result = await AdminService.updateUserStatus(id, status);
    
    if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(
        res, 
        result.statusCode, 
        result.data, 
        `User has been ${status}.`
    );
});

/**
 * @desc    Get posts by status
 * @route   GET /api/admin/posts
 */
export const getPosts = asyncHandler(async (req, res) => {
    const { status } = req.query; // e.g., 'pending'
    const result = await AdminService.getPostsByStatus(status);
    return sendSuccess(res, result.statusCode, result.data);
});

/**
 * @desc    Update a post's status (approve/reject)
 * @route   PATCH /api/admin/posts/:id/status
 */
export const updatePostStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await AdminService.updatePostStatus(id, status);
    
    if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(
        res, 
        result.statusCode, 
        result.data, 
        `Post has been ${status}.`
    );
});