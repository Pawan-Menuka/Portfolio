import mongoose from 'mongoose';

const certificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Certification name is required'],
      trim: true,
    },
    issuer: {
      type: String,
      required: [true, 'Issuer is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['software', 'blockchain', 'engineering', 'other'],
      default: 'software',
    },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date },
    credentialId: { type: String, trim: true },
    verifyUrl: { type: String, trim: true },
    badgeImage: {
      url: String,
      publicId: String,
    },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

certificationSchema.index({ category: 1 });
certificationSchema.index({ featured: 1 });

export const Certification = mongoose.model('Certification', certificationSchema);
