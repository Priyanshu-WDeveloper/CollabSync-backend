import { Router } from 'express';
import { register, login, logout, getMe, updateProfile, updatePassword, registerValidation, loginValidation } from '../controllers/index.ts';
import { authenticate, validate } from '../middleware/index.ts';

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, updatePassword);

export default router;