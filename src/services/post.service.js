import { Post } from '../models/Post.model.js';
import { Comment } from '../models/Comment.model.js';
import { Reaction } from '../models/Reaction.model.js';
import { Bookmark } from '../models/Bookmark.model.js';
import { ActivityLog } from '../models/ActivityLog.model.js';
import { imagekit } from '../config/imagekit.js';
import { STATUS } from '../constants/httpStatus.js';
import { CustomError } from '../utils/CustomError.js';
import mongoose from 'mongoose';


export const getFeed = async (currentUserId) => {
    try {
        const posts = await Post.aggregate([
            // pipeline
            { $match: { postStatus: 'approved', deletedAt: null }},
            { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'author', pipeline: [{ $project: { name: 1, email: 1, department: 1, _id: 0 } }] }},
            { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'reactions', localField: '_id', foreignField: 'postId', as: 'reactions' }},
            { $lookup: { from: 'comments', localField: '_id', foreignField: 'postId', as: 'comments' }},
            { $lookup: {
                from: 'bookmarks',
                let: { postId: '$_id', userId: new mongoose.Types.ObjectId(currentUserId) },
                pipeline: [
                    { $match: { $expr: { $and: [ { $eq: ['$postId', '$$postId'] }, { $eq: ['$userId', '$$userId'] } ] } } }
                ],
                as: 'isBookmarked',
            }},
            { $project: {
                _id: 1, title: 1, subtitle: 1, description: 1, mediaUrl: 1, tags: 1,
                author: 1, createdAt: 1,
                reactionCount: { $size: '$reactions' },
                commentCount: { $size: '$comments' },
                isBookmarked: { $gt: [{ $size: '$isBookmarked' }, 0] }, 
                isLiked: {
                    $gt: [{
                        $size: {
                            $filter: {
                                input: '$reactions',
                                as: 'react',
                                cond: { $eq: ['$$react.userId', new mongoose.Types.ObjectId(currentUserId)] }
                            }
                        }
                    }, 0]
                }
            }},
            { $sort: { createdAt: -1 } }
        ]);
        return posts; // Just return data
    } catch (error) {
        throw new CustomError(error.message, STATUS.INTERNAL_SERVER_ERROR);
    }
};

export const getPostsByUser = async (userId, currentUserId) => {
    if (userId !== currentUserId) {
        throw new CustomError('Not authorized to view these posts', STATUS.FORBIDDEN);
    }
    try {
        const posts = await Post.find({ userId, deletedAt: null }).populate('userId', 'name email department').sort({ createdAt: -1 });

        return posts; // Just return data
    } catch (error) {
        throw new CustomError(error.message, STATUS.INTERNAL_SERVER_ERROR);
    }
};

export const createPost = async (postData, file, userId) => {
    if (!file) {
        throw new CustomError('Image file is required', STATUS.BAD_REQUEST);
    }
    try {
        const uploadResponse = await imagekit.upload({
            file: file.buffer,
            fileName: `${userId}_${Date.now()}_${file.originalname}`,
            folder: 'posts',
        });
        
        const { url } = uploadResponse;
        const newPost = await Post.create({
            ...postData,
            userId,
            mediaUrl: url,
            postStatus: 'pending',
        });
        // Return a full object here since controller needs it
        return { 
            statusCode: STATUS.CREATED, 
            data: newPost, 
            message: "Post created successfully. Awaiting admin approval." 
        };
    } catch (uploadError) {
        console.error('ImageKit upload error:', uploadError);
        throw new CustomError('Error uploading image', STATUS.INTERNAL_SERVER_ERROR);
    }
};

export const updatePost = async (postId, postData, userId) => {
    const post = await Post.findById(postId);
    if (!post || post.deletedAt) {
        throw new CustomError('Post not found', STATUS.NOT_FOUND);
    }
    if (post.userId.toString() !== userId) {
        throw new CustomError('Not authorized to update this post', STATUS.FORBIDDEN);
    }
    if (post.postStatus !== 'pending') {
         throw new CustomError('Only pending posts can be updated', STATUS.BAD_REQUEST);
    }

    const updatedPost = await Post.findByIdAndUpdate(
        postId,
        postData,
        { new: true, runValidators: true }
    );
    return updatedPost; // Just return data
};

