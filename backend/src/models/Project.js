import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
}, { _id: false });

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['software', 'blockchain', 'cnc'],
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
      maxlength: [300, 'Summary cannot exceed 300 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    tags: [{ type: String, trim: true }],
    coverImage: imageSchema,
    gallery: [imageSchema],
    models3d: [imageSchema],
    links: {
      github: { type: String, default: '' },
      live: { type: String, default: '' },
      demo: { type: String, default: '' },
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ featured: 1, status: 1 });

projectSchema.pre('validate', function () {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

projectSchema.pre('save', function () {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

export const Project = mongoose.model('Project', projectSchema);
