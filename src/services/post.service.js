import { imagekit } from '../config/imagekit.js';
import { Post } from '../models/Post.model.js';
import { STATUS } from '../constants/httpStatus.js';

// ... (existing createPost function) ...
export const createPost = async (postData, file, userId) => {
// ... existing code ...
};

/**
 * @desc    Get all posts created by a user
 * @param   {string} userId - The ID of the user requesting their posts
 * @returns {object} { statusCode, data }
 */
export const getMyPosts = async (userId) => {
    const posts = await Post.find({ userId: userId, deletedAt: null }).sort({ createdAt: -1 });
    return {
        statusCode: STATUS.OK,
        data: posts,
    };
};

/**
 * @desc    Update a user's own post
 * @param   {string} postId - The ID of the post to update
 * @param   {object} postData - The data to update
 * @param   {string} userId - The ID of the user (for ownership check)
 * @returns {object} { statusCode, data, message }
 */
export const updatePost = async (postId, postData, userId) => {
    const post = await Post.findById(postId);
    if (!post || post.deletedAt) {
        return { statusCode: STATUS.NOT_FOUND, message: 'Post not found' };
    }
    
    // Ownership Check (Crucial for security)
    if (post.userId.toString() !== userId) {
        return { statusCode: STATUS.FORBIDDEN, message: 'Not authorized to update this post' };
    }
    
    // Only allow updates if post is not approved or is pending
    if (post.postStatus !== 'pending') {
         return { statusCode: STATUS.BAD_REQUEST, message: 'Only pending posts can be updated' };
    }

    // Update the post fields
    const updatedPost = await Post.findByIdAndUpdate(
        postId,
        postData,
        { new: true, runValidators: true }
    );

    return {
        statusCode: STATUS.OK,
        data: updatedPost,
    };
};


/**
 * @desc    Delete a user's own post (soft delete)
 * @param   {string} postId - The ID of the post to delete
 * @param   {string} userId - The ID of the user (for ownership check)
 * @returns {object} { statusCode, message }
 */
export const deletePost = async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post || post.deletedAt) {
        return { statusCode: STATUS.NOT_FOUND, message: 'Post not found' };
    }
    
    // Ownership Check
    if (post.userId.toString() !== userId) {
        return { statusCode: STATUS.FORBIDDEN, message: 'Not authorized to delete this post' };
    }
    
    // Soft Delete: Mark as deleted
    post.deletedAt = Date.now();
    await post.save();

    return {
        statusCode: STATUS.OK,
        message: 'Post deleted successfully',
    };
};