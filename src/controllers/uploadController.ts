import { Response } from 'express';
import { generateSignedUrl } from '../services/fileUploadService.ts';
import { AuthenticatedRequest } from '../types/express.ts';

export const uploadProfileImage = (req: AuthenticatedRequest, res: Response): void => {
  const { signedUrl, expiresAt } = generateSignedUrl(req.file!.path, {
    expiresIn: 3600
  });

  res.json({
    success: true,
    data: {
      url: signedUrl,
      originalUrl: req.file!.path,
      expiresAt,
      filename: req.file!.originalname,
      mimeType: req.file!.mimetype,
      size: req.file!.size
    }
  });
};

export const uploadAttachment = (req: AuthenticatedRequest, res: Response): void => {
  const { signedUrl, expiresAt } = generateSignedUrl(req.file!.path, {
    expiresIn: 3600
  });

  res.json({
    success: true,
    data: {
      url: signedUrl,
      originalUrl: req.file!.path,
      expiresAt,
      filename: req.file!.originalname,
      mimeType: req.file!.mimetype,
      size: req.file!.size
    }
  });
};