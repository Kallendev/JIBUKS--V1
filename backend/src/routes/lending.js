
import express from 'express';
import { verifyJWT } from '../middleware/auth.js';
import * as lendingService from '../services/lendingService.js';
import { prisma } from '../lib/prisma.js';
import { seedFamilyCoA } from '../services/accountingService.js';

const router = express.Router();

router.use(verifyJWT);

// ============================================
// LENDING DASHBOARD DATA
// ============================================
router.get('/dashboard', async (req, res) => {
    try {
        const { tenantId } = req.user;

        // 1. Get Summary Stats
        const loans = await prisma.loan.findMany({
            where: { tenantId },
            orderBy: { issueDate: 'desc' }
        });

        const activeLoans = loans.filter(l => l.status === 'ACTIVE');

        const summary = {
            totalOwed: activeLoans.filter(l => l.type === 'LENT').reduce((sum, l) => sum + Number(l.balance), 0),
            totalBorrowed: activeLoans.filter(l => l.type === 'BORROWED').reduce((sum, l) => sum + Number(l.balance), 0),
            activeCount: activeLoans.length,
            overdueAmount: activeLoans
                .filter(l => l.dueDate && new Date(l.dueDate) < new Date())
                .reduce((sum, l) => sum + Number(l.balance), 0)
        };

        // 2. Get Recent Transactions
        const recentActivity = await prisma.loanTransaction.findMany({
            where: { loan: { tenantId } },
            orderBy: { date: 'desc' },
            take: 5,
            include: { loan: { select: { borrowerName: true } } }
        });

        res.json({ loans, summary, recentActivity });
    } catch (error) {
        console.error('Error fetching lending dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// ============================================
// ISSUE NEW LOAN
// ============================================
router.post('/issue', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const { borrowerName, amount, dueDate, paidFromAccountId, notes, phoneNumber } = req.body;

        if (!borrowerName || !amount || !paidFromAccountId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const loan = await lendingService.issueLoan(tenantId, userId, {
            borrowerName,
            amount,
            dueDate,
            paidFromAccountId,
            notes,
            phoneNumber
        });

        res.status(201).json(loan);
    } catch (error) {
        console.error('Error issuing loan:', error);
        // Special handler for missing CoA
        if (error.message.includes("Chart of Accounts")) {
            // Try to auto-fix for the user
            try {
                console.log("Attempting to auto-seed CoA for tenant...");
                await seedFamilyCoA(tenantId);
                return res.status(409).json({ error: 'System update applied. Please try again.' });
            } catch (seedError) {
                console.error("Auto-seed failed:", seedError);
            }
        }
        res.status(500).json({ error: error.message || 'Failed to issue loan' });
    }
});

// ============================================
// RECORD REPAYMENT
// ============================================
router.post('/repay', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const { loanId, amount, depositedToAccountId, date } = req.body;

        if (!loanId || !amount || !depositedToAccountId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const updatedLoan = await lendingService.recordLoanRepayment(tenantId, userId, {
            loanId,
            amount,
            depositedToAccountId,
            date: date || new Date()
        });

        res.json(updatedLoan);
    } catch (error) {
        console.error('Error recording repayment:', error);
        res.status(500).json({ error: error.message || 'Failed to record repayment' });
    }
});

// ============================================
// WRITE OFF LOAN
// ============================================
router.post('/:id/write-off', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const { id } = req.params;

        const updatedLoan = await lendingService.writeOffLoan(tenantId, userId, id);

        res.json(updatedLoan);
    } catch (error) {
        console.error('Error writing off loan:', error);
        // Special handler for missing Bad Debt Account
        if (error.message.includes("Bad Debt")) {
            try {
                await seedFamilyCoA(tenantId);
                return res.status(409).json({ error: 'System accounts updated. Please try again.' });
            } catch (e) {
                console.error("Seed failed", e);
            }
        }
        res.status(500).json({ error: error.message || 'Failed to write off loan' });
    }
});

export default router;
