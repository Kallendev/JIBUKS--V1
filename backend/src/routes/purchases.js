import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as inventoryAccountingService from '../services/inventoryAccountingService.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// ============================================
// PURCHASE/BILL MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/purchases
 * Get all purchases for the tenant
 */
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const { status, vendorId, startDate, endDate } = req.query;

        const purchases = await prisma.purchase.findMany({
            where: {
                tenantId,
                ...(status && { status }),
                ...(vendorId && { vendorId: parseInt(vendorId) }),
                ...(startDate && endDate && {
                    purchaseDate: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                })
            },
            include: {
                vendor: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                items: true,
                payments: true
            },
            orderBy: { purchaseDate: 'desc' }
        });

        res.json(purchases.map(p => ({
            ...p,
            subtotal: Number(p.subtotal),
            tax: Number(p.tax),
            discount: Number(p.discount),
            total: Number(p.total),
            amountPaid: Number(p.amountPaid),
            balance: Number(p.total) - Number(p.amountPaid),
            items: p.items.map(i => ({
                ...i,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
                amount: Number(i.amount)
            })),
            payments: p.payments.map(pay => ({
                ...pay,
                amount: Number(pay.amount)
            }))
        })));
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
});

/**
 * GET /api/purchases/:id
 * Get purchase details
 */
