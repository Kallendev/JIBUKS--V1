import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// ============================================
// FIXED ASSETS MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/fixed-assets
 * Get all fixed assets
 */
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const { active } = req.query;

        const assets = await prisma.fixedAsset.findMany({
            where: {
                tenantId,
                ...(active !== undefined && { isActive: active === 'true' })
            },
            include: {
                _count: {
                    select: { depreciationEntries: true }
                }
            },
            orderBy: { purchaseDate: 'desc' }
        });

        res.json(assets.map(asset => ({
            ...asset,
            purchasePrice: Number(asset.purchasePrice),
            salvageValue: Number(asset.salvageValue),
            accumulatedDepreciation: Number(asset.accumulatedDepreciation),
            currentValue: Number(asset.currentValue),
            depreciableAmount: Number(asset.purchasePrice) - Number(asset.salvageValue),
            monthlyDepreciation: asset.usefulLife > 0
                ? (Number(asset.purchasePrice) - Number(asset.salvageValue)) / asset.usefulLife
                : 0
        })));
    } catch (error) {
        console.error('Error fetching fixed assets:', error);
        res.status(500).json({ error: 'Failed to fetch fixed assets' });
    }
});

/**
 * GET /api/fixed-assets/:id
 * Get fixed asset details with depreciation history
 */
router.get('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const asset = await prisma.fixedAsset.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            },
            include: {
                depreciationEntries: {
                    orderBy: { period: 'desc' }
                }
            }
        });

        if (!asset) {
            return res.status(404).json({ error: 'Fixed asset not found' });
        }

        res.json({
            ...asset,
            purchasePrice: Number(asset.purchasePrice),
            salvageValue: Number(asset.salvageValue),
            accumulatedDepreciation: Number(asset.accumulatedDepreciation),
            currentValue: Number(asset.currentValue),
            depreciationEntries: asset.depreciationEntries.map(e => ({
                ...e,
                amount: Number(e.amount)
            }))
        });
    } catch (error) {
        console.error('Error fetching fixed asset:', error);
        res.status(500).json({ error: 'Failed to fetch fixed asset' });
    }
});

/**
 * POST /api/fixed-assets
 * Create new fixed asset
 */
router.post('/', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const {
            name,
            description,
            assetNumber,
            purchaseDate,
            purchasePrice,
            salvageValue = 0,
            usefulLife, // in months
            depreciationMethod = 'STRAIGHT_LINE',
            assetAccountId,
            depreciationAccountId
        } = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        if (!name || !purchaseDate || !purchasePrice || !usefulLife || !assetAccountId || !depreciationAccountId) {
            return res.status(400).json({
                error: 'Name, purchase date, purchase price, useful life, and accounts are required'
            });
        }

        if (purchasePrice <= 0) {
            return res.status(400).json({ error: 'Purchase price must be greater than 0' });
        }

        if (usefulLife <= 0) {
            return res.status(400).json({ error: 'Useful life must be greater than 0' });
        }

        const currentValue = purchasePrice; // Initially equals purchase price

        const asset = await prisma.fixedAsset.create({
            data: {
                tenantId,
                name,
                description,
                assetNumber,
                purchaseDate: new Date(purchaseDate),
                purchasePrice,
                salvageValue,
                usefulLife,
                depreciationMethod,
                assetAccountId: parseInt(assetAccountId),
                depreciationAccountId: parseInt(depreciationAccountId),
                currentValue
            }
        });

        res.status(201).json({
            ...asset,
            purchasePrice: Number(asset.purchasePrice),
            salvageValue: Number(asset.salvageValue),
            accumulatedDepreciation: Number(asset.accumulatedDepreciation),
            currentValue: Number(asset.currentValue)
        });
    } catch (error) {
        console.error('Error creating fixed asset:', error);
        res.status(500).json({ error: 'Failed to create fixed asset' });
    }
});

/**
 * PUT /api/fixed-assets/:id
 * Update fixed asset
 */
