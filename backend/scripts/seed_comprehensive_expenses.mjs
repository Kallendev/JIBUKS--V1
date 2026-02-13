/**
 * Comprehensive Expense Category Seed Script
 * Based on user-specific category requirements
 * Adds detailed expense categories matching the provided list
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Complete list of expense accounts to add
const EXPENSE_CATEGORIES = [
    // EXPENSE Categories
    { code: '5100', name: 'Amortisation expense', type: 'EXPENSE', subtype: 'operating_expense', description: 'Periodic writeoff of intangible assets' },
    { code: '5110', name: 'Bad debts', type: 'EXPENSE', subtype: 'operating_expense', description: 'Uncollectible receivables written off' },
    { code: '5120', name: 'Bank charges', type: 'EXPENSE', subtype: 'operating_expense', description: 'Bank service fees and charges' },
    { code: '5130', name: 'Commissions and fees', type: 'EXPENSE', subtype: 'operating_expense', description: 'Commissions paid to agents/brokers' },
    { code: '5140', name: 'Dues and subscriptions', type: 'EXPENSE', subtype: 'operating_expense', description: 'Professional memberships and subscriptions' },
    { code: '5150', name: 'Equipment rental', type: 'EXPENSE', subtype: 'operating_expense', description: 'Rental of equipment and machinery' },
    { code: '5160', name: 'Income tax expense', type: 'EXPENSE', subtype: 'tax_expense', description: 'Corporate income tax expense' },
    { code: '5170', name: 'Insurance - Disability', type: 'EXPENSE', subtype: 'operating_expense', description: 'Disability insurance premiums' },
    { code: '5180', name: 'Insurance - General', type: 'EXPENSE', subtype: 'operating_expense', description: 'General business insurance' },
    { code: '5190', name: 'Insurance - Liability', type: 'EXPENSE', subtype: 'operating_expense', description: 'Liability insurance coverage' },
    { code: '5200', name: 'Interest expense', type: 'EXPENSE', subtype: 'financial_expense', description: 'Interest paid on loans and borrowings' },
    { code: '5210', name: 'Legal and professional fees', type: 'EXPENSE', subtype: 'operating_expense', description: 'Lawyers, accountants, consultants' },
    { code: '5220', name: 'Loss on discontinued operations, net of tax', type: 'EXPENSE', subtype: 'other_expense', description: 'Losses from discontinued business segments' },
    { code: '5230', name: 'Management compensation', type: 'EXPENSE', subtype: 'payroll_expense', description: 'Management salaries and compensation' },
    { code: '5240', name: 'Meals and entertainment', type: 'EXPENSE', subtype: 'operating_expense', description: 'Business meals and entertainment' },
    { code: '5250', name: 'Office expenses', type: 'EXPENSE', subtype: 'operating_expense', description: 'General office operating expenses' },
    { code: '5260', name: 'Other Types of Expenses-Advertising Expenses', type: 'EXPENSE', subtype: 'marketing_expense', description: 'Advertising and promotional costs' },
    { code: '5270', name: 'Other general and administrative expenses', type: 'EXPENSE', subtype: 'operating_expense', description: 'Miscellaneous G&A expenses' },
    { code: '5280', name: 'Other selling expenses', type: 'EXPENSE', subtype: 'selling_expense', description: 'Additional selling costs' },
    { code: '5290', name: 'Payroll Expenses', type: 'EXPENSE', subtype: 'payroll_expense', description: 'Employee wages and salaries' },
    { code: '5300', name: 'Purchases', type: 'EXPENSE', subtype: 'cogs', description: 'Inventory and goods purchases' },
    { code: '5310', name: 'Rent or lease payments', type: 'EXPENSE', subtype: 'operating_expense', description: 'Rental/lease payments for property' },
    { code: '5320', name: 'Repairs and Maintenance', type: 'EXPENSE', subtype: 'operating_expense', description: 'Repair and maintenance costs' },
    { code: '5330', name: 'Shipping and delivery expense', type: 'EXPENSE', subtype: 'selling_expense', description: 'Outbound shipping and delivery' },
    { code: '5340', name: 'Stationery and printing', type: 'EXPENSE', subtype: 'operating_expense', description: 'Office stationery and printing' },
    { code: '5350', name: 'Supplies', type: 'EXPENSE', subtype: 'operating_expense', description: 'General business supplies' },
    { code: '5360', name: 'Travel expenses - general and admin expenses', type: 'EXPENSE', subtype: 'operating_expense', description: 'Travel for admin purposes' },
    { code: '5370', name: 'Travel expenses - selling expenses', type: 'EXPENSE', subtype: 'selling_expense', description: 'Travel for sales purposes' },
    { code: '5380', name: 'Uncategorised Expense', type: 'EXPENSE', subtype: 'operating_expense', description: 'Unclassified expenses' },
    { code: '5390', name: 'Utilities', type: 'EXPENSE', subtype: 'operating_expense', description: 'Electricity, water, gas' },
    { code: '5400', name: 'Wage expenses', type: 'EXPENSE', subtype: 'payroll_expense', description: 'Hourly wage expenses' },

    // OTHER INCOME Categories
    { code: '4400', name: 'Dividend income', type: 'INCOME', subtype: 'other_income', description: 'Dividends received from investments' },
    { code: '4410', name: 'Interest income', type: 'INCOME', subtype: 'other_income', description: 'Interest earned on deposits' },
    { code: '4420', name: 'Loss on disposal of assets', type: 'INCOME', subtype: 'other_income', description: 'Gains/losses on asset disposal - contra' },
    { code: '4430', name: 'Other operating income (expenses)', type: 'INCOME', subtype: 'other_income', description: 'Miscellaneous operating income' },
    { code: '4440', name: 'Unrealised loss on securities, net of tax', type: 'INCOME', subtype: 'other_income', description: 'Mark-to-market securities gains/losses' },

    // OTHER CURRENT LIABILITY Categories
    { code: '2460', name: 'Accrued liabilities', type: 'LIABILITY', subtype: 'other_liability', description: 'General accrued liabilities' },
    { code: '2470', name: 'Deferred Revenue', type: 'LIABILITY', subtype: 'deferred_revenue', description: 'Prepaid revenue not yet earned' },
    { code: '2480', name: 'Dividends payable', type: 'LIABILITY', subtype: 'other_liability', description: 'Declared dividends not yet paid' },
    { code: '2490', name: 'Income tax payable', type: 'LIABILITY', subtype: 'taxes_payable', description: 'Corporate tax owed' },
    { code: '2500', name: 'Payroll Clearing', type: 'LIABILITY', subtype: 'payroll_liability', description: 'Temporary payroll account' },
    { code: '2510', name: 'Payroll liabilities', type: 'LIABILITY', subtype: 'payroll_liability', description: 'Employee deductions payable' },
    { code: '2520', name: 'Short-term debit', type: 'LIABILITY', subtype: 'loans_current', description: 'Short-term debt obligations' },
    { code: '2530', name: 'VAT Control', type: 'LIABILITY', subtype: 'vat_payable', description: 'VAT control account', isVatAccount: true },
    { code: '2540', name: 'VAT Suspense', type: 'LIABILITY', subtype: 'vat_payable', description: 'Temporary VAT holding', isVatAccount: true },

    // OTHER CURRENT ASSET Categories  
    { code: '1250', name: 'Allowance for bad debt', type: 'ASSET', subtype: 'contra_receivable', description: 'Bad debt provision', isContra: true },
    { code: '1260', name: 'Available for sale assets (short-term)', type: 'ASSET', subtype: 'other_current_asset', description: 'Short-term marketable securities' },
    { code: '1270', name: 'Inventory', type: 'ASSET', subtype: 'inventory', description: 'Stock on hand' },
    { code: '1280', name: 'Inventory Asset', type: 'ASSET', subtype: 'inventory', description: 'Inventory asset account' },
    { code: '1290', name: 'Prepaid expenses', type: 'ASSET', subtype: 'prepayment', description: 'Expenses paid in advance' },
    { code: '1295', name: 'Uncategorised Asset', type: 'ASSET', subtype: 'other_asset', description: 'Unclassified assets' },
    { code: '1296', name: 'Undeposited Funds', type: 'ASSET', subtype: 'cash', description: 'Cash not yet deposited' },

    // OTHER ASSET Categories
    { code: '1550', name: 'Assets held for sale', type: 'ASSET', subtype: 'other_asset', description: 'Assets designated for sale' },
    { code: '1560', name: 'Deferred tax assets', type: 'ASSET', subtype: 'other_asset', description: 'Future tax benefits' },
    { code: '1570', name: 'Goodwill', type: 'ASSET', subtype: 'intangible', description: 'Business acquisition goodwill' },
    { code: '1580', name: 'Intangibles', type: 'ASSET', subtype: 'intangible', description: 'Intangible assets' },
    { code: '1585', name: 'Long-Term Investments', type: 'ASSET', subtype: 'investment', description: 'Long-term investment holdings' },

    // LONG TERM LIABILITY Categories
    { code: '2710', name: 'Accrued holiday payable', type: 'LIABILITY', subtype: 'payroll_liability', description: 'Accrued vacation liability' },
    { code: '2720', name: 'Accrued non-current liabilities', type: 'LIABILITY', subtype: 'other_lt_liability', description: 'Long-term accrued liabilities' },
    { code: '2730', name: 'Liabilities related to assets held for sale', type: 'LIABILITY', subtype: 'other_lt_liability', description: 'Liabilities for assets held for sale' },
    { code: '2740', name: 'Long-term debt', type: 'LIABILITY', subtype: 'loans_long_term', description: 'Long-term debt obligations' },

    // INCOME Categories
    { code: '4150', name: 'Billable Expense Income', type: 'INCOME', subtype: 'sales_revenue', description: 'Reimbursable expense income' },
    { code: '4160', name: 'Revenue - General', type: 'INCOME', subtype: 'sales_revenue', description: 'General business revenue' },
    { code: '4170', name: 'Sales - retail', type: 'INCOME', subtype: 'sales_revenue', description: 'Retail sales revenue' },
    { code: '4180', name: 'Sales - wholesale', type: 'INCOME', subtype: 'sales_revenue', description: 'Wholesale sales revenue' },
    { code: '4190', name: 'Sales of Product Income', type: 'INCOME', subtype: 'sales_revenue', description: 'Product sales' },
    { code: '4200', name: 'Services', type: 'INCOME', subtype: 'sales_revenue', description: 'Service revenue' },
    { code: '4205', name: 'Uncategorised Income', type: 'INCOME', subtype: 'other_income', description: 'Unclassified income' },

    // FIXED ASSET Categories
    { code: '1440', name: 'Accumulated depreciation on property, plant and equipment', type: 'ASSET', subtype: 'contra_asset', description: 'Accumulated depreciation', isContra: true },
    { code: '1450', name: 'Property, plant and equipment', type: 'ASSET', subtype: 'fixed_asset', description: 'Fixed assets' },

    // EQUITY Categories
    { code: '3100', name: 'Dividend disbursed', type: 'EQUITY', subtype: 'drawings', description: 'Dividends paid out', isContra: true },
    { code: '3110', name: 'Equity in earnings of subsidiaries', type: 'EQUITY', subtype: 'retained_earnings', description: 'Share of subsidiary profits' },
    { code: '3120', name: 'Other comprehensive income', type: 'EQUITY', subtype: 'retained_earnings', description: 'OCI items' },
    { code: '3130', name: 'Retained Earnings', type: 'EQUITY', subtype: 'retained_earnings', description: 'Accumulated retained earnings' },
    { code: '3140', name: 'Share capital', type: 'EQUITY', subtype: 'equity', description: 'Issued share capital' },

    // COST OF GOODS SOLD Categories
    { code: '5410', name: 'Cost of sales', type: 'EXPENSE', subtype: 'cogs', description: 'Direct cost of goods sold' },
    { code: '5420', name: 'Freight and delivery - COS', type: 'EXPENSE', subtype: 'cogs', description: 'Inbound freight costs' },

    // BANK Categories
    { code: '1028', name: 'Cash and cash equivalents', type: 'ASSET', subtype: 'cash', description: 'Cash and near-cash items', isPaymentEligible: true },

    // ACCOUNTS PAYABLE Categories
    { code: '2013', name: 'Accounts Payable (A/P)', type: 'LIABILITY', subtype: 'accounts_payable', description: 'Main trade payables account' },
];

async function seedExpenseCategories() {
    try {
        console.log('🔄 Starting Comprehensive Expense Category Seeding...\n');

        // Get all tenants
        const tenants = await prisma.tenant.findMany();
        if (tenants.length === 0) {
            console.error('❌ No tenants found. Create a tenant first.');
            return;
        }

        console.log(`👥 Found ${tenants.length} tenant(s)\n`);

        for (const tenant of tenants) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📁 Processing Tenant: ${tenant.name} (ID: ${tenant.id})`);
            console.log('='.repeat(60));

            let created = 0;
            let updated = 0;
            let skipped = 0;

            for (const account of EXPENSE_CATEGORIES) {
                const existing = await prisma.account.findFirst({
                    where: { tenantId: tenant.id, code: account.code }
                });

                if (existing) {
                    //Update existing account
                    await prisma.account.update({
                        where: { id: existing.id },
                        data: {
                            name: account.name,
                            description: account.description || null,
                            subtype: account.subtype || null,
                            isContra: account.isContra ?? false,
                            isPaymentEligible: account.isPaymentEligible ?? false,
                        }
                    });
                    updated++;
                } else {
                    // Create new account
                    await prisma.account.create({
                        data: {
                            tenantId: tenant.id,
                            code: account.code,
                            name: account.name,
                            type: account.type,
                            description: account.description || null,
                            subtype: account.subtype || null,
                            isSystem: false,
                            isContra: account.isContra ?? false,
                            isPaymentEligible: account.isPaymentEligible ?? false,
                            isActive: true,
                        }
                    });
                    created++;
                }
            }

            console.log(`   ✅ Created: ${created}`);
            console.log(`   ⬆️  Updated: ${updated}`);
            console.log(`   ⏭️  Skipped: ${skipped}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Categories Added: ${EXPENSE_CATEGORIES.length}`);
        console.log('\n✅ Seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

seedExpenseCategories();