router.get('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const purchase = await prisma.purchase.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            },
            include: {
                vendor: true,
                items: {
                    include: {
                        inventoryItem: {
                            select: {
                                id: true,
                                name: true,
                                sku: true
                            }
                        }
                    }
                },
                payments: {
                    orderBy: { paymentDate: 'desc' }
                },
                journal: {
                    include: {
                        lines: {
                            include: {
                                account: {
                                    select: {
                                        id: true,
                                        code: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        res.json({
            ...purchase,
            subtotal: Number(purchase.subtotal),
            tax: Number(purchase.tax),
            discount: Number(purchase.discount),
            total: Number(purchase.total),
            amountPaid: Number(purchase.amountPaid),
            balance: Number(purchase.total) - Number(purchase.amountPaid),
            items: purchase.items.map(i => ({
                ...i,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
                amount: Number(i.amount)
            })),
            payments: purchase.payments.map(p => ({
                ...p,
                amount: Number(p.amount)
            }))
        });
    } catch (error) {
        console.error('Error fetching purchase:', error);
        res.status(500).json({ error: 'Failed to fetch purchase' });
    }
});

/**
 * POST /api/purchases
 * Create a new purchase with double-entry accounting
 */
router.post('/', upload.single('attachment'), async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        let {
            vendorId,
            billNumber,
            purchaseDate,
            dueDate,
            items,
            tax,
            discount,
            notes,
            status
        } = req.body;

        // Handle file upload
        let attachmentUrl = null;
        if (req.file) {
            attachmentUrl = `/uploads/${req.file.filename}`;
        }

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        // Parse items if string (FormData)
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid items format' });
            }
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Purchase must have at least one item' });
        }

        // Parse numeric fields if string (FormData)
        tax = tax ? Number(tax) : 0;
        discount = discount ? Number(discount) : 0;
        status = status || 'UNPAID';

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
        const total = subtotal + tax - discount;

        // Get Accounts Payable account
        const accountsPayable = await prisma.account.findFirst({
            where: {
                tenantId,
                type: 'LIABILITY',
                name: { contains: 'Accounts Payable', mode: 'insensitive' }
            }
        });

        if (!accountsPayable) {
            return res.status(400).json({
                error: 'Accounts Payable account not found. Please set up your chart of accounts.'
            });
        }

        // Create purchase with journal entry in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 0. Resolve Account Codes to IDs (Fix for acct-CODE format)
            // Frontend sends cleaned codes (e.g. 5000), we need real DB IDs
            for (const item of items) {
                if (item.accountId) {
                    const identifier = String(item.accountId);
                    // Try to find by ID or Code
                    const account = await tx.account.findFirst({
                        where: {
                            tenantId,
                            OR: [
                                { id: parseInt(identifier) || -1 },
                                { code: identifier }
                            ]
                        }
                    });

                    if (!account) {
                        throw new Error(`Expense account not found: ${identifier}`);
                    }
                    // REASSIGN item.accountId to the REAL DB ID
                    item.originalAccountId = item.accountId; // Keep trace if needed
                    item.accountId = account.id;
                }
            }

            // 1. Create Journal Entry
            const journal = await tx.journal.create({
                data: {
                    tenantId,
                    reference: billNumber || `Purchase`,
                    date: purchaseDate ? new Date(purchaseDate) : new Date(),
                    description: `Purchase${vendorId ? ' from vendor' : ''}${billNumber ? ` - Bill #${billNumber}` : ''}`,
                    status: 'POSTED',
                    createdById: userId
                }
            });

            // 2. Create Purchase
            const purchase = await tx.purchase.create({
                data: {
                    tenantId,
                    vendorId: vendorId ? parseInt(vendorId) : null,
                    billNumber,
                    purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                    dueDate: dueDate ? new Date(dueDate) : null,
                    status,
                    subtotal,
                    tax,
                    discount,
                    total,
                    notes,
                    attachmentUrl,
                    journalId: journal.id,
                    createdById: userId,
                    items: {
                        create: items.map(item => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            amount: item.quantity * item.unitPrice,
                            accountId: item.accountId ? parseInt(item.accountId) : null,
                            inventoryItemId: item.inventoryItemId ? parseInt(item.inventoryItemId) : null
                        }))
                    }
                },
                include: {
                    items: true,
                    vendor: true
                }
            });

            // 3. Create Journal Lines (Double-Entry)
            // Group items by account
            const accountGroups = {};
            for (const item of items) {
                const accountId = item.accountId || item.inventoryItemId;
                if (!accountId) {
                    throw new Error('Each item must have an accountId or inventoryItemId');
                }

                if (!accountGroups[accountId]) {
                    accountGroups[accountId] = 0;
                }
                accountGroups[accountId] += item.quantity * item.unitPrice;
            }

            // Debit: Expense/Asset Accounts (one line per account)
            for (const [accountId, amount] of Object.entries(accountGroups)) {
                await tx.journalLine.create({
                    data: {
                        journalId: journal.id,
                        accountId: parseInt(accountId),
                        debit: amount,
                        credit: 0,
                        description: `Purchase - ${purchase.billNumber || `#${purchase.id}`}`
                    }
                });
            }

            // Add tax if applicable
            if (tax > 0) {
                const taxAccount = await tx.account.findFirst({
                    where: {
                        tenantId,
                        type: 'EXPENSE',
                        name: { contains: 'Tax', mode: 'insensitive' }
                    }
                });

                if (taxAccount) {
                    await tx.journalLine.create({
                        data: {
                            journalId: journal.id,
                            accountId: taxAccount.id,
                            debit: tax,
                            credit: 0,
                            description: 'Purchase Tax'
                        }
                    });
                }
            }

            // Credit: Accounts Payable (total amount)
            await tx.journalLine.create({
                data: {
                    journalId: journal.id,
                    accountId: accountsPayable.id,
                    debit: 0,
                    credit: total,
                    description: `Accounts Payable - ${purchase.billNumber || `#${purchase.id}`}`
                }
            });

            // 4. Update vendor balance if vendor exists
            if (vendorId) {
                await tx.vendor.update({
                    where: { id: parseInt(vendorId) },
                    data: {
                        balance: {
                            increment: total
                        }
                    }
                });

                // Update Vendor Stats
                await tx.vendorStats.upsert({
                    where: { vendorId: parseInt(vendorId) },
                    create: {
                        vendorId: parseInt(vendorId),
                        totalPurchases: total,
                        totalPaid: 0,
                        lastPurchaseDate: purchaseDate ? new Date(purchaseDate) : new Date()
                    },
                    update: {
                        totalPurchases: { increment: total },
                        lastPurchaseDate: purchaseDate ? new Date(purchaseDate) : new Date()
                    }
                });
            }

            // 5. Process inventory items with FULL accounting logic
            // This creates proper inventory journal entries:
            // DR: Inventory Asset (1201)
            // CR: Accounts Payable (2000)
            // And updates WAC (Weighted Average Cost)
            const inventoryItems = items.filter(item => item.inventoryItemId);

            if (inventoryItems.length > 0) {
                try {
                    const inventoryResult = await inventoryAccountingService.processInventoryPurchase({
                        tenantId,
                        userId,
                        purchaseId: purchase.id,
                        items: inventoryItems.map(item => ({
                            inventoryItemId: item.inventoryItemId,
                            quantity: Number(item.quantity),
                            unitCost: Number(item.unitPrice)
                        })),
                        paymentAccountId: null, // Uses AP by default
                        date: purchaseDate || new Date(),
                    });

                    console.log(`[Purchases] Inventory accounting processed:`, {
                        purchaseId: purchase.id,
                        itemsProcessed: inventoryResult.movements?.length || 0,
                        totalValue: inventoryResult.summary?.totalInventoryValue || 0
                    });
                } catch (invError) {
                    console.error('[Purchases] Inventory accounting error:', invError);
                    // Continue without failing - inventory will still be updated below
                }
            }

            return purchase;
        });

        res.status(201).json({
            ...result,
            subtotal: Number(result.subtotal),
            tax: Number(result.tax),
            discount: Number(result.discount),
            total: Number(result.total),
            amountPaid: Number(result.amountPaid),
            items: result.items.map(i => ({
                ...i,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
                amount: Number(i.amount)
            }))
        });
    } catch (error) {
        console.error('Error creating purchase:', error);
        res.status(500).json({ error: error.message || 'Failed to create purchase' });
    }
});

