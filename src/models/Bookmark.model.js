import mongoose, { Schema } from 'mongoose';

const bookmarkSchema = new Schema(
    {
        postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);
bookmarkSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);