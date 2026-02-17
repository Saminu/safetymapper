import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

// Ensure upload directory exists
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Sub-directories
const videosDir = path.join(uploadDir, 'videos');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');

[videosDir, thumbnailsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, videosDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter - only allow video files
const videoFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/mpeg',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only video files are allowed.`));
  }
};

// Multer instance for video uploads
export const videoUpload = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: config.upload.maxVideoSizeMB * 1024 * 1024, // Convert MB to bytes
    files: 1,
  },
});

// Export directories for other modules
export { uploadDir, videosDir, thumbnailsDir };
