import * as PostService from '../services/post.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { STATUS } from '../constants/httpStatus.js';

export const createPost = async (req, res, next) => {
    try {
        const { body, file } = req;
        const userId = req.user.id;
        const result = await PostService.createPost(body, file, userId);
        return sendSuccess(res, result.statusCode, result.data, result.message);
    } catch (error) {
        next(error);
    }
};

export const getPosts = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.query;
        
        let data;
        if (userId) {
            data = await PostService.getPostsByUser(userId, currentUserId);
        } else {
            data = await PostService.getFeed(currentUserId);
        }
        return sendSuccess(res, STATUS.OK, data);
    } catch (error) {
        next(error);
    }
};

export const getPostById = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const currentUserId = req.user.id;
        const data = await PostService.getPostById(postId, currentUserId);
        return sendSuccess(res, STATUS.OK, data);
    } catch (error) {
        next(error);
    }
};

export const getBookmarkedPosts = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;
        const data = await PostService.getBookmarkedPosts(currentUserId);
        return sendSuccess(res, STATUS.OK, data);
    } catch (error) {
        next(error);
    }
};

export const updatePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const postData = req.body;
        const userId = req.user.id;
        const data = await PostService.updatePost(id, postData, userId);
        return sendSuccess(res, STATUS.OK, data);
    } catch (error) {
        next(error);
    }
};

export const deletePost = async (req, res, next) => {
     try {
        const { id } = req.params;
        const userId = req.user.id;
        const message = await PostService.deletePost(id, userId);
        return sendSuccess(res, STATUS.OK, null, message);
    } catch (error) {
        next(error);
    }
};

export const addComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        const result = await PostService.addComment(id, content, userId);
        return sendSuccess(res, result.statusCode, result.data, result.message);
    } catch (error) {
        next(error);
    }
};

export const toggleReaction = async (req, res, next) => {
    try {
        const { id } = req.params; 
        const userId = req.user.id;
        const result = await PostService.toggleReaction(id, userId);
        return sendSuccess(res, result.statusCode, result.data, result.message);
    } catch (error) {
        next(error);
    }
};

export const toggleBookmark = async (req, res, next) => {
    try {
        const { id } = req.params; 
        const userId = req.user.id;
        const result = await PostService.toggleBookmark(id, userId);
        return sendSuccess(res, result.statusCode, result.data, result.message);
    } catch (error) {
        next(error);
    }
};