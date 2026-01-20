/**
 * Accounting Service
 * Core business logic for double-entry bookkeeping
 * 
 * This service handles:
 * - Chart of Accounts (CoA) management
 * - Journal entry creation (double-entry posting)
 * - Account balance calculations
 * - Financial reports (P&L, Trial Balance, Cash Flow)
 */

import { prisma } from '../lib/prisma.js';

// ============================================
// FAMILY CHART OF ACCOUNTS TEMPLATE
// ============================================

/**
 * Enhanced Professional Chart of Accounts
 * Supports business accounting with inventory, fixed assets, VAT, and payroll
 * Following accounting best practices with proper account numbering:
 * - 1000s: Assets
 * - 2000s: Liabilities
 * - 3000s: Equity
 * - 4000s: Income/Revenue
 * - 5000s: Expenses
 */
export const FAMILY_COA_TEMPLATE = [
    // ASSETS (1000-1999)
    // Cash & Bank Accounts (1000-1099)
    { code: '1000', name: 'Cash on Hand', type: 'ASSET', description: 'Physical cash', isSystem: true, isContra: false },
    { code: '1010', name: 'Checking Account', type: 'ASSET', description: 'Bank checking account', isSystem: true, isContra: false },
    { code: '1020', name: 'Savings Account', type: 'ASSET', description: 'Bank savings account', isSystem: true, isContra: false },
    { code: '1030', name: 'M-Pesa Wallet', type: 'ASSET', description: 'Mobile money wallet', isSystem: true, isContra: false },
    { code: '1040', name: 'Airtel Money', type: 'ASSET', description: 'Airtel Money wallet', isSystem: false, isContra: false },
    { code: '1050', name: 'PayPal', type: 'ASSET', description: 'PayPal account', isSystem: false, isContra: false },
    { code: '1060', name: 'Undeposited Funds', type: 'ASSET', description: 'Cash received not yet deposited', isSystem: true, isContra: false },
    { code: '1070', name: 'Clearing Account', type: 'ASSET', description: 'Temporary clearing account', isSystem: true, isContra: false },

    // Receivables (1100-1199)
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET', description: 'Money owed by customers', isSystem: true, isContra: false },
    { code: '1110', name: 'Notes Receivable', type: 'ASSET', description: 'Promissory notes from customers', isSystem: false, isContra: false },

    // Prepayments (1200-1299)
    { code: '1200', name: 'Prepaid Expenses', type: 'ASSET', description: 'Advance payments', isSystem: false, isContra: false },
    { code: '1210', name: 'Prepaid Rent', type: 'ASSET', description: 'Rent paid in advance', isSystem: false, isContra: false },
    { code: '1220', name: 'Prepaid Insurance', type: 'ASSET', description: 'Insurance paid in advance', isSystem: false, isContra: false },

    // Inventory (1300-1399)
    { code: '1300', name: 'Inventory - Finished Goods', type: 'ASSET', description: 'Finished products ready for sale', isSystem: true, isContra: false },
    { code: '1310', name: 'Inventory - Raw Materials', type: 'ASSET', description: 'Raw materials for production', isSystem: false, isContra: false },
    { code: '1320', name: 'Inventory - Work in Progress', type: 'ASSET', description: 'Goods in production', isSystem: false, isContra: false },

    // VAT (1400-1499)
    { code: '1400', name: 'VAT Receivable (Input VAT)', type: 'ASSET', description: 'VAT paid on purchases (16%)', isSystem: true, isContra: false },

    // Fixed Assets (1500-1599)
    { code: '1500', name: 'Equipment', type: 'ASSET', description: 'Business equipment', isSystem: true, isContra: false },
    { code: '1510', name: 'Furniture & Fixtures', type: 'ASSET', description: 'Office furniture', isSystem: false, isContra: false },
    { code: '1520', name: 'Vehicles', type: 'ASSET', description: 'Company vehicles', isSystem: false, isContra: false },
    { code: '1530', name: 'Buildings', type: 'ASSET', description: 'Real estate property', isSystem: false, isContra: false },
    { code: '1590', name: 'Accumulated Depreciation', type: 'ASSET', description: 'Contra-asset for depreciation', isSystem: true, isContra: true },

    // LIABILITIES (2000-2999)
    // Current Liabilities (2000-2099)
    { code: '2000', name: 'Credit Card', type: 'LIABILITY', description: 'Credit card balances', isSystem: true, isContra: false },
    { code: '2010', name: 'Loans Payable', type: 'LIABILITY', description: 'Personal/business loans', isSystem: true, isContra: false },
    { code: '2020', name: 'Accounts Payable', type: 'LIABILITY', description: 'Money owed to suppliers', isSystem: true, isContra: false },
    { code: '2030', name: 'Mortgage', type: 'LIABILITY', description: 'Home/property loan', isSystem: false, isContra: false },

    // VAT (2500-2599)
    { code: '2500', name: 'VAT Payable (Output VAT)', type: 'LIABILITY', description: 'VAT collected on sales (16%)', isSystem: true, isContra: false },

    // Customer Deposits (2600-2699)
    { code: '2600', name: 'Customer Deposits', type: 'LIABILITY', description: 'Advance payments from customers', isSystem: true, isContra: false },
    { code: '2610', name: 'Unearned Revenue', type: 'LIABILITY', description: 'Revenue received in advance', isSystem: false, isContra: false },

    // Payroll Liabilities (2700-2799)
    { code: '2700', name: 'PAYE Payable', type: 'LIABILITY', description: 'Income tax withheld from employees', isSystem: true, isContra: false },
    { code: '2710', name: 'NSSF Payable', type: 'LIABILITY', description: 'National Social Security Fund', isSystem: true, isContra: false },
    { code: '2720', name: 'NHIF Payable', type: 'LIABILITY', description: 'National Hospital Insurance Fund', isSystem: true, isContra: false },

    // EQUITY (3000-3999)
    { code: '3000', name: 'Owner Equity', type: 'EQUITY', description: 'Owner capital / Opening balance', isSystem: true, isContra: false },
    { code: '3010', name: 'Retained Earnings', type: 'EQUITY', description: 'Accumulated profits/savings', isSystem: true, isContra: false },
    { code: '3020', name: 'Drawings', type: 'EQUITY', description: 'Owner withdrawals', isSystem: false, isContra: true },

    // INCOME (4000-4999)
    // Personal Income (4000-4099)
    { code: '4000', name: 'Salary Income', type: 'INCOME', description: 'Employment salary', isSystem: true, isContra: false },
    { code: '4010', name: 'Business Income', type: 'INCOME', description: 'Side business / freelance', isSystem: true, isContra: false },
    { code: '4020', name: 'Investment Income', type: 'INCOME', description: 'Dividends, interest', isSystem: true, isContra: false },
    { code: '4030', name: 'Gift Income', type: 'INCOME', description: 'Monetary gifts received', isSystem: true, isContra: false },
    { code: '4040', name: 'Rental Income', type: 'INCOME', description: 'Property rental income', isSystem: false, isContra: false },
    { code: '4050', name: 'Other Income', type: 'INCOME', description: 'Miscellaneous income', isSystem: true, isContra: false },

    // Sales Revenue (4100-4199)
    { code: '4100', name: 'Product Sales', type: 'INCOME', description: 'Revenue from product sales', isSystem: true, isContra: false },
    { code: '4110', name: 'Service Sales', type: 'INCOME', description: 'Revenue from service sales', isSystem: true, isContra: false },
    { code: '4120', name: 'Sales Returns', type: 'INCOME', description: 'Returns and refunds (contra-revenue)', isSystem: true, isContra: true },
    { code: '4130', name: 'Sales Discounts', type: 'INCOME', description: 'Discounts given to customers (contra-revenue)', isSystem: true, isContra: true },

    // Other Revenue (4200-4299)
    { code: '4200', name: 'Interest Income', type: 'INCOME', description: 'Interest earned on deposits', isSystem: false, isContra: false },
    { code: '4210', name: 'Late Fee Income', type: 'INCOME', description: 'Late payment fees from customers', isSystem: false, isContra: false },

    // EXPENSES (5000-5999)
    // Personal/Household Expenses (5000-5199)
    { code: '5000', name: 'Food & Groceries', type: 'EXPENSE', description: 'Food and grocery shopping', isSystem: true, isContra: false },
    { code: '5010', name: 'Transport', type: 'EXPENSE', description: 'Fuel, fares, vehicle expenses', isSystem: true, isContra: false },
    { code: '5020', name: 'Housing/Rent', type: 'EXPENSE', description: 'Rent and housing costs', isSystem: true, isContra: false },
    { code: '5030', name: 'Utilities', type: 'EXPENSE', description: 'Electricity, water, internet', isSystem: true, isContra: false },
    { code: '5040', name: 'Healthcare', type: 'EXPENSE', description: 'Medical expenses, insurance', isSystem: true, isContra: false },
    { code: '5050', name: 'Education', type: 'EXPENSE', description: 'School fees, books, courses', isSystem: true, isContra: false },
    { code: '5060', name: 'Entertainment', type: 'EXPENSE', description: 'Movies, dining out, hobbies', isSystem: true, isContra: false },
    { code: '5070', name: 'Shopping', type: 'EXPENSE', description: 'Clothing, household items', isSystem: true, isContra: false },
    { code: '5080', name: 'Communication', type: 'EXPENSE', description: 'Phone bills, airtime', isSystem: true, isContra: false },
    { code: '5090', name: 'Personal Care', type: 'EXPENSE', description: 'Beauty, grooming', isSystem: false, isContra: false },
    { code: '5100', name: 'Insurance', type: 'EXPENSE', description: 'Insurance premiums', isSystem: false, isContra: false },
    { code: '5110', name: 'Donations/Tithe', type: 'EXPENSE', description: 'Charitable giving', isSystem: false, isContra: false },
    { code: '5120', name: 'Childcare', type: 'EXPENSE', description: 'Daycare, babysitting', isSystem: false, isContra: false },
    { code: '5130', name: 'Pet Care', type: 'EXPENSE', description: 'Pet food, vet bills', isSystem: false, isContra: false },
    { code: '5140', name: 'Subscriptions', type: 'EXPENSE', description: 'Netflix, magazines, etc.', isSystem: false, isContra: false },
    { code: '5199', name: 'Other Expenses', type: 'EXPENSE', description: 'Miscellaneous expenses', isSystem: true, isContra: false },

    // Cost of Goods Sold (5200-5249)
    { code: '5200', name: 'Cost of Goods Sold', type: 'EXPENSE', description: 'Direct cost of products sold', isSystem: true, isContra: false },
    { code: '5210', name: 'Purchase Discounts', type: 'EXPENSE', description: 'Discounts received on purchases (contra-expense)', isSystem: false, isContra: true },
    { code: '5220', name: 'Freight & Shipping', type: 'EXPENSE', description: 'Freight and delivery costs', isSystem: false, isContra: false },

    // Operating Expenses (5250-5299)
    { code: '5250', name: 'Bank Charges', type: 'EXPENSE', description: 'Bank fees and charges', isSystem: true, isContra: false },
    { code: '5260', name: 'Interest Expense', type: 'EXPENSE', description: 'Interest on loans and credit', isSystem: true, isContra: false },

    // Depreciation (5300-5399)
    { code: '5300', name: 'Depreciation Expense', type: 'EXPENSE', description: 'Fixed asset depreciation', isSystem: true, isContra: false },

    // Payroll Expenses (5400-5499)
    { code: '5400', name: 'Salaries & Wages', type: 'EXPENSE', description: 'Employee salaries', isSystem: true, isContra: false },
    { code: '5410', name: 'Payroll Tax', type: 'EXPENSE', description: 'Employer payroll taxes', isSystem: false, isContra: false },
    { code: '5420', name: 'Employee Benefits', type: 'EXPENSE', description: 'Health insurance, retirement', isSystem: false, isContra: false },
];

