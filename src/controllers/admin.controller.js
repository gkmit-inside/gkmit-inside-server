import * as AdminService from '../services/admin.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { STATUS } from '../constants/httpStatus.js';

export const getPendingUsers = asyncHandler(async (req, res) => {
    const result = await AdminService.getPendingUsers();
    return sendSuccess(res, result.statusCode, result.data);
});

export const approveUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await AdminService.approveUser(id);

    if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, null, result.message);
});

export const getPendingPosts = asyncHandler(async (req, res) => {
    const result = await AdminService.getPendingPosts();
    return sendSuccess(res, result.statusCode, result.data);
});

export const approvePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await AdminService.approvePost(id);

    if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }

    return sendSuccess(res, result.statusCode, null, result.message);
});

export const rejectPost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await AdminService.rejectPost(id);

    if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, null, result.message);
});