import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const allowedMimes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'model/gltf-binary',
  'application/octet-stream',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `File type ${file.mimetype} is not allowed`));
    }
  },
});

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Resume must be a PDF'));
    }
  },
});

// This only checks the declared mimetype. The actual bytes are verified
// against the PDF signature once the buffer is available — see
// profile.controller.js — since a client can send any Content-Type it likes.
export const uploadResume = resumeUpload.single('file');
