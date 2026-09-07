import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
}, { _id: false });

const profileSchema = new mongoose.Schema(
  {
    // Enforces "only one profile document ever exists" — every read/write
    // targets { singleton: 'main' }, and the unique index makes a second
    // document impossible rather than merely unlikely.
    singleton: {
      type: String,
      default: 'main',
      unique: true,
      immutable: true,
    },

    name: { type: String, default: '', trim: true },
    headline: { type: String, default: '', trim: true },
    shortBio: { type: String, default: '' },
    bio: { type: String, default: '' }, // Markdown — rendered by the frontend

    roles: { type: [String], default: [] },
    location: { type: String, default: '', trim: true },

    avatar: { type: imageSchema, default: null },

    socials: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      email: { type: String, default: '' },
      website: { type: String, default: '' },
    },

    availability: {
      available: { type: Boolean, default: false },
      text: { type: String, default: '' },
    },

    // Set exclusively by POST /profile/resume (Phase 5) — never via the
    // general PATCH /profile route.
    resume: {
      url: String,
      publicId: String,
      fileName: String,
      updatedAt: Date,
    },

    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      ogImage: { type: imageSchema, default: null },
    },
  },
  { timestamps: true }
);

export const Profile = mongoose.model('Profile', profileSchema);
