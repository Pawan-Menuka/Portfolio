import { Profile } from '../models/Profile.js';
import * as mediaService from './media.service.js';

const SINGLETON_ID = 'main';

// The shape GET /profile guarantees even when no document has ever been
// written — a fresh clone of this repo renders a blank About section instead
// of crashing the frontend on e.g. `profile.socials.github` being undefined.
const EMPTY_PROFILE_SHAPE = {
  name: '',
  headline: '',
  shortBio: '',
  bio: '',
  roles: [],
  location: '',
  avatar: null,
  socials: { github: '', linkedin: '', email: '', website: '' },
  availability: { available: false, text: '' },
  resume: null,
  seo: { title: '', description: '', ogImage: null },
};

function stripInternalFields({ singleton, _id, __v, ...rest }) {
  return rest;
}

function toPublicShape(doc) {
  if (!doc) return EMPTY_PROFILE_SHAPE;
  const { resume, ...rest } = stripInternalFields(doc);
  return { ...EMPTY_PROFILE_SHAPE, ...rest, resume: resume ?? null };
}

// Flattens a validated (partial) update into Mongo dot-paths so a nested
// PATCH only ever $sets the keys the caller actually sent — see B7: a naive
// `$set: { socials: { github: 'x' } }` replaces the whole `socials`
// subdocument and silently destroys its sibling keys.
//
// Arrays are assigned whole rather than recursed into — `roles: ['a']` means
// "replace the array", not "merge by index".
function flattenForSet(input, prefix = '') {
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    const path = prefix ? `${prefix}.${key}` : key;

    const isPlainObject = value !== null && typeof value === 'object' && !Array.isArray(value);
    if (isPlainObject) {
      Object.assign(out, flattenForSet(value, path));
    } else {
      out[path] = value;
    }
  }
  return out;
}

export async function getPublic() {
  const doc = await Profile.findOne({ singleton: SINGLETON_ID }).lean();
  return toPublicShape(doc);
}

export async function update(data) {
  const $set = flattenForSet(data);
  const doc = await Profile.findOneAndUpdate(
    { singleton: SINGLETON_ID },
    { $set },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
  return toPublicShape(doc);
}

// Cloudinary and MongoDB can't be updated atomically together, so this
// compensates for the failure mode where the upload succeeds but the DB
// write doesn't: the orphaned new asset is deleted and the original error is
// rethrown (not swallowed — that's the one that explains what happened).
// Deleting the *previous* resume, once the swap has definitely succeeded, is
// non-fatal cleanup — a failure there is logged, not propagated.
export async function replaceResume(buffer, fileName) {
  const uploadResult = await mediaService.uploadRaw(buffer, 'portfolio/resume');
  const newResume = {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    fileName,
    updatedAt: new Date(),
  };

  const before = await Profile.findOne({ singleton: SINGLETON_ID }).lean();
  const previousPublicId = before?.resume?.publicId;

  let doc;
  try {
    doc = await Profile.findOneAndUpdate(
      { singleton: SINGLETON_ID },
      { $set: { resume: newResume } },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
  } catch (err) {
    await mediaService.destroy(newResume.publicId).catch((cleanupErr) => {
      console.error('Failed to clean up orphaned resume upload after a DB write failure:', newResume.publicId, cleanupErr);
    });
    throw err;
  }

  if (previousPublicId && previousPublicId !== newResume.publicId) {
    mediaService.destroy(previousPublicId).catch((err) => {
      console.error('Failed to delete the previous resume asset from Cloudinary:', previousPublicId, err);
    });
  }

  return toPublicShape(doc);
}
