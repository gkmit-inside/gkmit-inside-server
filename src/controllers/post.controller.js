import { STATUS } from '../constants/httpStatus.js';
import * as PostService from '../services/post.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const createPost = asyncHandler(async (req, res) => {
    const { body, file } = req;
    const userId = req.user.id; 
    const result = await PostService.createPost(body, file, userId);
    if (result.message) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, result.data);
});

export const getMyPosts = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await PostService.getMyPosts(userId);
    return sendSuccess(res, result.statusCode, result.data);
});

export const updatePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { body } = req;
    const result = await PostService.updatePost(id, body, userId);
    if (result.message) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, result.data, "Post updated successfully");
});

export const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await PostService.deletePost(id, userId);
    if (result.message) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, null, result.message);
});

export const addComment = asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;
    const result = await PostService.addComment(postId, content, userId);
    if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, result.data, result.message);
});

export const toggleReaction = asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    const result = await PostService.toggleReaction(postId, userId);
    if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, null, result.message);
});

export const toggleBookmark = asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    const result = await PostService.toggleBookmark(postId, userId);
    if (result.statusCode >= STATUS.BAD_REQUEST) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, null, result.message);
});


export const getFeed = asyncHandler(async (req, res) => {
    const currentUserId = req.user.id;
    const result = await PostService.getFeed(currentUserId);
    return sendSuccess(res, result.statusCode, result.data);
});

export const getPostById = asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const currentUserId = req.user.id;
    const result = await PostService.getPostById(postId, currentUserId);

    if (result.message) {
        return sendError(res, result.statusCode, result.message);
    }
    return sendSuccess(res, result.statusCode, result.data);
});

export const getBookmarkedPosts = asyncHandler(async (req, res) => {
    const currentUserId = req.user.id;
    const result = await PostService.getBookmarkedPosts(currentUserId);
    return sendSuccess(res, result.statusCode, result.data);
});