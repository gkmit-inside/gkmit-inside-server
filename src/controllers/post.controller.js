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
// ... existing code ...
});

/**
 * @desc    Get all posts created by the logged-in user
 * @route   GET /api/posts/me
 * @access  Protected
 */
export const getMyPosts = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await PostService.getMyPosts(userId);
    return sendSuccess(res, result.statusCode, result.data);
});

/**
 * @desc    Update a user's own post
 * @route   PUT /api/posts/:id
 * @access  Protected (Owner Only)
 */
export const updatePost = asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    const postData = req.body;

    const result = await PostService.updatePost(postId, postData, userId);

    if (result.message) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, result.data, 'Post updated successfully');
});


/**
 * @desc    Delete a user's own post (soft delete)
 * @route   DELETE /api/posts/:id
 * @access  Protected (Owner Only)
 */
export const deletePost = asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    
    const result = await PostService.deletePost(postId, userId);

    if (result.message) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, null, result.message);
});