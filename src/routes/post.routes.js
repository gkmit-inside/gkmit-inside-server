import express from 'express';
import {
    createPost,
    getPosts, 
    updatePost,
    deletePost,
    addComment,
    toggleReaction,
    toggleBookmark,
    getPostById,
    getBookmarkedPosts,
} from '../controllers/post.controller.js';
import { getActivities } from '../controllers/activity.controller.js';
import { isAuth } from '../middlewares/auth.middleware.js';
import { upload, handleUploadError } from '../middlewares/upload.js';


export const postRouter = express.Router();

/**
 * @route   GET /api/activity
 * @desc    Get the personalized user activity log
 * @access  Authenticated User
 */
postRouter.get('/activity', isAuth, getActivities); 

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 */
postRouter.post('/', isAuth, upload.single('image'), handleUploadError, createPost);

/**
 * @route   GET /api/posts
 * @desc    Get posts. Handles main feed and "my posts".
 * @example GET /api/posts (Main Feed)
 * @example GET /api/posts?userId=... (A specific user's posts)
 */
postRouter.get('/', isAuth, getPosts);

/**
 * @route   GET /api/posts/bookmarks
 * @desc    Get all posts bookmarked by the current user
 * @access  Authenticated User
 */
postRouter.get('/bookmarks', isAuth, getBookmarkedPosts);


/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post by its ID
 */
postRouter.get('/:id', isAuth, getPostById);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update an owned, pending post
 */
postRouter.put('/:id', isAuth, updatePost);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Soft-delete an owned post
 */
postRouter.delete('/:id', isAuth, deletePost);

/**
 * @route   POST /api/posts/:id/comment
 * @desc    Add a comment to a post
 */
postRouter.post('/:id/comment', isAuth, addComment);

/**
 * @route   POST /api/posts/:id/react
 * @desc    Toggle a reaction (like) on a post
 */
postRouter.post('/:id/react', isAuth, toggleReaction);

/**
 * @route   POST /api/posts/:id/bookmark
 * @desc    Toggle a bookmark on a post
 */
postRouter.post('/:id/bookmark', isAuth, toggleBookmark);

