import express from 'express';
import { getUsers, updateUserStatus, getPosts, updatePostStatus} from '../controllers/admin.controller.js';
import { isAuth, isAdmin } from '../middlewares/auth.middleware.js';
import { validateUpdateUserStatus, validateUserIdParam } from '../middlewares/validators/admin.validators.js';
import { validateUpdatePostStatus } from '../middlewares/validators/post.validators.js';
import { validateIdParam } from '../middlewares/validators/common.validators.js';

export const adminRouter = express.Router();

adminRouter.use(isAuth, isAdmin);

/**
 * @route   GET /api/admin/users
 */
adminRouter.get('/users', getUsers);

/**
 * @route   PATCH /api/admin/users/:id/status
 */
adminRouter.patch(
    '/users/:id/status', 
    validateUserIdParam, 
    validateUpdateUserStatus,
    updateUserStatus
);

/**
 * @route   GET /api/admin/posts
 */
adminRouter.get('/posts', getPosts);

/**
 * @route   PATCH /api/admin/posts/:id/status
 */
adminRouter.patch(
    '/posts/:id/status', 
    validateIdParam,
    validateUpdatePostStatus,
    updatePostStatus
);