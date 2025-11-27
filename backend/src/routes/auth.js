import { Router } from 'express';
const router = Router();
import { login, register, refreshToken, logout, getCurrentUser } from '../controllers/authController.js';
import { verifyJWT } from '../middleware/auth.js';

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', verifyJWT, getCurrentUser);

export default router;
