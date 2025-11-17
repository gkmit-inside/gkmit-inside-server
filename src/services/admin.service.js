import { User } from '../models/User.model.js';
import { Post } from '../models/Post.model.js';
import { STATUS } from '../constants/httpStatus.js';
import { CustomError } from '../utils/CustomError.js'; // Import the new error class

export const getUsersByStatus = async (status) => {
    try {
        const query = {};
        if (status === 'pending') {
            query.isApproved = false;
        } else if (status === 'approved') {
            query.isApproved = true; 
        }
        
        const users = await User.find(query).select('name email createdAt isApproved');
        return users; // Just return data
    } catch (error) {
        throw new CustomError(error.message, STATUS.INTERNAL_SERVER_ERROR);
    }
};

export const updateUserStatus = async (userId, status) => {
    if (!['approved', 'rejected'].includes(status)) {
        throw new CustomError('Invalid status provided.', STATUS.BAD_REQUEST);
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new CustomError('User not found.', STATUS.NOT_FOUND);
    }

    if (status === 'approved') {
        if (user.isApproved) {
            throw new CustomError('User is already approved.', STATUS.BAD_REQUEST);
        }
        user.isApproved = true;
        user.approvedAt = Date.now();
    } else if (status === 'rejected') {
        user.isApproved = false; 
    }

    const updatedUser = await user.save();
    return updatedUser; // Just return data
};

export const getPostsByStatus = async (status) => {
    try {
        const query = { deletedAt: null };
        if (status) {
            query.postStatus = status; 
        }
        
        const posts = await Post.find(query)
            .populate('userId', 'name email')
            .select('title description createdAt postStatus');
        return posts; // Just return data
    } catch (error) {
        throw new CustomError(error.message, STATUS.INTERNAL_SERVER_ERROR);
    }
};

export const updatePostStatus = async (postId, status) => {
    if (!['approved', 'rejected'].includes(status)) {
        throw new CustomError('Invalid status provided.', STATUS.BAD_REQUEST);
    }

    const post = await Post.findById(postId);
    if (!post) {
        throw new CustomError('Post not found.', STATUS.NOT_FOUND);
    }
    if (post.postStatus === status) {
        throw new CustomError(`Post is already ${status}.`, STATUS.BAD_REQUEST);
    }

    post.postStatus = status;
    if (status === 'approved') {
        post.approvedAt = Date.now();
    }

    const updatedPost = await post.save();
    return updatedPost; // Just return data
};