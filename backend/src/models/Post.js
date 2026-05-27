import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      maxlength: [400, 'Excerpt cannot exceed 400 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    coverImage: {
      url: String,
      publicId: String,
    },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    readingTime: { type: Number, default: 0 },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });

postSchema.pre('validate', function () {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

postSchema.pre('save', function () {
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

export const Post = mongoose.model('Post', postSchema);
