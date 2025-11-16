import express from 'express';
import {getPendingUsers, approveUser, getPendingPosts, approvePost, rejectPost,} from '../controllers/admin.controller.js';
import { isAuth, isAdmin } from '../middlewares/auth.middleware.js';

export const adminRouter = express.Router();

adminRouter.use(isAuth, isAdmin);
adminRouter.get('/users/pending', getPendingUsers);
adminRouter.patch('/users/:id/approve', approveUser);
adminRouter.get('/posts/pending', getPendingPosts);
adminRouter.patch('/posts/:id/approve', approvePost);
adminRouter.patch('/posts/:id/reject', rejectPost);