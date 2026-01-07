import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { getFamily, updateFamily, createMember, createGoal, getGoals, createBudgets, getBudgets } from '../controllers/familyController.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Protect all routes
router.use(verifyJWT);

router.get('/', getFamily);
router.put('/', updateFamily);
router.post('/members', upload.single('profileImage'), createMember);
router.post('/goals', createGoal);
router.get('/goals', getGoals);
router.post('/budgets', createBudgets);
router.get('/budgets', getBudgets);

export default router;
