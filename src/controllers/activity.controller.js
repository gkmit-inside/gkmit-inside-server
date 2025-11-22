import * as ActivityService from '../services/activity.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { STATUS } from '../constants/httpStatus.js';

export const getActivities = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;

        const activities = await ActivityService.getActivitiesForUser(currentUserId);
        
        return sendSuccess(res, STATUS.OK, activities);
    } catch (error) {
        next(error);
    }
};