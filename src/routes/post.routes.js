import express from 'express';
import { createPost, getMyPosts, updatePost, deletePost, addComment, toggleReaction, toggleBookmark, getFeed, getPostById, getBookmarkedPosts} from '../controllers/post.controller.js';
import { isAuth } from '../middlewares/auth.middleware.js';
import { validatePost } from '../middlewares/validators/post.validator.js';
import { upload, handleUploadError } from '../middlewares/upload.js';

export const postRouter = express.Router();

postRouter.post('/', isAuth, upload.single('image'), handleUploadError, validatePost, createPost);

postRouter.get('/me', isAuth, getMyPosts);
postRouter.put('/:id', isAuth, updatePost);
postRouter.delete('/:id', isAuth, deletePost);

postRouter.post('/:id/comment', isAuth, addComment);
postRouter.post('/:id/react', isAuth, toggleReaction);
postRouter.post('/:id/bookmark', isAuth, toggleBookmark);

postRouter.get('/', isAuth, getFeed);

postRouter.get('/:id', isAuth, getPostById);

postRouter.get('/bookmarks/me', isAuth, getBookmarkedPosts);