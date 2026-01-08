import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import { getFamily, updateFamily, createMember, createGoal, getGoals, createBudgets, getBudgets } from '../controllers/familyController.js';
import {
    getFamilySettings,
    updateMemberPermissions,
    updateMemberRole,
    removeMember,
    leaveFamily,
    deleteFamily,
    getMemberDetails,
    getDashboardStats,
    updateFamilyProfile
} from '../controllers/familySettingsController.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Family basic operations
router.get('/', getFamily);
router.put('/', updateFamily);
router.post('/members', upload.single('profileImage'), createMember);

// Goals
router.post('/goals', createGoal);
router.get('/goals', getGoals);

// Budgets
router.post('/budgets', createBudgets);
router.get('/budgets', getBudgets);

// Family Settings
router.get('/settings', getFamilySettings);
router.get('/dashboard', getDashboardStats);
router.put('/profile', upload.single('avatar'), updateFamilyProfile);

// Member Management
router.get('/members/:memberId', getMemberDetails);
router.put('/members/:memberId/permissions', updateMemberPermissions);
router.put('/members/:memberId/role', updateMemberRole);
router.delete('/members/:memberId', removeMember);

// Family Actions
router.delete('/leave', leaveFamily);
router.delete('/', deleteFamily);

export default router;
