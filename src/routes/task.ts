import { Router } from 'express';
import {
  createTask, getAllTasks, getTask, updateTask, deleteTask,
  updateStatus, reorder, taskCreateValidation, taskUpdateValidation
} from '../controllers/index.ts';
import { authenticate, validate } from '../middleware/index.ts';

const router = Router();

router.use(authenticate);

router.post('/workspace/:workspaceId', taskCreateValidation, validate, createTask);
router.get('/workspace/:workspaceId', getAllTasks);

router.route('/:id')
  .get(getTask)
  .put(taskUpdateValidation, validate, updateTask)
  .delete(deleteTask);

router.put('/:id/status', updateStatus);
router.put('/reorder', reorder);

export default router;