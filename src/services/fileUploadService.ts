import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// CloudinaryStorage params - cast to any to bypass strict typing
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: {
    folder: 'collabsync',
    resource_type: 'auto'
  } as any
});

const FILE_SIGNING_SECRET = process.env.FILE_SIGNING_SECRET || process.env.JWT_SECRET || 'file-signing-secret';
const DEFAULT_EXPIRY_SECONDS = 3600;

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp',
  'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'zip'
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip'
]);

export interface SignedUrlResult {
  signedUrl: string;
  expiresAt: number;
  signature: string;
}

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  publicId?: string;
}

export const generateSignedUrl = (cloudinaryUrl: string, options: { expiresIn?: number } = {}): SignedUrlResult => {
  const expiresIn = options.expiresIn || DEFAULT_EXPIRY_SECONDS;
  const expiresAt = Date.now() + (expiresIn * 1000);
  const publicId = extractPublicId(cloudinaryUrl);

  const signaturePayload = `${publicId}:${expiresAt}:${FILE_SIGNING_SECRET}`;
  const signature = crypto
    .createHmac('sha256', FILE_SIGNING_SECRET)
    .update(signaturePayload)
    .digest('hex');

  return {
    signedUrl: `${cloudinaryUrl}?expires=${expiresAt}&signature=${signature}`,
    expiresAt,
    signature
  };
};

export const validateSignedUrl = (url: string): UrlValidationResult => {
  try {
    const urlObj = new URL(url);
    const expires = urlObj.searchParams.get('expires');
    const signature = urlObj.searchParams.get('signature');

    if (!expires || !signature) {
      return { valid: false, error: 'Missing signature parameters' };
    }

    const expiresAt = parseInt(expires, 10);

    if (Date.now() > expiresAt) {
      return { valid: false, error: 'URL has expired' };
    }

    const publicId = extractPublicId(url);

    const signaturePayload = `${publicId}:${expiresAt}:${FILE_SIGNING_SECRET}`;
    const expectedSignature = crypto
      .createHmac('sha256', FILE_SIGNING_SECRET)
      .update(signaturePayload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true, publicId };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};

export const isValidFileExtension = (filename: string): boolean => {
  const ext = path.extname(filename).toLowerCase().slice(1);
  return ALLOWED_EXTENSIONS.has(ext);
};

export const isValidMimeType = (mimeType: string): boolean => {
  return ALLOWED_MIME_TYPES.has(mimeType);
};

const extractPublicId = (url: string): string => {
  const baseUrl = url.split('?')[0];
  const match = baseUrl.match(/\/upload\/(.+)$/);
  if (match) {
    return match[1];
  }
  return path.basename(baseUrl);
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('File type not allowed'));
  }
});

export const uploadProfileImage = upload.single('image');
export const uploadAttachment = upload.single('file');

export { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, FILE_SIGNING_SECRET, DEFAULT_EXPIRY_SECONDS };

export default { upload, uploadProfileImage, uploadAttachment, generateSignedUrl, validateSignedUrl };