// ============================================
// CATEGORY TO ACCOUNT MAPPING
// ============================================

/**
 * Maps frontend category names to account codes
 * This allows transactions to be recorded with user-friendly category names
 * while automatically posting to the correct accounting accounts
 */
export const CATEGORY_ACCOUNT_MAP = {
    // Income Categories
    'Salary': { incomeAccount: '4000', defaultAssetAccount: '1010' },
    'Business': { incomeAccount: '4010', defaultAssetAccount: '1010' },
    'Investment': { incomeAccount: '4020', defaultAssetAccount: '1010' },
    'Gift': { incomeAccount: '4030', defaultAssetAccount: '1000' },
    'Rental': { incomeAccount: '4040', defaultAssetAccount: '1010' },
    'Other Income': { incomeAccount: '4050', defaultAssetAccount: '1000' },

    // Sales Revenue
    'Product Sales': { incomeAccount: '4100', defaultAssetAccount: '1010' },
    'Service Sales': { incomeAccount: '4110', defaultAssetAccount: '1010' },

    // Expense Categories
    'Food': { expenseAccount: '5000', defaultAssetAccount: '1000' },
    'Transport': { expenseAccount: '5010', defaultAssetAccount: '1000' },
    'Housing': { expenseAccount: '5020', defaultAssetAccount: '1010' },
    'Utilities': { expenseAccount: '5030', defaultAssetAccount: '1010' },
    'Healthcare': { expenseAccount: '5040', defaultAssetAccount: '1000' },
    'Education': { expenseAccount: '5050', defaultAssetAccount: '1010' },
    'Entertainment': { expenseAccount: '5060', defaultAssetAccount: '1000' },
    'Shopping': { expenseAccount: '5070', defaultAssetAccount: '1000' },
    'Communication': { expenseAccount: '5080', defaultAssetAccount: '1030' },
    'Insurance': { expenseAccount: '5100', defaultAssetAccount: '1010' },
    'Donations': { expenseAccount: '5110', defaultAssetAccount: '1000' },
    'Other Expenses': { expenseAccount: '5199', defaultAssetAccount: '1000' },

    // Business Expense Categories
    'COGS': { expenseAccount: '5200', defaultAssetAccount: '1300' },
    'Bank Charges': { expenseAccount: '5250', defaultAssetAccount: '1010' },
    'Interest Expense': { expenseAccount: '5260', defaultAssetAccount: '1010' },
    'Depreciation': { expenseAccount: '5300', defaultAssetAccount: '1590' },
    'Salaries': { expenseAccount: '5400', defaultAssetAccount: '1010' },
};

