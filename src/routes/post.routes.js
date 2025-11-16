import express from 'express';
import { createPost, getMyPosts, updatePost, deletePost } from '../controllers/post.controller.js';
import { isAuth } from '../middlewares/auth.middleware.js';
import { validatePost } from '../middlewares/validators/post.validator.js';
import { upload, handleUploadError } from '../middlewares/upload.js';

export const postRouter = express.Router();

// Define the route: POST /api/posts (Commit 2)
postRouter.post(
    '/',
    isAuth,
    upload.single('image'),
    handleUploadError,
    validatePost,
    createPost
);

// --- New Routes for Commit 4 (Post CRUD) ---

// Get all my posts
postRouter.get('/me', isAuth, getMyPosts);

// Update/Delete a specific post
postRouter.put('/:id', isAuth, updatePost);

postRouter.delete('/:id', isAuth, deletePost);