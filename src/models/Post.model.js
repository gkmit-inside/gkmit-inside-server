import mongoose, { Schema } from 'mongoose';

const postSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: { type: String, required: true },
        subtitle: { type: String }, 
        description: { type: String, required: true },
        mediaUrl: { type: String }, 
        tags: [{ type: String }],
        postStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            required: true,
        },
        approvedAt: { type: Date },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

postSchema.pre('remove', async function(next) {
    const post = this;
    
    try {
        await Reaction.deleteMany({ postId: post._id });
        await Bookmark.deleteMany({ postId: post._id });
        await Comment.deleteMany({ postId: post._id });
        next();
    } catch (error) {
        next(error); 
    }
});

export const Post = mongoose.model('Post', postSchema);