// ============================================
// ACCOUNT SEEDING SERVICE
// ============================================

/**
 * Seeds the Chart of Accounts for a new family tenant
 * Called automatically when a new family is created
 * 
 * @param {number} tenantId - The tenant ID to seed accounts for
 * @param {string} currency - Default currency (default: KES)
 */
export async function seedFamilyCoA(tenantId, currency = 'KES') {
    try {
        // Check if accounts already exist
        const existingAccounts = await prisma.account.count({
            where: { tenantId }
        });

        if (existingAccounts > 0) {
            console.log(`[AccountingService] Tenant ${tenantId} already has ${existingAccounts} accounts, skipping seed`);
            return;
        }

        // Create all accounts from template
        const accountsToCreate = FAMILY_COA_TEMPLATE.map(acc => ({
            tenantId,
            code: acc.code,
            name: acc.name,
            type: acc.type,
            description: acc.description || null,
            isSystem: acc.isSystem,
            isContra: acc.isContra || false,
            isActive: true,
            currency,
        }));

        await prisma.account.createMany({
            data: accountsToCreate,
        });

        console.log(`[AccountingService] Seeded ${accountsToCreate.length} accounts for tenant ${tenantId}`);

        return accountsToCreate.length;
    } catch (error) {
        console.error('[AccountingService] Error seeding CoA:', error);
        throw error;
    }
}

