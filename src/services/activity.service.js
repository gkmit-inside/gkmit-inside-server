import { ActivityLog } from '../models/ActivityLog.model.js';
import { CustomError } from '../utils/CustomError.js';
import { STATUS } from '../constants/httpStatus.js';
import { User } from '../models/User.model.js';
import mongoose from 'mongoose';

// --- GLOBAL FEED CONSTANT ---
// Must match the ID used in admin.service.js
const GLOBAL_FEED_ID = new mongoose.Types.ObjectId('000000000000000000000001');

/**
 * @desc    Fetches and populates the personalized activity log for a user.
 */
export const getActivitiesForUser = async (currentUserId) => {
    try {
        const query = {
            $or: [
                { ownerId: currentUserId },      
                { ownerId: GLOBAL_FEED_ID }        
            ]
        };
        const activities = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .limit(50) 
            .populate('actorId', 'name')
            .populate('postId', 'title userId') 
            .lean();
        const structuredActivities = activities.map(activity => {
        const isOwner = activity.postId?.userId?.toString() === currentUserId;

            return {
                _id: activity._id,
                type: activity.activityType,
                createdAt: activity.createdAt,
                actorName: activity.actorId?.name || '[Deleted User]',
                postTitle: activity.postId?.title || '[Deleted Post]',
                isMyPost: isOwner && (activity.activityType === 'REACTED' || activity.activityType === 'COMMENTED'),
            };
        });

        return structuredActivities;
    } catch (error) {
        throw new CustomError(error.message, STATUS.INTERNAL_SERVER_ERROR);
    }
};