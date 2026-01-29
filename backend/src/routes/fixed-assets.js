import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';
import { createFixedAsset, depreciateAsset, disposeAsset } from '../services/accountingService.js';

const router = express.Router();

router.use(verifyJWT);

// ============================================
// FIXED ASSETS MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/fixed-assets
 * List all assets with optional filtering
 */
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { status } = req.query;

        const where = { tenantId };
        if (status) where.status = status;

        const assets = await prisma.fixedAsset.findMany({
            where,
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

/**
 * GET /api/fixed-assets/accounts
 * Get asset accounts for dropdown (15xx series)
 */
// Import seed function at the top if not already there, but here we can just update the route handler
router.get('/accounts', async (req, res) => {
    try {
        const { tenantId } = req.user;
        let accounts = await prisma.account.findMany({
            where: {
                tenantId,
                isActive: true,
                OR: [
                    { code: { startsWith: '15' } }, // Fixed Assets
                    { code: { startsWith: '16' } }  // Investments
                ]
            },
            orderBy: { code: 'asc' }
        });

        // ---------------------------------------------------------
        // SELF-HEALING: If no asset accounts found, try reseeding
        // ---------------------------------------------------------
        if (accounts.length === 0) {
            console.log(`[FixedAssets] No asset accounts found for tenant ${tenantId}. Triggering auto-seed...`);

            // Import dynamically to avoid circular deps or top-level issues if any
            const { seedFamilyCoA } = await import('../services/accountingService.js');
            await seedFamilyCoA(tenantId);

            // Fetch again after seeding
            accounts = await prisma.account.findMany({
                where: {
                    tenantId,
                    isActive: true,
                    OR: [
                        { code: { startsWith: '15' } }, // Fixed Assets
                        { code: { startsWith: '16' } }  // Investments
                    ]
                },
                orderBy: { code: 'asc' }
            });
        }

        res.json(accounts);
    } catch (error) {
        console.error('Error fetching asset accounts:', error);
        res.status(500).json({ error: 'Failed to fetch asset accounts' });
    }
});

/**
 * GET /api/fixed-assets/:id
 * Get single asset details
 */
router.get('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        const asset = await prisma.fixedAsset.findFirst({
            where: { id: parseInt(id), tenantId },
            include: {
                assetAccount: true,
                paidFromAccount: true,
                financeAccount: true,
                accumDepAccount: true,
                depreciationExpAcc: true,
                disposalAccount: true,
                familyOwner: { select: { name: true, avatarUrl: true } },
                depreciationEntries: {
                    orderBy: { date: 'desc' },
                    take: 10
                }
            }
        });

        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        res.json(asset);
    } catch (error) {
        console.error('Error fetching asset:', error);
        res.status(500).json({ error: 'Failed to fetch asset' });
    }
});

/**
 * POST /api/fixed-assets
 * Create new asset
 */
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

/**
 * POST /api/fixed-assets/:id/depreciate
 * Update value (Depreciation)
 */
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

/**
 * POST /api/fixed-assets/:id/dispose
 * Dispose asset (Sell/Write-off)
 */
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
