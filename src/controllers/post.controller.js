import { STATUS } from '../constants/httpStatus.js';
import * as PostService from '../services/post.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Protected
 */
export const createPost = asyncHandler(async (req, res) => {
    const { body, file } = req;
    const userId = req.user.id; 

    const result = await PostService.createPost(body, file, userId);

    if (result.message) {
        return sendError(res, result.statusCode, result.message);
    }

    return sendSuccess(res, result.statusCode, result.data);
});