import express from 'express';
import { createPost } from '../controllers/post.controller.js';
import { isAuth } from '../middlewares/auth.middleware.js';
import { validatePost } from '../middlewares/validators/post.validator.js';
import { upload, handleUploadError } from '../middlewares/upload.js';

export const postRouter = express.Router();

postRouter.post('/', isAuth, upload.single('image'), handleUploadError, validatePost, createPost);