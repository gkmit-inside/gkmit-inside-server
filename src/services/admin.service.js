import { User } from '../models/User.model.js';
import { Post } from '../models/Post.model.js';
import { STATUS } from '../constants/httpStatus.js';

/**
 * @desc    Get users by status
 * @replaces getPendingUsers
 */
export const getUsersByStatus = async (status) => {
    const query = {};
    if (status === 'pending') {
        query.isApproved = false;
    } else if (status === 'approved') {
        query.isApproved = true; 
    }
    const users = await User.find(query).select('name email createdAt isApproved');
    return { statusCode: STATUS.OK, data: users };
};

/**
 * @desc    Update a user's status (approve/reject)
 * @replaces approveUser
 */
export const updateUserStatus = async (userId, status) => {
    if (!['approved', 'rejected'].includes(status)) {
        return { statusCode: STATUS.BAD_REQUEST, message: 'Invalid status provided.' };
    }

    const user = await User.findById(userId);
    if (!user) {
        return { statusCode: STATUS.NOT_FOUND, message: 'User not found.' };
    }

    if (status === 'approved') {
        if (user.isApproved) {
            return { statusCode: STATUS.BAD_REQUEST, message: 'User is already approved.' };
        }
        user.isApproved = true;
        user.approvedAt = Date.now();
    } else if (status === 'rejected') {
        user.isApproved = false; 
    }

    const updatedUser = await user.save();
    return { statusCode: STATUS.OK, data: updatedUser };
};

/**
 * @desc    Get posts by status
 * @replaces getPendingPosts
 */
export const getPostsByStatus = async (status) => {
    const query = { deletedAt: null };
    if (status) {
        query.postStatus = status; 
    }
    const posts = await Post.find(query)
        .populate('userId', 'name email')
        .select('title description createdAt postStatus');
    return { statusCode: STATUS.OK, data: posts };
};

/**
 * @desc    Update a post's status (approve/reject)
 * @replaces approvePost and rejectPost
 */
export const updatePostStatus = async (postId, status) => {
    if (!['approved', 'rejected'].includes(status)) {
        return { statusCode: STATUS.BAD_REQUEST, message: 'Invalid status provided.' };
    }

    const post = await Post.findById(postId);
    if (!post) {
        return { statusCode: STATUS.NOT_FOUND, message: 'Post not found.' };
    }
    if (post.postStatus === status) {
        return { statusCode: STATUS.BAD_REQUEST, message: `Post is already ${status}.` };
    }

    post.postStatus = status;
    if (status === 'approved') {
        post.approvedAt = Date.now();
    }
    const updatedPost = await post.save();
    return { statusCode: STATUS.OK, data: updatedPost };
};