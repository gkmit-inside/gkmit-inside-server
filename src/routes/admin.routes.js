import express from 'express';
import {
    getUsers,
    updateUserStatus,
    getPosts,
    updatePostStatus
} from '../controllers/admin.controller.js';
import { isAuth, isAdmin } from '../middlewares/auth.middleware.js';
// Note: We will add validators in a later commit as planned
// import { validateUpdateUserStatus } from '../validators/admin.validators.js';
// import { validateUpdatePostStatus } from '../validators/post.validators.js';

export const adminRouter = express.Router();

// All admin routes are protected by isAuth and isAdmin
adminRouter.use(isAuth, isAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get users, filter by query param
 * @access  Admin
 * @example GET /api/admin/users?status=pending
 */
adminRouter.get('/users', getUsers);

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Approve or reject a user
 * @access  Admin
 */
adminRouter.patch('/users/:id/status', /* validateUpdateUserStatus, */ updateUserStatus);

/**
 * @route   GET /api/admin/posts
 * @desc    Get posts, filter by query param
 * @access  Admin
 * @example GET /api/admin/posts?status=pending
 */
adminRouter.get('/posts', getPosts);

/**
 * @route   PATCH /api/admin/posts/:id/status
 * @desc    Approve or reject a post
 * @access  Admin
 */
adminRouter.patch('/posts/:id/status', /* validateUpdatePostStatus, */ updatePostStatus);