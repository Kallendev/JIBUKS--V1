import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import {
    getBusinessProfile,
    updateBusinessProfile,
    getOnboardingStatus,
    updateBusinessContact,
    updateBusinessTaxSettings,
    listBusinessStaff,
    addBusinessStaff,
    completeOnboarding
} from '../controllers/businessController.js';

const router = Router();

// All routes require authentication
router.use(verifyJWT);

router.get('/profile', getBusinessProfile);
router.put('/profile', updateBusinessProfile);
router.get('/onboarding-status', getOnboardingStatus);
router.put('/onboarding', completeOnboarding);

router.put('/contact', updateBusinessContact);
router.put('/tax-settings', updateBusinessTaxSettings);
router.get('/staff', listBusinessStaff);
router.post('/staff', addBusinessStaff);

export default router;