router.put('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const { name, description, assetNumber, isActive } = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const existing = await prisma.fixedAsset.findFirst({
            where: { id: parseInt(id), tenantId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Fixed asset not found' });
        }

        const asset = await prisma.fixedAsset.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(assetNumber !== undefined && { assetNumber }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json({
            ...asset,
            purchasePrice: Number(asset.purchasePrice),
            salvageValue: Number(asset.salvageValue),
            accumulatedDepreciation: Number(asset.accumulatedDepreciation),
            currentValue: Number(asset.currentValue)
        });
    } catch (error) {
        console.error('Error updating fixed asset:', error);
        res.status(500).json({ error: 'Failed to update fixed asset' });
    }
});

/**
 * POST /api/fixed-assets/depreciation
 * Calculate and record depreciation for a period
 */
router.post('/depreciation', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const { period, assetId } = req.body; // period: YYYY-MM format

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        if (!period) {
            return res.status(400).json({ error: 'Period is required (YYYY-MM format)' });
        }

        // Parse period
        const [year, month] = period.split('-').map(Number);
        const periodDate = new Date(year, month - 1, 1);

        // Get assets to depreciate
        const assets = await prisma.fixedAsset.findMany({
            where: {
                tenantId,
                isActive: true,
                purchaseDate: { lte: periodDate },
                ...(assetId && { id: parseInt(assetId) })
            }
        });

        if (assets.length === 0) {
            return res.status(400).json({ error: 'No assets found for depreciation' });
        }

        const results = [];

        // Process each asset
        for (const asset of assets) {
            // Check if depreciation already recorded for this period
            const existing = await prisma.depreciationEntry.findFirst({
                where: {
                    assetId: asset.id,
                    period: periodDate
                }
            });

            if (existing) {
                results.push({
                    assetId: asset.id,
                    assetName: asset.name,
                    status: 'SKIPPED',
                    reason: 'Depreciation already recorded for this period'
                });
                continue;
            }

            // Check if asset is fully depreciated
            if (Number(asset.accumulatedDepreciation) >= Number(asset.purchasePrice) - Number(asset.salvageValue)) {
                results.push({
                    assetId: asset.id,
                    assetName: asset.name,
                    status: 'SKIPPED',
                    reason: 'Asset is fully depreciated'
                });
                continue;
            }

            // Calculate depreciation amount
            let depreciationAmount = 0;
            const depreciableAmount = Number(asset.purchasePrice) - Number(asset.salvageValue);

            if (asset.depreciationMethod === 'STRAIGHT_LINE') {
                depreciationAmount = depreciableAmount / asset.usefulLife;
            } else if (asset.depreciationMethod === 'DECLINING_BALANCE') {
                // Double declining balance: (2 / useful life) * book value
                const rate = 2 / asset.usefulLife;
                depreciationAmount = Number(asset.currentValue) * rate;
            }

            // Ensure we don't depreciate below salvage value
            const remainingDepreciable = depreciableAmount - Number(asset.accumulatedDepreciation);
            depreciationAmount = Math.min(depreciationAmount, remainingDepreciable);

            if (depreciationAmount <= 0) {
                results.push({
                    assetId: asset.id,
                    assetName: asset.name,
                    status: 'SKIPPED',
                    reason: 'No depreciation needed'
                });
                continue;
            }

            // Record depreciation with journal entry
            try {
                const result = await prisma.$transaction(async (tx) => {
                    // 1. Create Journal Entry
                    const journal = await tx.journal.create({
                        data: {
                            tenantId,
                            reference: `Depreciation - ${asset.name}`,
                            date: periodDate,
                            description: `${period} depreciation for ${asset.name}`,
                            status: 'POSTED',
                            createdById: userId
                        }
                    });

                    // 2. Create Depreciation Entry
                    const entry = await tx.depreciationEntry.create({
                        data: {
                            assetId: asset.id,
                            period: periodDate,
                            amount: depreciationAmount,
                            journalId: journal.id
                        }
                    });

                    // 3. Create Journal Lines (Double-Entry)
                    // Debit: Depreciation Expense (account stored in asset.depreciationAccountId - should be 5300)
                    await tx.journalLine.create({
                        data: {
                            journalId: journal.id,
                            accountId: asset.depreciationAccountId,
                            debit: depreciationAmount,
                            credit: 0,
                            description: `Depreciation - ${asset.name}`
                        }
                    });

                    // Credit: Accumulated Depreciation (contra-asset account 1590)
                    const accDepAccount = await tx.account.findFirst({
                        where: {
                            tenantId,
                            code: '1590' // Standard Accumulated Depreciation account
                        }
                    });

                    if (!accDepAccount) {
                        throw new Error('Accumulated Depreciation account (1590) not found. Please run CoA upgrade.');
                    }

                    await tx.journalLine.create({
                        data: {
                            journalId: journal.id,
                            accountId: accDepAccount.id,
                            debit: 0,
                            credit: depreciationAmount,
                            description: `Accumulated Depreciation - ${asset.name}`
                        }
                    });

                    // 4. Update Fixed Asset
                    const newAccumulatedDep = Number(asset.accumulatedDepreciation) + depreciationAmount;
                    const newCurrentValue = Number(asset.purchasePrice) - newAccumulatedDep;

                    await tx.fixedAsset.update({
                        where: { id: asset.id },
                        data: {
                            accumulatedDepreciation: newAccumulatedDep,
                            currentValue: newCurrentValue
                        }
                    });

                    return entry;
                });

                results.push({
                    assetId: asset.id,
                    assetName: asset.name,
                    status: 'SUCCESS',
                    depreciationAmount,
                    newAccumulatedDepreciation: Number(asset.accumulatedDepreciation) + depreciationAmount,
                    newCurrentValue: Number(asset.purchasePrice) - (Number(asset.accumulatedDepreciation) + depreciationAmount)
                });
            } catch (error) {
                results.push({
                    assetId: asset.id,
                    assetName: asset.name,
                    status: 'ERROR',
                    error: error.message
                });
            }
        }

        res.json({
            period,
            totalAssets: assets.length,
            processed: results.filter(r => r.status === 'SUCCESS').length,
            skipped: results.filter(r => r.status === 'SKIPPED').length,
            errors: results.filter(r => r.status === 'ERROR').length,
            results
        });
    } catch (error) {
        console.error('Error calculating depreciation:', error);
        res.status(500).json({ error: error.message || 'Failed to calculate depreciation' });
    }
});

