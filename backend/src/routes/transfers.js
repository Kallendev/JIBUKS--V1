/**
 * Transfers Routes
 * Handles money transfers between accounts (Asset to Asset)
 * 
 * Endpoints:
 * POST   /api/transfers              - Create a new transfer
 * GET    /api/transfers              - List all transfers
 * GET    /api/transfers/:id          - Get single transfer details
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';
import { createJournalEntry } from '../services/accountingService.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// ============================================
// POST /api/transfers - Create Transfer
// ============================================
router.post('/', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const {
            fromAccountId,
            toAccountId,
            amount,
            fee = 0,
            date,
            reference,
            description,
        } = req.body;

        // Validation
        if (!fromAccountId || !toAccountId) {
            return res.status(400).json({ error: 'Both source and destination accounts are required' });
        }

        if (fromAccountId === toAccountId) {
            return res.status(400).json({ error: 'Cannot transfer to the same account' });
        }

        const parsedAmount = parseFloat(amount);
        const parsedFee = parseFloat(fee);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        if (isNaN(parsedFee) || parsedFee < 0) {
            return res.status(400).json({ error: 'Fee must be a non-negative number' });
        }

        // Verify both accounts exist and belong to tenant
        const [fromAccount, toAccount] = await Promise.all([
            prisma.account.findFirst({
                where: { id: parseInt(fromAccountId), tenantId }
            }),
            prisma.account.findFirst({
                where: { id: parseInt(toAccountId), tenantId }
            }),
        ]);

        if (!fromAccount) {
            return res.status(404).json({ error: 'Source account not found' });
        }

        if (!toAccount) {
            return res.status(404).json({ error: 'Destination account not found' });
        }

        // Verify both are Asset accounts
        if (fromAccount.type !== 'ASSET' || toAccount.type !== 'ASSET') {
            return res.status(400).json({
                error: 'Transfers can only be made between Asset accounts (Bank, Cash, Mobile Money)'
            });
        }

        // Calculate account balance to check for sufficient funds
        const fromAccountBalance = await getAccountBalance(fromAccount.id);
        const totalDeduction = parsedAmount + parsedFee;

        if (totalDeduction > fromAccountBalance) {
            return res.status(400).json({
                error: 'Insufficient funds',
                details: {
                    available: fromAccountBalance,
                    required: totalDeduction,
                    shortfall: totalDeduction - fromAccountBalance,
                }
            });
        }

        // Prepare journal lines
        const journalLines = [];

        // 1. Credit the FROM account (money leaving)
        journalLines.push({
            accountId: fromAccount.id,
            debit: 0,
            credit: totalDeduction,
            description: `Transfer to ${toAccount.name}${parsedFee > 0 ? ' (incl. fee)' : ''}`,
        });

        // 2. Debit the TO account (money arriving)
        journalLines.push({
            accountId: toAccount.id,
            debit: parsedAmount,
            credit: 0,
            description: `Transfer from ${fromAccount.name}`,
        });

        // 3. If there's a fee, debit Bank Charges expense account
        if (parsedFee > 0) {
            // Find Bank Charges account (6610)
            const bankChargesAccount = await prisma.account.findFirst({
                where: { tenantId, code: '6610' }
            });

            if (bankChargesAccount) {
                journalLines.push({
                    accountId: bankChargesAccount.id,
                    debit: parsedFee,
                    credit: 0,
                    description: 'Transfer fee / Bank charges',
                });
            } else {
                console.warn('[Transfers] Bank Charges account (6610) not found. Fee not recorded as expense.');
            }
        }

        // Create the journal entry
        const journal = await createJournalEntry({
            tenantId,
            lines: journalLines,
            amount: totalDeduction,
            description: description || `Transfer: ${fromAccount.name} → ${toAccount.name}`,
            date: date ? new Date(date) : new Date(),
            createdById: userId,
        });

        // Create transfer record for tracking
        const transfer = await prisma.transfer.create({
            data: {
                tenantId,
                fromAccountId: fromAccount.id,
                toAccountId: toAccount.id,
                amount: parsedAmount,
                fee: parsedFee,
                date: date ? new Date(date) : new Date(),
                reference: reference || `TRF-${Date.now()}`,
                description: description || `Transfer from ${fromAccount.name} to ${toAccount.name}`,
                journalId: journal.id,
                createdById: userId,
            },
            include: {
                fromAccount: {
                    select: { id: true, code: true, name: true, type: true }
                },
                toAccount: {
                    select: { id: true, code: true, name: true, type: true }
                },
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        console.log(`[Transfers] Created transfer ${transfer.id} from ${fromAccount.name} to ${toAccount.name}`);

        res.status(201).json({
            ...transfer,
            amount: Number(transfer.amount),
            fee: Number(transfer.fee),
            journalReference: journal.reference,
        });

    } catch (error) {
        console.error('Error creating transfer:', error);
        res.status(500).json({ error: 'Failed to create transfer', details: error.message });
    }
});

// ============================================
// GET /api/transfers - List Transfers
// ============================================
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const { startDate, endDate, limit = 50 } = req.query;

        const where = {
            tenantId,
            ...(startDate || endDate
                ? {
                    date: {
                        ...(startDate && { gte: new Date(startDate) }),
                        ...(endDate && { lte: new Date(endDate) }),
                    },
                }
                : {}),
        };

        const transfers = await prisma.transfer.findMany({
            where,
            include: {
                fromAccount: {
                    select: { id: true, code: true, name: true, type: true }
                },
                toAccount: {
                    select: { id: true, code: true, name: true, type: true }
                },
                createdBy: {
                    select: { id: true, name: true, email: true }
                },
                journal: {
                    select: { id: true, reference: true, status: true }
                }
            },
            orderBy: { date: 'desc' },
            take: parseInt(limit),
        });

        const formattedTransfers = transfers.map(t => ({
            id: t.id,
            fromAccount: t.fromAccount,
            toAccount: t.toAccount,
            amount: Number(t.amount),
            fee: Number(t.fee),
            totalDeduction: Number(t.amount) + Number(t.fee),
            date: t.date,
            reference: t.reference,
            description: t.description,
            createdBy: t.createdBy,
            journalReference: t.journal?.reference,
            journalStatus: t.journal?.status,
        }));

        res.json(formattedTransfers);

    } catch (error) {
        console.error('Error fetching transfers:', error);
        res.status(500).json({ error: 'Failed to fetch transfers' });
    }
});

// ============================================
// GET /api/transfers/:id - Get Single Transfer
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const transfer = await prisma.transfer.findFirst({
            where: {
                id: parseInt(id),
                tenantId,
            },
            include: {
                fromAccount: {
                    select: { id: true, code: true, name: true, type: true }
                },
                toAccount: {
                    select: { id: true, code: true, name: true, type: true }
                },
                createdBy: {
                    select: { id: true, name: true, email: true }
                },
                journal: {
                    include: {
                        lines: {
                            include: {
                                account: {
                                    select: { id: true, code: true, name: true, type: true }
                                }
                            }
                        }
                    }
                }
            },
        });

        if (!transfer) {
            return res.status(404).json({ error: 'Transfer not found' });
        }

        res.json({
            ...transfer,
            amount: Number(transfer.amount),
            fee: Number(transfer.fee),
            totalDeduction: Number(transfer.amount) + Number(transfer.fee),
            journalReference: transfer.journal?.reference,
            accountingDetails: transfer.journal?.lines?.map(line => ({
                account: line.account?.name,
                code: line.account?.code,
                debit: Number(line.debit),
                credit: Number(line.credit),
                description: line.description,
            })),
        });

    } catch (error) {
        console.error('Error fetching transfer:', error);
        res.status(500).json({ error: 'Failed to fetch transfer' });
    }
});

// ============================================
// Helper: Get Account Balance
// ============================================
async function getAccountBalance(accountId) {
    const account = await prisma.account.findUnique({
        where: { id: accountId },
    });

    if (!account) {
        throw new Error('Account not found');
    }

    const totals = await prisma.journalLine.aggregate({
        where: {
            accountId,
            journal: { status: 'POSTED' },
        },
        _sum: {
            debit: true,
            credit: true,
        },
    });

    const totalDebits = Number(totals._sum.debit || 0);
    const totalCredits = Number(totals._sum.credit || 0);

    // For Asset accounts: balance = debits - credits
    if (account.type === 'ASSET') {
        return totalDebits - totalCredits;
    }

    // For other account types
    return totalCredits - totalDebits;
}

export default router;
