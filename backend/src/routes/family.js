import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { getFamily, updateFamily, createMember } from '../controllers/familyController.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Protect all routes
router.use(verifyJWT);

router.get('/', getFamily);
router.put('/', updateFamily);
router.post('/members', upload.single('profileImage'), createMember);

export default router;