// ============================================
// CATEGORY TEMPLATE
// ============================================

/**
 * Standard Family Categories Template
 * These categories map to the Chart of Accounts
 */
const FAMILY_CATEGORIES_TEMPLATE = [
    // Income Categories
    { name: 'Salary', type: 'income', icon: '💼', color: '#10B981' },
    { name: 'Business', type: 'income', icon: '🏢', color: '#3B82F6' },
    { name: 'Investment', type: 'income', icon: '📈', color: '#8B5CF6' },
    { name: 'Gift', type: 'income', icon: '🎁', color: '#EC4899' },
    { name: 'Rental', type: 'income', icon: '🏠', color: '#F59E0B' },
    { name: 'Other Income', type: 'income', icon: '💰', color: '#6EE7B7' },

    // Expense Categories
    { name: 'Food', type: 'expense', icon: '🍔', color: '#EF4444' },
    { name: 'Transport', type: 'expense', icon: '🚗', color: '#F97316' },
    { name: 'Housing', type: 'expense', icon: '🏡', color: '#84CC16' },
    { name: 'Utilities', type: 'expense', icon: '💡', color: '#14B8A6' },
    { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#06B6D4' },
    { name: 'Education', type: 'expense', icon: '📚', color: '#3B82F6' },
    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#8B5CF6' },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#EC4899' },
    { name: 'Communication', type: 'expense', icon: '📱', color: '#F43F5E' },
    { name: 'Insurance', type: 'expense', icon: '🛡️', color: '#64748B' },
    { name: 'Donations', type: 'expense', icon: '🤝', color: '#10B981' },
    { name: 'Other Expenses', type: 'expense', icon: '📦', color: '#6B7280' },
];

/**
 * Seeds categories for a new family tenant
 * Called automatically when a new family is created
 * 
 * @param {number} tenantId - The tenant ID to seed categories for
 */
export async function seedFamilyCategories(tenantId) {
    try {
        // Check if categories already exist
        const existingCategories = await prisma.category.count({
            where: { tenantId }
        });

        if (existingCategories > 0) {
            console.log(`[AccountingService] Tenant ${tenantId} already has ${existingCategories} categories, skipping seed`);
            return;
        }

        // Create all categories from template
        const categoriesToCreate = FAMILY_CATEGORIES_TEMPLATE.map(cat => ({
            tenantId,
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
        }));

        await prisma.category.createMany({
            data: categoriesToCreate,
        });

        console.log(`[AccountingService] Seeded ${categoriesToCreate.length} categories for tenant ${tenantId}`);

        return categoriesToCreate.length;
    } catch (error) {
        console.error('[AccountingService] Error seeding categories:', error);
        throw error;
    }
}

// ============================================
// PAYMENT METHODS TEMPLATE
// ============================================

/**
 * Standard Family Payment Methods Template
 */
const FAMILY_PAYMENT_METHODS_TEMPLATE = [
    { name: 'Cash', type: 'cash', details: { description: 'Physical cash payments' } },
    { name: 'M-Pesa', type: 'mobile_money', details: { provider: 'Safaricom' } },
    { name: 'Bank Transfer', type: 'bank', details: { description: 'Direct bank transfers' } },
    { name: 'Credit Card', type: 'card', details: { cardType: 'credit' } },
    { name: 'Debit Card', type: 'card', details: { cardType: 'debit' } },
];

/**
 * Seeds payment methods for a new family tenant
 * Called automatically when a new family is created
 * 
 * @param {number} tenantId - The tenant ID to seed payment methods for
 */
export async function seedFamilyPaymentMethods(tenantId) {
    try {
        // Check if payment methods already exist
        const existingPaymentMethods = await prisma.paymentMethod.count({
            where: { tenantId }
        });

        if (existingPaymentMethods > 0) {
            console.log(`[AccountingService] Tenant ${tenantId} already has ${existingPaymentMethods} payment methods, skipping seed`);
            return;
        }

        // Create all payment methods from template
        const paymentMethodsToCreate = FAMILY_PAYMENT_METHODS_TEMPLATE.map(pm => ({
            tenantId,
            name: pm.name,
            type: pm.type,
            details: pm.details,
            isActive: true,
        }));

        await prisma.paymentMethod.createMany({
            data: paymentMethodsToCreate,
        });

        console.log(`[AccountingService] Seeded ${paymentMethodsToCreate.length} payment methods for tenant ${tenantId}`);

        return paymentMethodsToCreate.length;
    } catch (error) {
        console.error('[AccountingService] Error seeding payment methods:', error);
        throw error;
    }
}

// ============================================
// ACCOUNT MAPPING SERVICE
// ============================================

/**
 * Gets the account mapping for a transaction category
 * Returns the appropriate debit and credit account codes
 * 
 * @param {string} category - Transaction category name
 * @param {string} type - Transaction type (INCOME or EXPENSE)
 * @returns {Object} Mapping with debitAccountCode and creditAccountCode
 */
export function getAccountMapping(category, type) {
    const mapping = CATEGORY_ACCOUNT_MAP[category];

    if (!mapping) {
        // Default fallback
        if (type === 'INCOME') {
            return {
                debitAccountCode: '1000',  // Cash
                creditAccountCode: '4050', // Other Income
            };
        } else {
            return {
                debitAccountCode: '5199', // Other Expenses
                creditAccountCode: '1000', // Cash
            };
        }
    }

    if (type === 'INCOME') {
        return {
            debitAccountCode: mapping.defaultAssetAccount,
            creditAccountCode: mapping.incomeAccount,
        };
    } else {
        return {
            debitAccountCode: mapping.expenseAccount,
            creditAccountCode: mapping.defaultAssetAccount,
        };
    }
}

/**
 * Resolves account codes to account IDs for a tenant
 * 
 * @param {number} tenantId 
 * @param {string} debitCode 
 * @param {string} creditCode 
 * @returns {Object} { debitAccountId, creditAccountId }
 */
export async function resolveAccountIds(tenantId, debitCode, creditCode) {
    const [debitAccount, creditAccount] = await Promise.all([
        prisma.account.findFirst({ where: { tenantId, code: debitCode } }),
        prisma.account.findFirst({ where: { tenantId, code: creditCode } }),
    ]);

    return {
        debitAccountId: debitAccount?.id || null,
        creditAccountId: creditAccount?.id || null,
    };
}

// ============================================
// JOURNAL POSTING SERVICE
// ============================================

/**
 * Creates a double-entry journal posting
 * This is the core accounting function that ensures every transaction
 * has balanced debits and credits
 * 
 * @param {Object} params
 * @param {number} params.tenantId - Tenant ID
 * @param {number} params.debitAccountId - Account to debit
 * @param {number} params.creditAccountId - Account to credit
 * @param {number} params.amount - Transaction amount
 * @param {string} params.description - Journal description
 * @param {Date} params.date - Transaction date
 * @param {number} params.createdById - User creating the entry
 * @returns {Object} Created journal with lines
 */
export async function createJournalEntry({
    tenantId,
    debitAccountId,
    creditAccountId,
    amount,
    description,
    date = new Date(),
    createdById = null,
}) {
    // Validate: Both accounts must exist
    if (!debitAccountId || !creditAccountId) {
        throw new Error('Both debit and credit accounts are required');
    }

    // Validate: Amount must be positive
    if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
    }

    // Create journal entry with lines in a transaction
    const journal = await prisma.$transaction(async (tx) => {
        // 1. Create journal header
        const journalEntry = await tx.journal.create({
            data: {
                tenantId,
                description,
                date,
                status: 'POSTED',
                createdById,
                reference: `JE-${Date.now()}`,
            },
        });

        // 2. Create debit line
        await tx.journalLine.create({
            data: {
                journalId: journalEntry.id,
                accountId: debitAccountId,
                debit: amount,
                credit: 0,
                description: `Debit: ${description}`,
            },
        });

        // 3. Create credit line
        await tx.journalLine.create({
            data: {
                journalId: journalEntry.id,
                accountId: creditAccountId,
                debit: 0,
                credit: amount,
                description: `Credit: ${description}`,
            },
        });

        // Return journal with lines
        return tx.journal.findUnique({
            where: { id: journalEntry.id },
            include: {
                lines: {
                    include: {
                        account: { select: { id: true, code: true, name: true, type: true } },
                    },
                },
            },
        });
    });

    console.log(`[AccountingService] Created journal ${journal.id} with ${journal.lines.length} lines`);

    return journal;
}

