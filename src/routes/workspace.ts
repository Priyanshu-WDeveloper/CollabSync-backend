import { Router } from 'express';
import {
  createWorkspace, getAllWorkspaces, getWorkspace,
  updateWorkspace, deleteWorkspace,
  generateInvite, joinViaInvite, removeMember, updateMemberRole,
  workspaceCreateValidation, workspaceUpdateValidation
} from '../controllers/index.ts';
import { authenticate, validate } from '../middleware/index.ts';

const router = Router();

router.use(authenticate);

router.route('/')
  .post(workspaceCreateValidation, validate, createWorkspace)
  .get(getAllWorkspaces);

router.get('/list', getAllWorkspaces);

router.route('/:id')
  .get(getWorkspace)
  .put(workspaceUpdateValidation, validate, updateWorkspace)
  .delete(deleteWorkspace);

router.post('/:id/invite', generateInvite);
router.post('/join', joinViaInvite);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/members/:userId', updateMemberRole);

export default router;