import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['software', 'blockchain', 'engineering', 'creative'],
      required: true,
    },
    level: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    icon: { type: String, default: '' },
    yearsOfExperience: { type: Number, default: 0 },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

skillSchema.index({ category: 1 });

export const Skill = mongoose.model('Skill', skillSchema);
