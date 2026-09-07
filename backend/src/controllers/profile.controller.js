import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import * as profileService from '../services/profile.service.js';

const PDF_SIGNATURE = '%PDF-';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getPublic();
  res.json({ success: true, data: profile });
});

export const patchProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.update(req.body);
  res.json({ success: true, data: profile });
});

export const postResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file provided');

  // multer's fileFilter only checked the declared Content-Type, which a
  // client can set to anything. This checks the actual bytes. The PDF spec
  // tolerates some leading bytes before the header in a few exporters, so a
  // legitimate rejection here should be diagnosable from this message rather
  // than a generic 400.
  const startsWithPdfSignature = req.file.buffer.subarray(0, 5).toString('latin1') === PDF_SIGNATURE;
  if (!startsWithPdfSignature) {
    console.warn(`Resume upload rejected: buffer does not start with "${PDF_SIGNATURE}".`);
    throw new ApiError(400, 'File is not a valid PDF');
  }

  const profile = await profileService.replaceResume(req.file.buffer, req.file.originalname);
  res.status(201).json({ success: true, data: profile });
});
