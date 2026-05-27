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

export const deleteMedia = asyncHandler(async (req, res) => {
  const publicId = decodeURIComponent(req.params.publicId);
  await mediaService.destroy(publicId);
  res.json({ success: true, message: 'Media deleted from Cloudinary' });
});