export const deletePost = async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post || post.deletedAt) {
        throw new CustomError('Post not found', STATUS.NOT_FOUND);
    }
    if (post.userId.toString() !== userId) {
        throw new CustomError('Not authorized to delete this post', STATUS.FORBIDDEN);
    }
    
    post.deletedAt = Date.now();
    await post.save();
    return 'Post deleted successfully'; // Return message
};

export const addComment = async (postId, content, userId) => {
    const post = await Post.findById(postId);

    const newComment = await Comment.create({ postId, userId, content });

    if (post.userId.toString() !== userId) { 
        await ActivityLog.create({
            ownerId: post.userId,            
            actorId: userId,                  
            postId: post._id,
            activityType: 'COMMENTED',
            relatedEntityId: newComment._id, 
        });
    }
    return { statusCode: STATUS.CREATED, data: newComment, message: 'Comment added successfully' };
};

export const toggleReaction = async (postId, userId) => {
    const post = await Post.findById(postId);

    const existingReaction = await Reaction.findOne({ postId, userId });

    if (existingReaction) {
        await Reaction.deleteOne({ _id: existingReaction._id });
        await ActivityLog.deleteOne({ relatedEntityId: existingReaction._id });
        
        return { statusCode: STATUS.OK, message: 'Reaction removed successfully' };
    } else {
        const newReaction = await Reaction.create({ postId, userId, reactionType: 'like' });
        if (post.userId.toString() !== userId) { 
            await ActivityLog.create({
                ownerId: post.userId,             
                actorId: userId,                 
                postId: post._id,
                activityType: 'REACTED',
                relatedEntityId: newReaction._id, 
            });
        }
        return { statusCode: STATUS.CREATED, message: 'Reaction added successfully' };
    }
};

export const toggleBookmark = async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post || post.deletedAt || post.postStatus !== 'approved') {
        throw new CustomError('Post not found', STATUS.NOT_FOUND);
    }

    const existingBookmark = await Bookmark.findOne({ postId, userId });
    
    if (existingBookmark) {
        await Bookmark.deleteOne({ _id: existingBookmark._id });
        return { statusCode: STATUS.OK, message: 'Bookmark removed successfully' };
    } else {
        await Bookmark.create({ postId, userId });
        return { statusCode: STATUS.CREATED, message: 'Bookmark added successfully' };
    }
};

export const getPostById = async (postId, currentUserId) => {
    const post = await Post.findById(postId)
        .where({ deletedAt: null, postStatus: 'approved' })
        .populate('userId', 'name department email')
        .lean(); 

    if (!post) {
        throw new CustomError('Post not found', STATUS.NOT_FOUND);
    }
    
    const reactionCount = await Reaction.countDocuments({ postId });
    const commentCount = await Comment.countDocuments({ postId });
    const isLiked = await Reaction.exists({ postId, userId: currentUserId });
    const isBookmarked = await Bookmark.exists({ postId, userId: currentUserId });
    const comments = await Comment.find({ postId })
        .where({ deletedAt: null })
        .populate('userId', 'name email')
        .sort({ createdAt: 1 });

    const augmentedPost = {
        ...post,
        author: post.userId, 
        reactionCount,
        commentCount,
        isLiked: !!isLiked,
        isBookmarked: !!isBookmarked,
        comments,
    };

    return augmentedPost; // Just return data
};

export const getBookmarkedPosts = async (userId) => {
    try {
        const bookmarks = await Bookmark.find({ userId }).select('postId -_id');
        const postIds = bookmarks.map(b => b.postId);
        const posts = await Post.find({
            _id: { $in: postIds },
            postStatus: 'approved',
            deletedAt: null
        })
        .populate('userId', 'name department email')
        .sort({ createdAt: -1 });

        return posts; // Just return data
    } catch (error) {
        throw new CustomError(error.message, STATUS.INTERNAL_SERVER_ERROR);
    }
};