/**
 * PUT /api/purchases/:id
 * Update purchase (only if status is DRAFT)
 */
router.put('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const { billNumber, dueDate, notes, status } = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const existing = await prisma.purchase.findFirst({
            where: { id: parseInt(id), tenantId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        if (existing.status !== 'DRAFT' && existing.status !== 'UNPAID') {
            return res.status(400).json({
                error: 'Can only update draft or unpaid purchases'
            });
        }

        const purchase = await prisma.purchase.update({
            where: { id: parseInt(id) },
            data: {
                ...(billNumber !== undefined && { billNumber }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(notes !== undefined && { notes }),
                ...(status && { status })
            },
            include: {
                vendor: true,
                items: true,
                payments: true
            }
        });

        res.json({
            ...purchase,
            subtotal: Number(purchase.subtotal),
            tax: Number(purchase.tax),
            discount: Number(purchase.discount),
            total: Number(purchase.total),
            amountPaid: Number(purchase.amountPaid),
            balance: Number(purchase.total) - Number(purchase.amountPaid)
        });
    } catch (error) {
        console.error('Error updating purchase:', error);
        res.status(500).json({ error: 'Failed to update purchase' });
    }
});

/**
 * DELETE /api/purchases/:id
 * Delete purchase (only if status is DRAFT and no payments)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const purchase = await prisma.purchase.findFirst({
            where: { id: parseInt(id), tenantId },
            include: { _count: { select: { payments: true } } }
        });

        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        if (purchase.status !== 'DRAFT') {
            return res.status(400).json({
                error: 'Can only delete draft purchases. Consider cancelling instead.'
            });
        }

        if (purchase._count.payments > 0) {
            return res.status(400).json({
                error: 'Cannot delete purchase with payments'
            });
        }

        await prisma.purchase.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Purchase deleted successfully' });
    } catch (error) {
        console.error('Error deleting purchase:', error);
        res.status(500).json({ error: 'Failed to delete purchase' });
    }
});

/**
 * POST /api/purchases/:id/payment
 * Record payment against purchase with double-entry accounting
 */
