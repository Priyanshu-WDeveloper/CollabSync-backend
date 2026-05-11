import { Router } from 'express';
import { getAllNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/index.ts';
import { authenticate } from '../middleware/index.ts';

const router = Router();

router.use(authenticate);

router.get('/', getAllNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;