import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { getBusinessDashboard } from '../controllers/dashboardController.js';

const router = Router();

// All dashboard routes require authentication
router.use(verifyJWT);

router.get('/business', getBusinessDashboard);

export default router;
