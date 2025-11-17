import * as PostService from '../services/post.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { STATUS } from '../constants/httpStatus.js';
import { asyncHandler } from '../middlewares/errorHandler.js'; // Will be removed in Commit 6

// Note: This file now uses asyncHandler, but will be
// switched to try/catch in Commit 6 as planned.

export const createPost = asyncHandler(async (req, res) => {
    const { body, file } = req;
    const userId = req.user.id;
    const result = await PostService.createPost(body, file, userId);
    return sendSuccess(res, result.statusCode, result.data, result.message);
});

/**
 * @desc    Get posts (main feed or by user)
 * @route   GET /api/posts
 */
export const getPosts = asyncHandler(async (req, res) => {
    const currentUserId = req.user.id;
    const { userId } = req.query; // Check for ?userId=...
    
    let result;
    if (userId) {
        // This replaces 'getMyPosts'
        result = await PostService.getPostsByUser(userId, currentUserId);
    } else {
        // This replaces 'getFeed'
        result = await PostService.getFeed(currentUserId);
    }
    
    return sendSuccess(res, result.statusCode, result.data);
});

/**
 * @desc    Get a single post by ID
 * @route   GET /api/posts/:id
 */
export const getPostById = asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const currentUserId = req.user.id;
    const result = await PostService.getPostById(postId, currentUserId);

    if (result.message && result.statusCode !== STATUS.OK) {
        // This will be replaced by error throwing in Commit 6
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, result.data);
});

/**
 * @desc    Get posts bookmarked by current user
 * @route   GET /api/posts/bookmarks
 */
export const getBookmarkedPosts = asyncHandler(async (req, res) => {
    const currentUserId = req.user.id;
    const result = await PostService.getBookmarkedPosts(currentUserId);
    return sendSuccess(res, result.statusCode, result.data);
});

// --- Other controllers (Update, Delete, Interact) ---
// Using the original asyncHandler for now

export const updatePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const postData = req.body;
    const userId = req.user.id;
    const result = await PostService.updatePost(id, postData, userId);
    if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, result.data);
});

export const deletePost = asyncHandler(async (req, res) => {
     const { id } = req.params;
     const userId = req.user.id;
     const result = await PostService.deletePost(id, userId);
     if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }
     return sendSuccess(res, result.statusCode, null, result.message);
});

export const addComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const result = await PostService.addComment(id, content, userId);
    if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, result.data, result.message);
});

export const toggleReaction = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await PostService.toggleReaction(id, userId);
    if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, result.data, result.message);
});

export const toggleBookmark = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await PostService.toggleBookmark(id, userId);
    if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, result.data, result.message);
});