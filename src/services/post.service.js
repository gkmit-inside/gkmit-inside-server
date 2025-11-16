import { imagekit } from '../config/imagekit.js';
import { Post } from '../models/Post.model.js';
import { Comment } from '../models/Comment.model.js';
import { Reaction } from '../models/Reaction.model.js';
import { Bookmark } from '../models/Bookmark.model.js';
import { STATUS } from '../constants/httpStatus.js';

export const createPost = async (postData, file, userId) => {
    if (!file) {
        return { statusCode: STATUS.BAD_REQUEST, message: 'Image file is required' };
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
        return { statusCode: STATUS.CREATED, data: newPost };
    } catch (uploadError) {
        console.error('ImageKit upload error:', uploadError);
        return { statusCode: STATUS.INTERNAL_SERVER_ERROR, message: 'Error uploading image' };
    }
};

export const getMyPosts = async (userId) => {
    const posts = await Post.find({ userId: userId, deletedAt: null }).sort({ createdAt: -1 });
    return { statusCode: STATUS.OK, data: posts };
};

export const updatePost = async (postId, postData, userId) => {
    const post = await Post.findById(postId);
    if (!post || post.deletedAt) {
        return { statusCode: STATUS.NOT_FOUND, message: 'Post not found' };
    }
    if (post.userId.toString() !== userId) {
        return { statusCode: STATUS.FORBIDDEN, message: 'Not authorized to update this post' };
    }
    if (post.postStatus !== 'pending') {
         return { statusCode: STATUS.BAD_REQUEST, message: 'Only pending posts can be updated' };
    }
    const updatedPost = await Post.findByIdAndUpdate(
        postId,
        postData,
        { new: true, runValidators: true }
    );
    return { statusCode: STATUS.OK, data: updatedPost };
};

export const deletePost = async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post || post.deletedAt) {
        return { statusCode: STATUS.NOT_FOUND, message: 'Post not found' };
    }
    if (post.userId.toString() !== userId) {
        return { statusCode: STATUS.FORBIDDEN, message: 'Not authorized to delete this post' };
    }
    post.deletedAt = Date.now();
    await post.save();
    return { statusCode: STATUS.OK, message: 'Post deleted successfully' };
};

export const addComment = async (postId, content, userId) => {
    const post = await Post.findById(postId);
    if (!post || post.deletedAt) {
        return { statusCode: STATUS.NOT_FOUND, message: 'Post not found' };
    }
    const newComment = await Comment.create({ postId, userId, content });
    return { statusCode: STATUS.CREATED, data: newComment, message: 'Comment added successfully' };
};

export const toggleReaction = async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post || post.deletedAt) {
        return { statusCode: STATUS.NOT_FOUND, message: 'Post not found' };
    }
    const existingReaction = await Reaction.findOne({ postId, userId });
    if (existingReaction) {
        await Reaction.deleteOne({ _id: existingReaction._id });
        return { statusCode: STATUS.OK, message: 'Reaction removed successfully' };
    } else {
        await Reaction.create({ postId, userId, reactionType: 'like' });
        return { statusCode: STATUS.CREATED, message: 'Reaction added successfully' };
    }
};

export const toggleBookmark = async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post || post.deletedAt) {
        return { statusCode: STATUS.NOT_FOUND, message: 'Post not found' };
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

/**
 * @desc    Get the main feed with aggregated metrics
 * @returns {object} { statusCode, data }
 */
export const getFeed = async (currentUserId) => {
    // Stage 1: Get all approved posts and join user data
    const posts = await Post.aggregate([
        {
            $match: {
                postStatus: 'approved',
                deletedAt: null
            }
        },
        {
            $lookup: {
                from: 'users', 
                localField: 'userId',
                foreignField: '_id',
                as: 'author',
                pipeline: [{ $project: { name: 1, email: 1, department: 1, _id: 0 } }]
            }
        },
        // De-array the author (it will be an array of size 1)
        { $unwind: '$author' },
        // Join with Reactions (to get total like count)
        {
            $lookup: {
                from: 'reactions',
                localField: '_id',
                foreignField: 'postId',
                as: 'reactions',
            }
        },
        // Join with Comments (to get total comment count)
        {
            $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'postId',
                as: 'comments',
            }
        },
        // Join with Bookmarks (to check if CURRENT USER bookmarked it)
        {
            $lookup: {
                from: 'bookmarks',
                let: { postId: '$_id', userId: currentUserId },
                // Use a pipeline to check if a bookmark exists for THIS post AND THIS user
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$postId', '$$postId'] },
                                    { $eq: ['$userId', '$$userId'] }
                                ]
                            }
                        }
                    }
                ],
                as: 'isBookmarked',
            }
        },
        // Project the final structure
        {
            $project: {
                _id: 1,
                title: 1,
                subtitle: 1,
                description: 1,
                mediaUrl: 1,
                tags: 1,
                author: 1,
                createdAt: 1,
                reactionCount: { $size: '$reactions' },
                commentCount: { $size: '$comments' },
                isBookmarked: { $gt: [{ $size: '$isBookmarked' }, 0] }, 
                isLiked: {
                    $gt: [{
                        $size: {
                            $filter: {
                                input: '$reactions',
                                as: 'react',
                                cond: { $eq: ['$$react.userId', currentUserId] }
                            }
                        }
                    }, 0]
                }
            }
        },
        { $sort: { approvedAt: -1 } }
    ]);

    return { statusCode: STATUS.OK, data: posts };
};

/**
 * @desc    Get a single post with all its comments
 * @returns {object} { statusCode, data }
 */
export const getPostById = async (postId, currentUserId) => {
    const post = await Post.findById(postId)
        .where({ deletedAt: null, postStatus: 'approved' })
        .populate('userId', 'name department email')
        .lean(); 

    if (!post) {
        return { statusCode: STATUS.NOT_FOUND, message: 'Post not found' };
    }
    
    const reactionCount = await Reaction.countDocuments({ postId });
    const commentCount = await Comment.countDocuments({ postId });
    const isLiked = await Reaction.exists({ postId, userId: currentUserId });
    const isBookmarked = await Bookmark.exists({ postId, userId: currentUserId });

    const comments = await Comment.find({ postId })
        .where({ deletedAt: null })
        .populate('userId', 'name email')
        .sort({ createdAt: 1 }) 
    const augmentedPost = {
        ...post,
        author: post.userId, 
        reactionCount,
        commentCount,
        isLiked: !!isLiked,
        isBookmarked: !!isBookmarked,
        comments,
    };

    return { statusCode: STATUS.OK, data: augmentedPost };
};

/**
 * @desc    Get all posts bookmarked by the user
 * @returns {object} { statusCode, data }
 */
export const getBookmarkedPosts = async (userId) => {
    const bookmarks = await Bookmark.find({ userId }).select('postId -_id'); // Select only postId
    const postIds = bookmarks.map(b => b.postId);
    const posts = await Post.find({
        _id: { $in: postIds },
        postStatus: 'approved',
        deletedAt: null
    })
    .populate('userId', 'name department email')
    .sort({ createdAt: -1 });

    return { statusCode: STATUS.OK, data: posts };
};