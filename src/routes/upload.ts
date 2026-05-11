import { Router, Response } from 'express';
import { uploadProfileImage, uploadAttachment } from '../controllers/index.ts';
import { authenticate } from '../middleware/index.ts';
import { AuthenticatedRequest } from '../types/express.ts';

const router = Router();

router.use(authenticate);

router.post('/profile', uploadProfileImage, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: { url: req.file!.path }
  });
});

router.post('/attachment', uploadAttachment, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      url: req.file!.path,
      filename: req.file!.originalname,
      mimeType: req.file!.mimetype,
      size: req.file!.size
    }
  });
});

export default router;