/**
 * GET /api/fixed-assets/:id/schedule
 * Get depreciation schedule for an asset
 */
router.get('/:id/schedule', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const asset = await prisma.fixedAsset.findFirst({
            where: { id: parseInt(id), tenantId }
        });

        if (!asset) {
            return res.status(404).json({ error: 'Fixed asset not found' });
        }

        const depreciableAmount = Number(asset.purchasePrice) - Number(asset.salvageValue);
        const monthlyDepreciation = asset.depreciationMethod === 'STRAIGHT_LINE'
            ? depreciableAmount / asset.usefulLife
            : 0; // For other methods, calculate differently

        // Generate schedule
        const schedule = [];
        let accumulatedDep = 0;
        const startDate = new Date(asset.purchaseDate);

        for (let month = 0; month < asset.usefulLife; month++) {
            const periodDate = new Date(startDate);
            periodDate.setMonth(startDate.getMonth() + month);

            let depAmount = monthlyDepreciation;

            // For declining balance
            if (asset.depreciationMethod === 'DECLINING_BALANCE') {
                const rate = 2 / asset.usefulLife;
                const bookValue = Number(asset.purchasePrice) - accumulatedDep;
                depAmount = bookValue * rate;

                // Don't go below salvage value
                if (accumulatedDep + depAmount > depreciableAmount) {
                    depAmount = depreciableAmount - accumulatedDep;
                }
            }

            accumulatedDep += depAmount;
            const bookValue = Number(asset.purchasePrice) - accumulatedDep;

            schedule.push({
                period: periodDate.toISOString().substring(0, 7), // YYYY-MM
                month: month + 1,
                depreciationAmount: depAmount,
                accumulatedDepreciation: accumulatedDep,
                bookValue: Math.max(bookValue, Number(asset.salvageValue))
            });

            // Stop if fully depreciated
            if (accumulatedDep >= depreciableAmount) {
                break;
            }
        }

        res.json({
            asset: {
                id: asset.id,
                name: asset.name,
                purchasePrice: Number(asset.purchasePrice),
                salvageValue: Number(asset.salvageValue),
                usefulLife: asset.usefulLife,
                depreciationMethod: asset.depreciationMethod
            },
            schedule
        });
    } catch (error) {
        console.error('Error generating depreciation schedule:', error);
        res.status(500).json({ error: 'Failed to generate depreciation schedule' });
    }
});

export default router;
