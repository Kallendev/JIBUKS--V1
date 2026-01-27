
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Payslip & Income Accounts...');

    // Get all tenants
    const tenants = await prisma.tenant.findMany();

    for (const tenant of tenants) {
        console.log(`\nProcessing Tenant: ${tenant.name} (${tenant.id})`);

        const accounts = [
            // INCOME ACCOUNTS
            { code: '4001', name: 'Salary & Wages (Dad)', type: 'INCOME', subtype: 'income', description: 'Primary salary income' },
            { code: '4002', name: 'Salary & Wages (Mom)', type: 'INCOME', subtype: 'income', description: 'Secondary salary income' },
            { code: '4100', name: 'Business / Side Hustle Profit', type: 'INCOME', subtype: 'income', description: 'Profit from business' },
            { code: '4200', name: 'Rental Income', type: 'INCOME', subtype: 'income', description: 'Income from property' },
            { code: '4300', name: 'Investment Dividends', type: 'INCOME', subtype: 'income', description: 'Dividends and capital gains' },
            { code: '4400', name: 'Interest Income', type: 'INCOME', subtype: 'income', description: 'Interest from savings/bonds' },
            { code: '4500', name: 'Gifts & Refunds Received', type: 'INCOME', subtype: 'income', description: 'Gifts and refunds' },
            { code: '4999', name: 'Other Income', type: 'INCOME', subtype: 'income', description: 'Miscellaneous income' },

            // DEDUCTION EXPENSES (6600 Series extension)
            { code: '6601', name: 'Tax: PAYE (Income Tax)', type: 'EXPENSE', subtype: 'tax', description: 'Pay As You Earn Tax' },
            { code: '6602', name: 'Tax: Housing Levy', type: 'EXPENSE', subtype: 'tax', description: 'Housing Levy Deduction' },
            { code: '6603', name: 'Insurance: SHIF / NHIF', type: 'EXPENSE', subtype: 'insurance', description: 'Health Insurance Deduction' },
            { code: '6604', name: 'Pension / NSSF Contribution', type: 'EXPENSE', subtype: 'pension', description: 'Social Security / Pension' },

            // Liability for Sacco/Loans won't be seeded here as they are dynamic, 
            // but we can ensure a generic one exists if needed.
            { code: '2100', name: 'Sacco Loan', type: 'LIABILITY', subtype: 'liabilities', description: 'Sacco Loan Balance' },
            { code: '1080', name: 'Sacco Savings', type: 'ASSET', subtype: 'savings', description: 'Sacco Savings Account' },
        ];

        for (const acc of accounts) {
            const existing = await prisma.account.findFirst({
                where: {
                    tenantId: tenant.id,
                    code: acc.code,
                }
            });

            if (!existing) {
                await prisma.account.create({
                    data: {
                        tenantId: tenant.id,
                        code: acc.code,
                        name: acc.name,
                        type: acc.type,
                        subtype: acc.subtype,
                        description: acc.description,
                        currency: 'KES',
                        allowDirectPost: true,
                        isActive: true,
                    }
                });
                console.log(`   ✅ Created: [${acc.code}] ${acc.name}`);
            } else {
                // Update name if needed to match the requested "Perfect" naming
                await prisma.account.update({
                    where: { id: existing.id },
                    data: {
                        name: acc.name,
                        subtype: acc.subtype
                    }
                });
                console.log(`   🔄 Updated: [${acc.code}] ${acc.name}`);
            }
        }
    }

    console.log('\n✨ Seeding Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
