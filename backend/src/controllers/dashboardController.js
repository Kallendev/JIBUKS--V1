import { prisma } from '../lib/prisma.js';

/**
 * Get Business Dashboard Summary (Chart of Accounts Based)
 */
export async function getBusinessDashboard(req, res, next) {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(403).json({ error: 'Not part of any business' });
        }

        // 1. Get Summary Metrics (Revenue, Expenses, Net Income)
        // We'll calculate this from Journal Lines for the current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const journalLines = await prisma.journalLine.findMany({
            where: {
                journal: {
                    tenantId,
                    date: { gte: startOfMonth }
                }
            },
            include: {
                account: true
            }
        });

        let revenue = 0;
        let expenses = 0;

        journalLines.forEach(line => {
            if (line.account.type === 'INCOME') {
                // For Income, Credit increases, Debit decreases
                revenue += (Number(line.credit) - Number(line.debit));
            } else if (line.account.type === 'EXPENSE') {
                // For Expenses, Debit increases, Credit decreases
                expenses += (Number(line.debit) - Number(line.credit));
            }
        });

        // 2. Get Balances (Cash & Bank, Receivables)
        // Cash & Bank (ASSET with systemTag 'CASH' or 'BANK')
        const assetAccounts = await prisma.account.findMany({
            where: {
                tenantId,
                type: 'ASSET'
            },
            include: {
                journalLines: true
            }
        });

        let cashBankBalance = 0;
        let arBalance = 0;

        assetAccounts.forEach(acc => {
            const balance = acc.journalLines.reduce((sum, line) => {
                return sum + (Number(line.debit) - Number(line.credit));
            }, 0);

            if (acc.systemTag === 'CASH' || acc.systemTag === 'BANK' || acc.subtype === 'cash' || acc.subtype === 'bank') {
                cashBankBalance += balance;
            } else if (acc.systemTag === 'AR' || acc.subtype === 'ar') {
                arBalance += balance;
            }
        });

        // 3. Get Counts
        const unpaidInvoices = await prisma.invoice.count({
            where: { tenantId, status: 'UNPAID' }
        });
        const overdueInvoices = await prisma.invoice.count({
            where: {
                tenantId,
                status: 'UNPAID',
                dueDate: { lt: new Date() }
            }
        });
        const customersCount = await prisma.customer.count({
            where: { tenantId }
        });

        // 4. Recent Activity
        const recentJournals = await prisma.journal.findMany({
            where: { tenantId },
            orderBy: { date: 'desc' },
            take: 5,
            include: {
                lines: true
            }
        });

        const recentActivity = recentJournals.map(j => {
            const amount = j.lines.reduce((sum, l) => sum + Number(l.debit), 0);
            return {
                id: j.id.toString(),
                date: j.date.toISOString(),
                type: 'Transaction',
                description: j.description,
                amount: amount
            };
        });

        res.json({
            summary: {
                revenue,
                expenses,
                netIncome: revenue - expenses,
                cashBankBalance,
                arBalance
            },
            counts: {
                unpaidInvoices,
                overdueInvoices,
                customers: customersCount
            },
            recentActivity,
            period: {
                startDate: startOfMonth.toISOString(),
                endDate: new Date().toISOString()
            }
        });
    } catch (err) {
        next(err);
    }
}
