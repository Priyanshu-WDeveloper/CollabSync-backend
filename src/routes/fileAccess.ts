import { Router, Response } from 'express';
import { authenticate } from '../middleware/index.ts';
import { generateSignedUrl, validateSignedUrl, isValidFileExtension } from '../services/fileUploadService.ts';
import { ApiError } from '../utils/ApiError.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { AuthenticatedRequest } from '../types/express.ts';

const router = Router();

router.get('/validate', authenticate, catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { url } = req.query as { url?: string };

  if (!url) {
    throw new ApiError(400, 'URL parameter is required');
  }

  const validation = validateSignedUrl(url);

  if (!validation.valid) {
    throw new ApiError(403, validation.error || 'Invalid URL');
  }

  res.json({
    success: true,
    data: {
      valid: true,
      publicId: validation.publicId
    }
  });
}));

router.post('/sign', authenticate, catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { url, expiresIn = 3600 } = req.body as { url?: string; expiresIn?: number };

  if (!url) {
    throw new ApiError(400, 'URL is required');
  }

  if (!url.includes('cloudinary.com')) {
    throw new ApiError(400, 'Invalid file URL');
  }

  const { signedUrl, expiresAt } = generateSignedUrl(url, { expiresIn });

  res.json({
    success: true,
    data: {
      url: signedUrl,
      expiresAt,
      expiresIn
    }
  });
}));

router.get('/proxy', authenticate, catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { url } = req.query as { url?: string };

  if (!url) {
    throw new ApiError(400, 'URL parameter is required');
  }

  const validation = validateSignedUrl(url);

  if (!validation.valid) {
    throw new ApiError(403, validation.error || 'Invalid URL');
  }

  const publicId = validation.publicId!;
  const filename = publicId.split('/').pop() || '';

  if (!isValidFileExtension(filename)) {
    throw new ApiError(403, 'File type not allowed');
  }

  const cleanUrl = url.split('?')[0];

  res.json({
    success: true,
    data: {
      url: cleanUrl,
      publicId,
      validated: true
    }
  });
}));

export default router;