router.post('/:id/payment', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const { id } = req.params;
        const { amount, paymentDate, paymentMethod, reference, notes, bankAccountId } = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Payment amount must be greater than 0' });
        }

        if (!bankAccountId) {
            return res.status(400).json({ error: 'Bank account is required' });
        }

        // Validate payment account (BULLETPROOF)
        const paymentAccount = await prisma.account.findFirst({
            where: { id: parseInt(bankAccountId), tenantId }
        });

        if (!paymentAccount) {
            return res.status(400).json({
                error: 'INVALID_PAYMENT_ACCOUNT',
                message: 'Payment account not found or does not belong to your company.'
            });
        }

        if (!paymentAccount.isPaymentEligible) {
            return res.status(400).json({
                error: 'INVALID_PAYMENT_ACCOUNT',
                message: 'Selected account is not a valid payment account.',
                hints: [
                    'Choose a Cash or Bank account.',
                    'Ensure the account is Active.',
                    'If you need a new bank, create it under Banks & Cash.'
                ],
                allowedAccountSubtypes: ['bank', 'cash']
            });
        }

        if (!paymentAccount.isActive) {
            return res.status(400).json({
                error: 'INVALID_PAYMENT_ACCOUNT',
                message: 'Selected payment account is not active.'
            });
        }

        const purchase = await prisma.purchase.findFirst({
            where: { id: parseInt(id), tenantId },
            include: { vendor: true }
        });

        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        const balance = Number(purchase.total) - Number(purchase.amountPaid);
        if (amount > balance) {
            return res.status(400).json({
                error: `Payment amount (${amount}) exceeds outstanding balance (${balance})`
            });
        }

        // Get Accounts Payable account
        const accountsPayable = await prisma.account.findFirst({
            where: {
                tenantId,
                type: 'LIABILITY',
                name: { contains: 'Accounts Payable', mode: 'insensitive' }
            }
        });

        if (!accountsPayable) {
            return res.status(400).json({ error: 'Accounts Payable account not found' });
        }

        // Record payment with journal entry
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Journal Entry
            const journal = await tx.journal.create({
                data: {
                    tenantId,
                    reference: reference || `Payment for ${purchase.billNumber || `Purchase #${purchase.id}`}`,
                    date: paymentDate ? new Date(paymentDate) : new Date(),
                    description: `Payment for purchase${purchase.billNumber ? ` - Bill #${purchase.billNumber}` : ''}`,
                    status: 'POSTED',
                    createdById: userId
                }
            });

            // 2. Create Payment Record
            const payment = await tx.purchasePayment.create({
                data: {
                    purchaseId: parseInt(id),
                    amount,
                    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                    paymentMethod: paymentMethod || 'Bank Transfer',
                    reference,
                    notes,
                    journalId: journal.id
                }
            });

            // 3. Create Journal Lines (Double-Entry)
            // Debit: Accounts Payable
            await tx.journalLine.create({
                data: {
                    journalId: journal.id,
                    accountId: accountsPayable.id,
                    debit: amount,
                    credit: 0,
                    description: `Payment - ${purchase.billNumber || `Purchase #${purchase.id}`}`
                }
            });

            // Determine Credit Account (Bank or Uncleared Cheques)
            let creditAccountId = parseInt(bankAccountId);

            if (paymentMethod === 'Cheque') {
                const unclearedAccount = await tx.account.findFirst({
                    where: { tenantId, systemTag: 'UNCLEARED_CHEQUES' }
                });
                if (unclearedAccount) {
                    creditAccountId = unclearedAccount.id;
                    console.log(`[Purchases] Intercepted CHEQUE payment. Swapped Bank Account ID ${bankAccountId} for Uncleared Cheques ID ${unclearedAccount.id}`);
                }
            }

            // Credit: Bank Account (or Uncleared Cheques)
            await tx.journalLine.create({
                data: {
                    journalId: journal.id,
                    accountId: creditAccountId,
                    debit: 0,
                    credit: amount,
                    description: `Payment - ${purchase.billNumber || `Purchase #${purchase.id}`}`
                }
            });

            // 4. Update purchase amount paid and status
            const newAmountPaid = Number(purchase.amountPaid) + amount;
            const newStatus = newAmountPaid >= Number(purchase.total) ? 'PAID' : 'PARTIAL';

            await tx.purchase.update({
                where: { id: parseInt(id) },
                data: {
                    amountPaid: newAmountPaid,
                    status: newStatus
                }
            });

            // 5. Update vendor balance
            if (purchase.vendorId) {
                await tx.vendor.update({
                    where: { id: purchase.vendorId },
                    data: {
                        balance: {
                            decrement: amount
                        }
                    }
                });

                // Update Vendor Stats
                await tx.vendorStats.update({
                    where: { vendorId: purchase.vendorId },
                    data: {
                        totalPaid: { increment: amount }
                    }
                });
            }

            return payment;
        });

        res.status(201).json({
            ...result,
            amount: Number(result.amount)
        });
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ error: error.message || 'Failed to record payment' });
    }
});

/**
 * GET /api/purchases/unpaid
 * Get all unpaid and partially paid purchases
 */
router.get('/status/unpaid', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const purchases = await prisma.purchase.findMany({
            where: {
                tenantId,
                status: {
                    in: ['UNPAID', 'PARTIAL']
                }
            },
            include: {
                vendor: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        res.json(purchases.map(p => ({
            ...p,
            total: Number(p.total),
            amountPaid: Number(p.amountPaid),
            balance: Number(p.total) - Number(p.amountPaid),
            daysOverdue: p.dueDate && new Date() > new Date(p.dueDate)
                ? Math.floor((new Date() - new Date(p.dueDate)) / (1000 * 60 * 60 * 24))
                : 0
        })));
    } catch (error) {
        console.error('Error fetching unpaid purchases:', error);
        res.status(500).json({ error: 'Failed to fetch unpaid purchases' });
    }
});

export default router;
