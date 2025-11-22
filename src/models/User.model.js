import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    isApproved: { type: Boolean, default: false },
    department: { type: String, required: true },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.pre('remove', async function(next) {
    const user = this;

    try {
        const posts = await mongoose.model('Post').find({ userId: user._id });
        for (const post of posts) {
            await post.remove();
        }
        await mongoose.model('Reaction').deleteMany({ userId: user._id });
        await mongoose.model('Bookmark').deleteMany({ userId: user._id });
        await mongoose.model('Comment').deleteMany({ userId: user._id });
        
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
