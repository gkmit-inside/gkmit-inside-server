import { User } from '../models/User.model.js';
import { Post } from '../models/Post.model.js';
import { STATUS } from '../constants/httpStatus.js';

/**
 * @desc    Get all users pending approval
 * @returns {object} { statusCode, data }
 */
export const getPendingUsers = async () => {
    const users = await User.find({ isApproved: false }).select('name email createdAt');
    return {
        statusCode: STATUS.OK,
        data: users,
    };
};

/**
 * @desc    Approve a user
 * @param   {string} userId - The ID of the user to approve
 * @returns {object} { statusCode, message }
 */
export const approveUser = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        return { statusCode: STATUS.NOT_FOUND, message: 'User not found' };
    }
    if (user.isApproved) {
        return { statusCode: STATUS.BAD_REQUEST, message: 'User is already approved' };
    }

    user.isApproved = true;
    user.approvedAt = Date.now();
    await user.save();

    return {
        statusCode: STATUS.OK,
        message: 'User approved successfully',
    };
};

/**
 * @desc    Get all posts pending approval
 * @returns {object} { statusCode, data }
 */
export const getPendingPosts = async () => {
    const posts = await Post.find({ postStatus: 'pending' })
        .populate('userId', 'name email') 
        .select('title description createdAt');
    return {
        statusCode: STATUS.OK,
        data: posts,
    };
};

/**
 * @desc    Approve a post
 * @param   {string} postId - The ID of the post to approve
 * @returns {object} { statusCode, message }
 */
export const approvePost = async (postId) => {
    const post = await Post.findById(postId);
    if (!post) {
        return { statusCode: STATUS.NOT_FOUND, message: 'Post not found' };
    }
    if (post.postStatus === 'approved') {
        return { statusCode: STATUS.BAD_REQUEST, message: 'Post is already approved' };
    }

    post.postStatus = 'approved';
    post.approvedAt = Date.now();
    await post.save();

    return {
        statusCode: STATUS.OK,
        message: 'Post approved successfully',
    };
};

/**
 * @desc    Reject a post
 * @param   {string} postId - The ID of the post to reject
 * @returns {object} { statusCode, message }
 */
export const rejectPost = async (postId) => {
    const post = await Post.findById(postId);
    if (!post) {
        return { statusCode: STATUS.NOT_FOUND, message: 'Post not found' };
    }
    if (post.postStatus === 'rejected') {
        return { statusCode: STATUS.BAD_REQUEST, message: 'Post is already rejected' };
    }

    post.postStatus = 'rejected';
    await post.save();
    return {
        statusCode: STATUS.OK,
        message: 'Post rejected successfully',
    };
};