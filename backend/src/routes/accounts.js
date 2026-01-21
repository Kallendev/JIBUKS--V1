/**
 * Chart of Accounts Routes
 * CRUD operations for managing family Chart of Accounts
 * 
 * Endpoints:
 * GET    /api/accounts              - List all accounts with balances
 * GET    /api/accounts/:id          - Get single account details
 * POST   /api/accounts              - Create new account
 * PUT    /api/accounts/:id          - Update account
 * DELETE /api/accounts/:id          - Delete account (non-system only)
 * GET    /api/accounts/mapping      - Get category to account mapping
 * POST   /api/accounts/seed         - Seed default CoA (admin only)
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';
import {
    seedFamilyCoA,
    getAccountBalance,
    getAllAccountBalances,
    getAccountMapping,
    resolveAccountIds,
    FAMILY_COA_TEMPLATE,
    CATEGORY_ACCOUNT_MAP,
} from '../services/accountingService.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// ============================================
// GET /api/accounts - List all accounts
// ============================================
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        console.log('📊 GET /api/accounts - Request from tenant:', tenantId);

        if (!tenantId) {
            console.error('❌ No tenantId in request');
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const { type, includeBalances = 'true', includeInactive = 'false' } = req.query;

        // Build where clause
        const where = {
            tenantId,
            ...(type && { type }),
            ...(includeInactive !== 'true' && { isActive: true }),
        };

        console.log('🔍 Querying accounts with:', where);

        // Get accounts
        const accounts = await prisma.account.findMany({
            where,
            orderBy: { code: 'asc' },
            include: {
                parent: {
                    select: { id: true, code: true, name: true },
                },
                children: {
                    select: { id: true, code: true, name: true },
                },
            },
        });

        console.log(`✅ Found ${accounts.length} accounts for tenant ${tenantId}`);

        // Calculate balances if requested
        let accountsWithBalances = accounts;
        if (includeBalances === 'true') {
            console.log('💰 Calculating balances...');
            accountsWithBalances = await Promise.all(
                accounts.map(async (account) => {
                    const balance = await getAccountBalance(account.id);
                    return {
                        ...account,
                        balance,
                        // Convert id to string for frontend compatibility
                        id: `acct-${account.code}`,
                        _dbId: account.id,
                    };
                })
            );
            console.log('✅ Balances calculated');
        } else {
            accountsWithBalances = accounts.map(account => ({
                ...account,
                id: `acct-${account.code}`,
                _dbId: account.id,
                balance: 0,
            }));
        }

        console.log(`📤 Sending ${accountsWithBalances.length} accounts to frontend`);
        res.json(accountsWithBalances);
    } catch (error) {
        console.error('❌ Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts', details: error.message });
    }
});

// ============================================
// GET /api/accounts/types - Get account types
// ============================================
router.get('/types', async (req, res) => {
    try {
        res.json({
            types: ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'],
            descriptions: {
                ASSET: 'Resources owned by the family (cash, bank accounts, investments)',
                LIABILITY: 'Debts and obligations (loans, credit cards)',
                EQUITY: 'Net worth and retained savings',
                INCOME: 'Money coming in (salary, business revenue)',
                EXPENSE: 'Money going out (bills, purchases)',
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch account types' });
    }
});

// ============================================
// GET /api/accounts/mapping - Get category mapping
// ============================================
router.get('/mapping', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { category, type } = req.query;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        if (category && type) {
            // Get specific mapping
            const mapping = getAccountMapping(category, type);
            const accountIds = await resolveAccountIds(
                tenantId,
                mapping.debitAccountCode,
                mapping.creditAccountCode
            );

            return res.json({
                category,
                type,
                ...mapping,
                ...accountIds,
            });
        }

        // Return all mappings
        res.json({
            mappings: CATEGORY_ACCOUNT_MAP,
            template: FAMILY_COA_TEMPLATE,
        });
    } catch (error) {
        console.error('Error fetching account mapping:', error);
        res.status(500).json({ error: 'Failed to fetch account mapping' });
    }
});

// ============================================
// GET /api/accounts/:id - Get single account
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        // Support both acct-XXXX format and numeric IDs
        let accountId;
        if (id.startsWith('acct-')) {
            const code = id.replace('acct-', '');
            const account = await prisma.account.findFirst({
                where: { tenantId, code },
            });
            accountId = account?.id;
        } else {
            accountId = parseInt(id);
        }

        if (!accountId) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const account = await prisma.account.findFirst({
            where: { id: accountId, tenantId },
            include: {
                parent: { select: { id: true, code: true, name: true } },
                children: { select: { id: true, code: true, name: true } },
            },
        });

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const balance = await getAccountBalance(account.id);

        res.json({
            ...account,
            id: `acct-${account.code}`,
            _dbId: account.id,
            balance,
        });
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ error: 'Failed to fetch account' });
    }
});

// ============================================
// POST /api/accounts - Create new account
// ============================================
router.post('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const { code, name, type, description, parentId, currency = 'KES' } = req.body;

        // Validation
        if (!code || !name || !type) {
            return res.status(400).json({ error: 'Code, name, and type are required' });
        }

        const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid account type' });
        }

        // Check for duplicate code
        const existingAccount = await prisma.account.findFirst({
            where: { tenantId, code },
        });

        if (existingAccount) {
            return res.status(400).json({ error: 'Account code already exists' });
        }

        // Validate parent account if provided
        if (parentId) {
            const parentAccount = await prisma.account.findFirst({
                where: { id: parseInt(parentId), tenantId },
            });

            if (!parentAccount) {
                return res.status(400).json({ error: 'Parent account not found' });
            }

            if (parentAccount.type !== type) {
                return res.status(400).json({ error: 'Parent account must be of the same type' });
            }
        }

        const account = await prisma.account.create({
            data: {
                tenantId,
                code,
                name,
                type,
                description,
                parentId: parentId ? parseInt(parentId) : null,
                currency,
                isSystem: false,
                isActive: true,
            },
        });

        res.status(201).json({
            ...account,
            id: `acct-${account.code}`,
            _dbId: account.id,
            balance: 0,
        });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// ============================================
// PUT /api/accounts/:id - Update account
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        // Resolve account ID
        let accountId;
        if (id.startsWith('acct-')) {
            const code = id.replace('acct-', '');
            const account = await prisma.account.findFirst({
                where: { tenantId, code },
            });
            accountId = account?.id;
        } else {
            accountId = parseInt(id);
        }

        if (!accountId) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Check if account exists and belongs to tenant
        const existingAccount = await prisma.account.findFirst({
            where: { id: accountId, tenantId },
        });

        if (!existingAccount) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const { name, description, isActive, parentId } = req.body;

        // System accounts can only have name/description updated
        const updateData = {
            ...(name && { name }),
            ...(description !== undefined && { description }),
        };

        // Non-system accounts can also update isActive and parent
        if (!existingAccount.isSystem) {
            if (isActive !== undefined) {
                updateData.isActive = isActive;
            }
            if (parentId !== undefined) {
                updateData.parentId = parentId ? parseInt(parentId) : null;
            }
        }

        const account = await prisma.account.update({
            where: { id: accountId },
            data: updateData,
        });

        const balance = await getAccountBalance(account.id);

        res.json({
            ...account,
            id: `acct-${account.code}`,
            _dbId: account.id,
            balance,
        });
    } catch (error) {
        console.error('Error updating account:', error);
        res.status(500).json({ error: 'Failed to update account' });
    }
});

// ============================================
// DELETE /api/accounts/:id - Delete account
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        // Resolve account ID
        let accountId;
        if (id.startsWith('acct-')) {
            const code = id.replace('acct-', '');
            const account = await prisma.account.findFirst({
                where: { tenantId, code },
            });
            accountId = account?.id;
        } else {
            accountId = parseInt(id);
        }

        if (!accountId) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Check if account exists
        const account = await prisma.account.findFirst({
            where: { id: accountId, tenantId },
        });

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // Cannot delete system accounts
        if (account.isSystem) {
            return res.status(400).json({ error: 'Cannot delete system accounts' });
        }

        // Check if account has any journal lines
        const journalLineCount = await prisma.journalLine.count({
            where: { accountId },
        });

        if (journalLineCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete account with existing transactions. Deactivate it instead.',
            });
        }

        // Check for child accounts
        const childCount = await prisma.account.count({
            where: { parentId: accountId },
        });

        if (childCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete account with child accounts',
            });
        }

        await prisma.account.delete({
            where: { id: accountId },
        });

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// ============================================
// POST /api/accounts/seed - Seed default CoA
// ============================================
router.post('/seed', async (req, res) => {
    try {
        const { tenantId, role } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        // Only owners can seed accounts
        if (role !== 'OWNER' && role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only owners or admins can seed accounts' });
        }

        const { force = false } = req.body;

        // Check existing accounts
        const existingCount = await prisma.account.count({
            where: { tenantId },
        });

        if (existingCount > 0 && !force) {
            return res.status(400).json({
                error: 'Accounts already exist. Use force=true to reseed.',
                existingCount,
            });
        }

        // If force, delete all existing accounts (careful!)
        if (force && existingCount > 0) {
            // Check for journal lines first
            const journalLineCount = await prisma.journalLine.count({
                where: {
                    account: { tenantId },
                },
            });

            if (journalLineCount > 0) {
                return res.status(400).json({
                    error: 'Cannot reseed accounts with existing transactions',
                });
            }

            await prisma.account.deleteMany({
                where: { tenantId },
            });
        }

        // Seed accounts
        const count = await seedFamilyCoA(tenantId);

        res.json({
            message: 'Chart of Accounts seeded successfully',
            accountsCreated: count,
        });
    } catch (error) {
        console.error('Error seeding accounts:', error);
        res.status(500).json({ error: 'Failed to seed accounts' });
    }
});

// ============================================
// GET /api/accounts/balances/summary - Get balances summary
// ============================================
router.get('/balances/summary', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const allBalances = await getAllAccountBalances(tenantId);

        // Group by type
        const summary = {
            assets: { accounts: [], total: 0 },
            liabilities: { accounts: [], total: 0 },
            equity: { accounts: [], total: 0 },
            income: { accounts: [], total: 0 },
            expenses: { accounts: [], total: 0 },
        };

        for (const account of allBalances) {
            const key = account.type.toLowerCase() + 's'; // assets, liabilities, etc.
            if (key === 'equitys') {
                summary.equity.accounts.push(account);
                summary.equity.total += account.balance;
            } else if (summary[key]) {
                summary[key].accounts.push(account);
                summary[key].total += account.balance;
            }
        }

        // Calculate net worth
        const netWorth = summary.assets.total - summary.liabilities.total;

        res.json({
            ...summary,
            netWorth,
            totalAccounts: allBalances.length,
        });
    } catch (error) {
        console.error('Error fetching balance summary:', error);
        res.status(500).json({ error: 'Failed to fetch balance summary' });
    }
});

export default router;