/**
 * Voids a journal entry (reverses the transaction)
 * 
 * @param {number} journalId 
 */
export async function voidJournalEntry(journalId) {
    const journal = await prisma.journal.findUnique({
        where: { id: journalId },
        include: { lines: true },
    });

    if (!journal) {
        throw new Error('Journal entry not found');
    }

    if (journal.status === 'VOID') {
        throw new Error('Journal entry is already voided');
    }

    // Create reversing entry
    await prisma.$transaction(async (tx) => {
        // Mark original as void
        await tx.journal.update({
            where: { id: journalId },
            data: { status: 'VOID' },
        });

        // Create reversing journal
        const reversingJournal = await tx.journal.create({
            data: {
                tenantId: journal.tenantId,
                description: `REVERSAL: ${journal.description}`,
                date: new Date(),
                status: 'POSTED',
                reference: `REV-${journal.reference}`,
            },
        });

        // Create reversed lines (swap debit/credit)
        for (const line of journal.lines) {
            await tx.journalLine.create({
                data: {
                    journalId: reversingJournal.id,
                    accountId: line.accountId,
                    debit: line.credit,  // Swap
                    credit: line.debit,  // Swap
                    description: `Reversal of: ${line.description || ''}`,
                },
            });
        }
    });

    console.log(`[AccountingService] Voided journal ${journalId}`);
}

