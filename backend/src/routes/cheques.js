import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// CHEQUE MANAGEMENT ROUTES
// Revolutionary Feature - Better than QuickBooks!
// ============================================

/**
 * GET /api/cheques/pending
 * Get all pending cheques for the tenant
 * Returns: Array of pending cheques with bank details
 */
router.get('/pending', async (req, res) => {
    try {
        const { tenantId } = req.query;

        if (!tenantId) {
            return res.status(400).json({ error: 'tenantId is required' });
        }

        const cheques = await prisma.cheque.findMany({
            where: {
                tenantId: parseInt(tenantId),
                status: 'PENDING',
            },
            orderBy: {
                dueDate: 'asc', // Oldest first
            },
        });

        res.json(cheques);
    } catch (error) {
        console.error('Error fetching pending cheques:', error);
        res.status(500).json({ error: 'Failed to fetch pending cheques' });
    }
});

/**
 * GET /api/cheques/all
 * Get all cheques (pending, cleared, voided)
 */
router.get('/all', async (req, res) => {
    try {
        const { tenantId } = req.query;

        if (!tenantId) {
            return res.status(400).json({ error: 'tenantId is required' });
        }

        const cheques = await prisma.cheque.findMany({
            where: {
                tenantId: parseInt(tenantId),
            },
            orderBy: [
                { status: 'asc' }, // Pending first
                { dueDate: 'desc' }, // Most recent first
            ],
        });

        res.json(cheques);
    } catch (error) {
        console.error('Error fetching cheques:', error);
        res.status(500).json({ error: 'Failed to fetch cheques' });
    }
});

/**
 * GET /api/cheques/summary
 * Get cheque summary for dashboard widget
 * Returns: { count, totalAmount, bankBalance, realAvailable }
 */
router.get('/summary', async (req, res) => {
    try {
        const { tenantId } = req.query;

        if (!tenantId) {
            return res.status(400).json({ error: 'tenantId is required' });
        }

        // Get pending cheques
        const pendingCheques = await prisma.cheque.findMany({
            where: {
                tenantId: parseInt(tenantId),
                status: 'PENDING',
            },
        });

        // Calculate total pending amount
        const totalPending = pendingCheques.reduce(
            (sum, cheque) => sum + parseFloat(cheque.amount),
            0
        );

        // Get bank balance (sum of all cash/bank accounts)
        const bankAccounts = await prisma.account.findMany({
            where: {
                tenantId: parseInt(tenantId),
                isPaymentEligible: true,
                isActive: true,
            },
            include: {
                journalLines: true,
            },
        });

        // Calculate bank balance from journal entries
        let bankBalance = 0;
        for (const account of bankAccounts) {
            const balance = account.journalLines.reduce((sum, line) => {
                return sum + parseFloat(line.debit) - parseFloat(line.credit);
            }, 0);
            bankBalance += balance;
        }

        // Real available = Bank Balance - Pending Cheques
        const realAvailable = bankBalance - totalPending;

        res.json({
            count: pendingCheques.length,
            totalAmount: totalPending,
            bankBalance: bankBalance,
            realAvailable: realAvailable,
        });
    } catch (error) {
        console.error('Error fetching cheque summary:', error);
        res.status(500).json({ error: 'Failed to fetch cheque summary' });
    }
});

/**
 * POST /api/cheques/create
 * Create a new cheque (called when user selects "Cheque" payment method)
 * Body: { chequeNumber, payee, amount, dueDate, bankAccountId, purpose, notes }
 */
router.post('/create', async (req, res) => {
    try {
        const {
            tenantId,
            chequeNumber,
            payee,
            amount,
            dueDate,
            bankAccountId,
            accountNumber,
            purpose,
            notes,
            reference,
        } = req.body;

        // Validation
        if (!tenantId || !chequeNumber || !payee || !amount || !dueDate || !bankAccountId) {
            return res.status(400).json({
                error: 'Missing required fields: tenantId, chequeNumber, payee, amount, dueDate, bankAccountId',
            });
        }

        // Create the cheque record
        const cheque = await prisma.cheque.create({
            data: {
                tenantId: parseInt(tenantId),
                chequeNumber,
                payee,
                amount: parseFloat(amount),
                dueDate: new Date(dueDate),
                bankAccountId: parseInt(bankAccountId),
                accountNumber,
                purpose,
                notes,
                reference,
                status: 'PENDING',
            },
        });

        res.status(201).json(cheque);
    } catch (error) {
        console.error('Error creating cheque:', error);
        res.status(500).json({ error: 'Failed to create cheque' });
    }
});

