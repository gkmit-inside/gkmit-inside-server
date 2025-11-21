import { User } from '../models/User.model.js';
import { Post } from '../models/Post.model.js';
import { STATUS } from '../constants/httpStatus.js';
import { CustomError } from '../utils/CustomError.js'; // Import the new error class
import mongoose from 'mongoose';
import { ActivityLog } from '../models/ActivityLog.model.js';

export const getUsersByStatus = async (status) => {
    try {
        const query = {};
        if (status === 'pending') {
            query.isApproved = false;
        } else if (status === 'approved') {
            query.isApproved = true; 
        }
        const users = await User.find(query).select('name email createdAt isApproved department').sort({createdAt: -1});
        return users; // Just return data
    } catch (error) {
        throw new CustomError(error.message, STATUS.INTERNAL_SERVER_ERROR);
    }
};

export const updateUserStatus = async (userId, status) => {
    try{
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
    return updatedUser;
 }catch(error){
            if (error instanceof CustomError) {
            throw error;
        }
        throw new CustomError(error.message, STATUS.INTERNAL_SERVER_ERROR);
    } // Just return data
};

export const getPostsByStatus = async (status) => {
    try {
        const query = { deletedAt: null };
        if (status) {
            query.postStatus = status; 
        }
        
        const posts = await Post.find(query)
            .populate('userId', 'name email')
            .select('title description createdAt postStatus image mediaUrl');
        return posts; // Just return data
    } catch (error) {
        throw new CustomError(error.message, STATUS.INTERNAL_SERVER_ERROR);
    }
};

const GLOBAL_FEED_ID = new mongoose.Types.ObjectId('000000000000000000000001');

export const updatePostStatus = async (postId, status) => {
    try {
        const post = await Post.findById(postId);
        // ... (validation checks omitted)

        const originalStatus = post.postStatus;
        post.postStatus = status;

        if (status === 'approved') {
            post.approvedAt = Date.now();
        }

        const updatedPost = await post.save();

        // --- FIX: NEW ACTIVITY LOGIC: POST APPROVED ---
        if (status === 'approved' && originalStatus === 'pending') {
            await ActivityLog.create({
                // The post approval event is owned by the GLOBAL FEED ID 
                // so that ALL users can query for it.
                ownerId: GLOBAL_FEED_ID, 
                actorId: updatedPost.userId, // Actor is the original author (the user who posted)
                postId: updatedPost._id,
                activityType: 'POSTED',
            });
        }
        // --- END ACTIVITY LOGIC ---
        
        return updatedPost;
    } catch (error) {
        if (error instanceof CustomError) {
            throw error;
        }
        throw new CustomError(error.message, STATUS.INTERNAL_SERVER_ERROR);
    }
};