// ============================================
// ACCOUNT BALANCE SERVICE
// ============================================

/**
 * Calculates the current balance for an account
 * Uses the accounting equation:
 * - Assets/Expenses: Debit increases, Credit decreases (balance = debits - credits)
 * - Liabilities/Equity/Income: Credit increases, Debit decreases (balance = credits - debits)
 * 
 * @param {number} accountId 
 * @returns {number} Current balance
 */
export async function getAccountBalance(accountId) {
    const account = await prisma.account.findUnique({
        where: { id: accountId },
    });

    if (!account) {
        throw new Error('Account not found');
    }

    // Aggregate debits and credits
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

    // Calculate balance based on account type
    let balance;
    if (['ASSET', 'EXPENSE'].includes(account.type)) {
        // Normal debit balance accounts
        balance = totalDebits - totalCredits;
    } else {
        // Normal credit balance accounts (LIABILITY, EQUITY, INCOME)
        balance = totalCredits - totalDebits;
    }

    return balance;
}

/**
 * Gets all account balances for a tenant
 * 
 * @param {number} tenantId 
 * @returns {Array} Accounts with calculated balances
 */
export async function getAllAccountBalances(tenantId) {
    const accounts = await prisma.account.findMany({
        where: { tenantId, isActive: true },
        orderBy: { code: 'asc' },
    });

    const accountsWithBalances = await Promise.all(
        accounts.map(async (account) => {
            const balance = await getAccountBalance(account.id);
            return { ...account, balance };
        })
    );

    return accountsWithBalances;
}

