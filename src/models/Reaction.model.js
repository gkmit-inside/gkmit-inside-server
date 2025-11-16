import mongoose, { Schema } from 'mongoose';

const reactionSchema = new Schema(
    {
        postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reactionType: { type: String, default: 'like', required: true },
    },
    { timestamps: true }
);

reactionSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const Reaction = mongoose.model('Reaction', reactionSchema);