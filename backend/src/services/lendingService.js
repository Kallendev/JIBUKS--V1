
import { prisma } from '../lib/prisma.js';
import { createJournalEntry } from './accountingService.js';

// ============================================
// LENDING MANAGER SERVICE
// ============================================

/**
 * 1. ISSUE A LOAN (Money leaves your wallet, goes to someone else)
 * Effects: 
 * - Credits Asset (e.g., M-Pesa)
 * - Debits Receivable (Account 1200 - Loans to Friends)
 */
export async function issueLoan(tenantId, userId, data) {
    const { borrowerName, amount, dueDate, paidFromAccountId, notes, phoneNumber } = data;

    // 1. Get the "Loans to Friends/Family" Account (1200)
    const receivableAccount = await prisma.account.findFirst({
        where: { tenantId, code: '1200' }
    });

    if (!receivableAccount) throw new Error("Chart of Accounts missing Code 1200. Please contact support or run system updates.");

    // 2. Create the Accounting Entry
    // Credit: M-Pesa (Cash Out)
    // Debit: Loans Receivable (Asset Increase)
    const journal = await createJournalEntry({
        tenantId,
        debitAccountId: receivableAccount.id,
        creditAccountId: paidFromAccountId, // e.g., Your M-Pesa ID
        amount: Number(amount),
        description: `Loan Issued to: ${borrowerName}`,
        date: new Date(),
        createdById: userId
    });

    // 3. Create the Lending Record
    const loan = await prisma.loan.create({
        data: {
            tenantId,
            borrowerName,
            phoneNumber,
            type: 'LENT',
            principalAmount: amount,
            balance: amount,
            issueDate: new Date(),
            dueDate: dueDate ? new Date(dueDate) : null,
            accountId: receivableAccount.id,
            status: 'ACTIVE',
            notes,
        }
    });

    // 4. Record the specific transaction on the loan
    await prisma.loanTransaction.create({
        data: {
            loanId: loan.id,
            date: new Date(),
            amount: amount,
            type: 'DISBURSEMENT',
            journalId: journal.id
        }
    });

    return loan;
}

/**
 * 2. RECORD REPAYMENT (They pay you back)
 * Effects:
 * - Debits Asset (e.g., M-Pesa receives money)
 * - Credits Receivable (Account 1200 decreases)
 */
export async function recordLoanRepayment(tenantId, userId, data) {
    const { loanId, amount, depositedToAccountId, date } = data;

    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) throw new Error("Loan not found");

    // 1. Create Accounting Entry
    // Debit: M-Pesa (Cash In)
    // Credit: Loans Receivable (Asset Decrease)
    const journal = await createJournalEntry({
        tenantId,
        debitAccountId: depositedToAccountId,
        creditAccountId: loan.accountId, // The 1200 account
        amount: Number(amount),
        description: `Loan Repayment from: ${loan.borrowerName}`,
        date: new Date(date),
        createdById: userId
    });

    // 2. Update Loan Balance
    const newBalance = Number(loan.balance) - Number(amount);

    // 3. Update Status
    let status = 'ACTIVE';
    if (newBalance <= 0) status = 'PAID';

    const updatedLoan = await prisma.loan.update({
        where: { id: loanId },
        data: {
            balance: newBalance,
            status: status
        }
    });

    // 4. Log Transaction
    await prisma.loanTransaction.create({
        data: {
            loanId,
            date: new Date(date),
            amount,
            type: 'REPAYMENT',
            journalId: journal.id
        }
    });

    return updatedLoan;
}

/**
 * 3. WRITE OFF BAD DEBT (They refused to pay)
 * Effects:
 * - Debits Expense (Bad Debt Expense)
 * - Credits Receivable (Account 1200)
 */
export async function writeOffLoan(tenantId, userId, loanId) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });

    // Find Bad Debt Expense Account (Usually 6xxx or 6650 as configured)
    const expenseAccount = await prisma.account.findFirst({
        where: {
            tenantId,
            OR: [
                { code: '6650' }, // Bad Debt Expense
                { code: '6600' }  // Fallback to Financial Fees
            ]
        },
        orderBy: { code: 'desc' } // Prioritize 6650
    });

    if (!expenseAccount) throw new Error("Bad Debt Expense account (6650) not found.");

    const journal = await createJournalEntry({
        tenantId,
        debitAccountId: expenseAccount.id,
        creditAccountId: loan.accountId,
        amount: Number(loan.balance),
        description: `Write-off Bad Debt: ${loan.borrowerName}`,
        date: new Date(),
        createdById: userId
    });

    const updatedLoan = await prisma.loan.update({
        where: { id: loanId },
        data: { balance: 0, status: 'WRITTEN_OFF' }
    });

    // Log the write-off transaction
    await prisma.loanTransaction.create({
        data: {
            loanId,
            date: new Date(),
            amount: Number(loan.balance),
            type: 'WRITE_OFF',
            journalId: journal.id
        }
    });

    return updatedLoan;
}