// ============================================
// FINANCIAL REPORTS
// ============================================

/**
 * Generates Trial Balance report
 * Lists all accounts with their debit/credit balances
 * Total debits should equal total credits
 * 
 * @param {number} tenantId 
 * @param {Date} asOfDate 
 */
export async function getTrialBalance(tenantId, asOfDate = new Date()) {
    const accounts = await prisma.account.findMany({
        where: { tenantId, isActive: true },
        orderBy: { code: 'asc' },
    });

    const trialBalanceLines = await Promise.all(
        accounts.map(async (account) => {
            const totals = await prisma.journalLine.aggregate({
                where: {
                    accountId: account.id,
                    journal: {
                        status: 'POSTED',
                        date: { lte: asOfDate },
                    },
                },
                _sum: {
                    debit: true,
                    credit: true,
                },
            });

            const totalDebits = Number(totals._sum.debit || 0);
            const totalCredits = Number(totals._sum.credit || 0);

            let debitBalance = 0;
            let creditBalance = 0;

            if (['ASSET', 'EXPENSE'].includes(account.type)) {
                const netBalance = totalDebits - totalCredits;
                if (netBalance >= 0) {
                    debitBalance = netBalance;
                } else {
                    creditBalance = Math.abs(netBalance);
                }
            } else {
                const netBalance = totalCredits - totalDebits;
                if (netBalance >= 0) {
                    creditBalance = netBalance;
                } else {
                    debitBalance = Math.abs(netBalance);
                }
            }

            return {
                accountId: account.id,
                code: account.code,
                name: account.name,
                type: account.type,
                debitBalance,
                creditBalance,
            };
        })
    );

    // Filter out zero-balance accounts for cleaner report
    const activeLines = trialBalanceLines.filter(
        line => line.debitBalance !== 0 || line.creditBalance !== 0
    );

    const totalDebits = activeLines.reduce((sum, line) => sum + line.debitBalance, 0);
    const totalCredits = activeLines.reduce((sum, line) => sum + line.creditBalance, 0);

    return {
        asOfDate,
        lines: activeLines,
        totals: {
            debits: totalDebits,
            credits: totalCredits,
            isBalanced: Math.abs(totalDebits - totalCredits) < 0.01, // Allow for floating point errors
        },
    };
}

/**
 * Generates Profit & Loss (Income Statement) report
 * Shows income vs expenses for a period
 * 
 * @param {number} tenantId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 */
export async function getProfitAndLoss(tenantId, startDate, endDate) {
    // Get all income accounts
    const incomeAccounts = await prisma.account.findMany({
        where: { tenantId, type: 'INCOME', isActive: true },
        orderBy: { code: 'asc' },
    });

    // Get all expense accounts
    const expenseAccounts = await prisma.account.findMany({
        where: { tenantId, type: 'EXPENSE', isActive: true },
        orderBy: { code: 'asc' },
    });

    // Calculate income totals
    const incomeLines = await Promise.all(
        incomeAccounts.map(async (account) => {
            const totals = await prisma.journalLine.aggregate({
                where: {
                    accountId: account.id,
                    journal: {
                        status: 'POSTED',
                        date: { gte: startDate, lte: endDate },
                    },
                },
                _sum: { credit: true, debit: true },
            });

            // Income: credits increase, debits decrease
            const amount = Number(totals._sum.credit || 0) - Number(totals._sum.debit || 0);

            return {
                accountId: account.id,
                code: account.code,
                name: account.name,
                amount,
            };
        })
    );

    // Calculate expense totals
    const expenseLines = await Promise.all(
        expenseAccounts.map(async (account) => {
            const totals = await prisma.journalLine.aggregate({
                where: {
                    accountId: account.id,
                    journal: {
                        status: 'POSTED',
                        date: { gte: startDate, lte: endDate },
                    },
                },
                _sum: { debit: true, credit: true },
            });

            // Expenses: debits increase, credits decrease
            const amount = Number(totals._sum.debit || 0) - Number(totals._sum.credit || 0);

            return {
                accountId: account.id,
                code: account.code,
                name: account.name,
                amount,
            };
        })
    );

    // Filter out zero amounts
    const activeIncome = incomeLines.filter(line => line.amount !== 0);
    const activeExpenses = expenseLines.filter(line => line.amount !== 0);

    const totalIncome = activeIncome.reduce((sum, line) => sum + line.amount, 0);
    const totalExpenses = activeExpenses.reduce((sum, line) => sum + line.amount, 0);
    const netIncome = totalIncome - totalExpenses;

    return {
        period: { startDate, endDate },
        income: {
            lines: activeIncome,
            total: totalIncome,
        },
        expenses: {
            lines: activeExpenses,
            total: totalExpenses,
        },
        netIncome,
        savingsRate: totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0,
    };
}