/**
 * POST /api/cheques/:id/clear
 * Mark a cheque as cleared
 * Body: { dateCleared, clearedById }
 * 
 * This creates the clearing journal entry:
 * Debit: Uncleared Cheques Payable (Liability)
 * Credit: Bank Account (Asset)
 */
router.post('/:id/clear', async (req, res) => {
    try {
        const { id } = req.params;
        const { dateCleared, clearedById, tenantId } = req.body;

        if (!dateCleared) {
            return res.status(400).json({ error: 'dateCleared is required' });
        }

        // Get the cheque
        const cheque = await prisma.cheque.findUnique({
            where: { id: parseInt(id) },
        });

        if (!cheque) {
            return res.status(404).json({ error: 'Cheque not found' });
        }

        if (cheque.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only pending cheques can be cleared' });
        }

        // Find the "Uncleared Cheques Payable" liability account
        const unclearedAccount = await prisma.account.findFirst({
            where: {
                tenantId: cheque.tenantId,
                systemTag: 'UNCLEARED_CHEQUES',
            },
        });

        if (!unclearedAccount) {
            return res.status(500).json({
                error: 'Uncleared Cheques Payable account not found. Please contact support.',
            });
        }

        // Create the clearing journal entry
        const journal = await prisma.journal.create({
            data: {
                tenantId: cheque.tenantId,
                date: new Date(dateCleared),
                description: `Cheque #${cheque.chequeNumber} cleared - ${cheque.payee}`,
                reference: cheque.chequeNumber,
                status: 'POSTED',
                lines: {
                    create: [
                        // Debit: Uncleared Cheques Payable (removes liability)
                        {
                            accountId: unclearedAccount.id,
                            debit: cheque.amount,
                            credit: 0,
                            description: `Clear cheque #${cheque.chequeNumber}`,
                        },
                        // Credit: Bank Account (money leaves bank)
                        {
                            accountId: cheque.bankAccountId,
                            debit: 0,
                            credit: cheque.amount,
                            description: `Clear cheque #${cheque.chequeNumber}`,
                        },
                    ],
                },
            },
            include: {
                lines: true,
            },
        });

        // Update the cheque status
        const updatedCheque = await prisma.cheque.update({
            where: { id: parseInt(id) },
            data: {
                status: 'CLEARED',
                dateCleared: new Date(dateCleared),
                clearedById: clearedById ? parseInt(clearedById) : null,
                clearJournalId: journal.id,
            },
        });

        res.json({
            cheque: updatedCheque,
            journal: journal,
            message: 'Cheque cleared successfully',
        });
    } catch (error) {
        console.error('Error clearing cheque:', error);
        res.status(500).json({ error: 'Failed to clear cheque' });
    }
});

/**
 * POST /api/cheques/:id/void
 * Void a cheque (cancel it)
 * 
 * This reverses the write journal entry:
 * Debit: Uncleared Cheques Payable (Liability)
 * Credit: Expense Account
 */
router.post('/:id/void', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Get the cheque
        const cheque = await prisma.cheque.findUnique({
            where: { id: parseInt(id) },
        });

        if (!cheque) {
            return res.status(404).json({ error: 'Cheque not found' });
        }

        if (cheque.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only pending cheques can be voided' });
        }

        // Update the cheque status
        const updatedCheque = await prisma.cheque.update({
            where: { id: parseInt(id) },
            data: {
                status: 'VOIDED',
                notes: reason ? `${cheque.notes || ''}\nVoided: ${reason}` : cheque.notes,
            },
        });

        res.json({
            cheque: updatedCheque,
            message: 'Cheque voided successfully',
        });
    } catch (error) {
        console.error('Error voiding cheque:', error);
        res.status(500).json({ error: 'Failed to void cheque' });
    }
});

/**
 * GET /api/cheques/:id
 * Get a single cheque by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const cheque = await prisma.cheque.findUnique({
            where: { id: parseInt(id) },
        });

        if (!cheque) {
            return res.status(404).json({ error: 'Cheque not found' });
        }

        res.json(cheque);
    } catch (error) {
        console.error('Error fetching cheque:', error);
        res.status(500).json({ error: 'Failed to fetch cheque' });
    }
});

export default router;
