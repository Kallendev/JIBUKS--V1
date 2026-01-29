import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';
import { createFixedAsset, depreciateAsset, disposeAsset } from '../services/accountingService.js';

const router = express.Router();

router.use(verifyJWT);

// GET /api/assets - List all assets
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const assets = await prisma.fixedAsset.findMany({
            where: { tenantId },
            orderBy: { purchaseDate: 'desc' },
            include: {
                assetAccount: true,
                familyOwner: { select: { name: true, avatarUrl: true } }
            }
        });
        res.json(assets);
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
});

// GET /api/assets/accounts - Get asset accounts for dropdown
router.get('/accounts', async (req, res) => {
    try {
        const { tenantId } = req.user;
        // Fetch accounts starting with 15xx (Fixed Assets)
        const accounts = await prisma.account.findMany({
            where: {
                tenantId,
                code: { startsWith: '15' },
                isActive: true
            },
            orderBy: { code: 'asc' }
        });
        res.json(accounts);
    } catch (error) {
        console.error('Error fetching asset accounts:', error);
        res.status(500).json({ error: 'Failed to fetch asset accounts' });
    }
});

// POST /api/assets - Create new asset
router.post('/', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const asset = await createFixedAsset(tenantId, userId, req.body);
        res.status(201).json(asset);
    } catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({ error: error.message || 'Failed to create asset' });
    }
});

// POST /api/assets/:id/depreciate - Update value (Depreciation)
router.post('/:id/depreciate', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const { id } = req.params;
        const { newValue } = req.body;

        const asset = await depreciateAsset(tenantId, userId, parseInt(id), newValue);
        res.json(asset);
    } catch (error) {
        console.error('Error deprecating asset:', error);
        res.status(500).json({ error: error.message || 'Failed to depreciate asset' });
    }
});

// POST /api/assets/:id/dispose - Dispose asset
router.post('/:id/dispose', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const { id } = req.params;

        const asset = await disposeAsset(tenantId, userId, parseInt(id), req.body);
        res.json(asset);
    } catch (error) {
        console.error('Error disposing asset:', error);
        res.status(500).json({ error: error.message || 'Failed to dispose asset' });
    }
});

export default router;