/**
 * Generates Cash Flow report
 * Shows changes in asset accounts over time
 * 
 * @param {number} tenantId 
 * @param {Date} startDate 
 * @param {Date} endDate 
 */
export async function getCashFlow(tenantId, startDate, endDate) {
    // Get all asset accounts (cash/bank)
    const assetAccounts = await prisma.account.findMany({
        where: {
            tenantId,
            type: 'ASSET',
            isActive: true,
            code: { in: ['1000', '1010', '1020', '1030', '1040', '1050'] }, // Cash & bank accounts
        },
        orderBy: { code: 'asc' },
    });

    const cashFlowLines = await Promise.all(
        assetAccounts.map(async (account) => {
            // Opening balance (before start date)
            const openingTotals = await prisma.journalLine.aggregate({
                where: {
                    accountId: account.id,
                    journal: {
                        status: 'POSTED',
                        date: { lt: startDate },
                    },
                },
                _sum: { debit: true, credit: true },
            });

            const openingBalance = Number(openingTotals._sum.debit || 0) - Number(openingTotals._sum.credit || 0);

            // Period activity
            const periodTotals = await prisma.journalLine.aggregate({
                where: {
                    accountId: account.id,
                    journal: {
                        status: 'POSTED',
                        date: { gte: startDate, lte: endDate },
                    },
                },
                _sum: { debit: true, credit: true },
            });

            const inflows = Number(periodTotals._sum.debit || 0);
            const outflows = Number(periodTotals._sum.credit || 0);
            const netChange = inflows - outflows;
            const closingBalance = openingBalance + netChange;

            return {
                accountId: account.id,
                code: account.code,
                name: account.name,
                openingBalance,
                inflows,
                outflows,
                netChange,
                closingBalance,
            };
        })
    );

    const totals = cashFlowLines.reduce(
        (acc, line) => ({
            openingBalance: acc.openingBalance + line.openingBalance,
            inflows: acc.inflows + line.inflows,
            outflows: acc.outflows + line.outflows,
            netChange: acc.netChange + line.netChange,
            closingBalance: acc.closingBalance + line.closingBalance,
        }),
        { openingBalance: 0, inflows: 0, outflows: 0, netChange: 0, closingBalance: 0 }
    );

    return {
        period: { startDate, endDate },
        accounts: cashFlowLines,
        totals,
    };
}

/**
 * Gets the Balance Sheet (Statement of Financial Position)
 * Assets = Liabilities + Equity
 * 
 * @param {number} tenantId 
 * @param {Date} asOfDate 
 */
export async function getBalanceSheet(tenantId, asOfDate = new Date()) {
    const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY'];
    const sections = {};

    for (const type of accountTypes) {
        const accounts = await prisma.account.findMany({
            where: { tenantId, type, isActive: true },
            orderBy: { code: 'asc' },
        });

        const lines = await Promise.all(
            accounts.map(async (account) => {
                const balance = await getAccountBalance(account.id);
                return {
                    accountId: account.id,
                    code: account.code,
                    name: account.name,
                    balance,
                };
            })
        );

        const activeLines = lines.filter(line => line.balance !== 0);
        const total = activeLines.reduce((sum, line) => sum + line.balance, 0);

        sections[type.toLowerCase()] = {
            lines: activeLines,
            total,
        };
    }

    return {
        asOfDate,
        assets: sections.asset,
        liabilities: sections.liability,
        equity: sections.equity,
        // Accounting equation check
        isBalanced: Math.abs(
            sections.asset.total - sections.liability.total - sections.equity.total
        ) < 0.01,
    };
}

// Named exports for constants

export default {
    seedFamilyCoA,
    seedFamilyCategories,
    seedFamilyPaymentMethods,
    getAccountMapping,
    resolveAccountIds,
    createJournalEntry,
    voidJournalEntry,
    getAccountBalance,
    getAllAccountBalances,
    getTrialBalance,
    getProfitAndLoss,
    getCashFlow,
    getBalanceSheet,
};
