import cloudinary from '../config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';

const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
const RAW_MIMES = new Set(['model/gltf-binary', 'application/octet-stream']);

function streamToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

// Positive allowlist (B5): the resource_type and transform are decided by
// what the mimetype IS, not by what it isn't. Before this fix, anything not
// explicitly a 3D-model type fell through to the image branch and got
// transcoded to webp — which would silently corrupt a PDF if one were ever
// routed through this function. Resume PDFs never go through here; they use
// uploadRaw below via their own dedicated, already-validated route.
export async function upload(buffer, mimetype, folder) {
  let resourceType;
  if (IMAGE_MIMES.has(mimetype)) resourceType = 'image';
  else if (RAW_MIMES.has(mimetype)) resourceType = 'raw';
  else throw new ApiError(400, `Unsupported media type: ${mimetype}`);

  return streamToCloudinary(buffer, {
    folder,
    resource_type: resourceType,
    ...(resourceType === 'image' && { format: 'webp', quality: 'auto' }),
  });
}

// For callers that have already validated the file out-of-band (e.g. the
// resume upload's PDF signature check) and always want an untransformed raw
// asset regardless of mimetype.
export async function uploadRaw(buffer, folder) {
  return streamToCloudinary(buffer, { folder, resource_type: 'raw' });
}

// B3: Cloudinary's destroy() resolves (does not throw) with
// { result: 'not found' } when the asset isn't found under the given
// resource_type, so a plain try/catch here never actually retried — raw
// assets (3D models, etc.) were never deleted by the fallback. Inspect the
// resolved result explicitly; a genuine thrown error also still falls
// through to the raw retry.
export async function destroy(publicId) {
  let result;
  try {
    result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch {
    result = { result: 'error' };
  }

  if (result.result !== 'ok') {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  }
}
