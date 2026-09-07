import { asyncHandler } from '../utils/asyncHandler.js';
import * as mediaService from '../services/media.service.js';
import { ApiError } from '../utils/ApiError.js';

export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file provided');

  const folder = req.query.folder || 'portfolio/general';
  const result = await mediaService.upload(req.file.buffer, req.file.mimetype, folder);

  res.status(201).json({
    success: true,
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    },
  });
});

// Path-param form. Kept for now (item 10) but scheduled for removal once
// nothing references it — a Cloudinary publicId containing '/' is fragile as
// a path segment. Prefer deleteMediaByQuery below.
export const deleteMedia = asyncHandler(async (req, res) => {
  const publicId = decodeURIComponent(req.params.publicId);
  await mediaService.destroy(publicId);
  res.json({ success: true, message: 'Media deleted from Cloudinary' });
});

export const deleteMediaByQuery = asyncHandler(async (req, res) => {
  await mediaService.destroy(req.query.publicId);
  res.json({ success: true, message: 'Media deleted from Cloudinary' });
});
