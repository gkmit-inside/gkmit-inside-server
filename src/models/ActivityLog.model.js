import mongoose, { Schema } from 'mongoose';

const ActivityLogSchema = new Schema(
    {
        ownerId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User', 
            required: true,
            index: true
        },
        actorId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        postId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Post', 
            required: true 
        },
        activityType: {
            type: String,
            enum: ['POSTED', 'REACTED', 'COMMENTED'],
            required: true
        },
        relatedEntityId: { 
            type: Schema.Types.ObjectId 
        },
    },
    { timestamps: true }
);

export const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);