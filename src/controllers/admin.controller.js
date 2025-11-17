import * as AdminService from '../services/admin.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { STATUS } from '../constants/httpStatus.js';

export const getUsers = async (req, res, next) => {
    try {
        const { status } = req.query;
        const data = await AdminService.getUsersByStatus(status);
        return sendSuccess(res, STATUS.OK, data);
    } catch (error) {
        next(error);
    }
};

export const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const data = await AdminService.updateUserStatus(id, status);
        return sendSuccess(
            res, 
            STATUS.OK, 
            data, 
            `User has been ${status}.`
        );
    } catch (error) {
        next(error);
    }
};

export const getPosts = async (req, res, next) => {
    try {
        const { status } = req.query;
        const data = await AdminService.getPostsByStatus(status);
        return sendSuccess(res, STATUS.OK, data);
    } catch (error) {
        next(error);
    }
};

export const updatePostStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const data = await AdminService.updatePostStatus(id, status);
        
        return sendSuccess(
            res, 
            STATUS.OK, 
            data, 
            `Post has been ${status}.`
        );
    } catch (error) {
        next(error);
    }
};