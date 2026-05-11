import { Router, Request, Response } from 'express';
import authRoutes from './auth.ts';
import workspaceRoutes from './workspace.ts';
import taskRoutes from './task.ts';
import messageRoutes from './message.ts';
import notificationRoutes from './notification.ts';
import uploadRoutes from './upload.ts';
import fileAccessRoutes from './fileAccess.ts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/tasks', taskRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);
router.use('/files', fileAccessRoutes);

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;