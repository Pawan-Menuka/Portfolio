import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: 'No subject',
    },
    body: {
      type: String,
      required: [true, 'Message body is required'],
      maxlength: [3000, 'Message too long'],
    },
    read: { type: Boolean, default: false },
    honeypot: { type: String, select: false },
  },
  { timestamps: true }
);

messageSchema.index({ read: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
