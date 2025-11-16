import { imagekit } from '../config/imageKit.js';
import { Post } from '../models/Post.model.js';
import { STATUS } from '../constants/httpStatus.js';

/**
 * @desc    Create a new post with image upload
 * @param   {object} postData - { title, description, ... }
 * @param   {object} file - The image file from multer
 * @param   {string} userId - The ID of the user creating the post
 * @returns {object} { statusCode, data, message }
 */
export const createPost = async (postData, file, userId) => {
    if (!file) {
        return {
            statusCode: STATUS.BAD_REQUEST,
            message: 'Image file is required',
        };
    }

    try {
        const uploadResponse = await imagekit.upload({
            file: file.buffer,
            fileName: `${userId}_${Date.now()}_${file.originalname}`,
            folder: 'posts', 
        });

        const { url, fileId } = uploadResponse;
        const newPost = await Post.create({
            ...postData,
            userId,
            mediaUrl: url, 
            postStatus: 'pending', 
        });

        return {
            statusCode: STATUS.CREATED,
            data: newPost,
        };
    } catch (uploadError) {
        console.error('ImageKit upload error:', uploadError);
        return {
            statusCode: STATUS.INTERNAL_SERVER_ERROR,
            message: 'Error uploading image',
        };
    }
};