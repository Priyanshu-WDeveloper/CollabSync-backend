import { Router } from 'express';
import { getMessages, send, deleteMessage, sendValidation } from '../controllers/index.ts';
import { authenticate, validate } from '../middleware/index.ts';

const router = Router();

router.use(authenticate);

router.get('/workspace/:workspaceId', getMessages);
router.post('/workspace/:workspaceId', sendValidation, validate, send);
router.delete('/:id', deleteMessage);

export default router;