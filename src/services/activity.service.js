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
                { ownerId: currentUserId },        // 1. Personal notifications (REACTED, COMMENTED)
                { ownerId: GLOBAL_FEED_ID }         // 2. Global posts (POSTED events - visible to all)
            ]
        };

        const activities = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .limit(50) 
            .populate('actorId', 'name')
            .populate('postId', 'title userId') 
            .lean();

        // 3. Structure the data
        const structuredActivities = activities.map(activity => {
            // Check if the current user is the post owner (for rendering "my post")
            // This is ONLY true if the event is REACTED/COMMENTED on their own post.
            const isOwner = activity.postId?.userId?.toString() === currentUserId;

            return {
                _id: activity._id,
                type: activity.activityType,
                createdAt: activity.createdAt,
                
                actorName: activity.actorId?.name || '[Deleted User]',
                postTitle: activity.postId?.title || '[Deleted Post]',
                
                // isMyPost: True only if the log entry is a personal notification
                // related to a post the current user owns.
                isMyPost: isOwner && (activity.activityType === 'REACTED' || activity.activityType === 'COMMENTED'),
            };
        });

        return structuredActivities;
    } catch (error) {
        throw new CustomError(error.message, STATUS.INTERNAL_SERVER_ERROR);
    }
};