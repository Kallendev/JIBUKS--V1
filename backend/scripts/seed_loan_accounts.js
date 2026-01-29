
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Dept & Loan Accounts...');

    const tenants = await prisma.tenant.findMany();

    for (const tenant of tenants) {
        console.log(`\nProcessing Tenant: ${tenant.name} (${tenant.id})`);

        const accounts = [
            // LIABILITIES (2000 Series - Current & Long Term)
            { code: '2010', name: 'Credit Card', type: 'LIABILITY', subtype: 'current_liability', description: 'Revolving debt (High Interest)' },
            { code: '2020', name: 'Fuliza (Overdraft)', type: 'LIABILITY', subtype: 'current_liability', description: 'Bank Overdraft' },
            { code: '2030', name: 'M-Shwari Loan', type: 'LIABILITY', subtype: 'current_liability', description: '30-Day Mobile Loan' },
            { code: '2040', name: 'KCB M-PESA Loan', type: 'LIABILITY', subtype: 'current_liability', description: 'Short-term Mobile Loan' },
            { code: '2050', name: 'Salary Advance', type: 'LIABILITY', subtype: 'current_liability', description: 'Owed to Employer' },
            { code: '2060', name: 'Digital Loans (Tala/Branch)', type: 'LIABILITY', subtype: 'current_liability', description: 'App-based loans' },

            { code: '2510', name: 'Mortgage / Home Loan', type: 'LIABILITY', subtype: 'long_term_liability', description: 'House Financing' },
            { code: '2520', name: 'Car Loan / Asset Finance', type: 'LIABILITY', subtype: 'long_term_liability', description: 'Vehicle Financing' },
            { code: '2530', name: 'Sacco Loan (Development)', type: 'LIABILITY', subtype: 'long_term_liability', description: 'Development Loan (3x Savings)' },
            { code: '2540', name: 'School Fees Loan', type: 'LIABILITY', subtype: 'long_term_liability', description: 'Education Loan' },

            // EXPENSES (The Cost of Debt)
            { code: '6810', name: 'Loan Interest Expense', type: 'EXPENSE', subtype: 'financial_expense', description: 'Interest paid on loans' },
            { code: '6820', name: 'Loan Processing Fees', type: 'EXPENSE', subtype: 'financial_expense', description: 'Insurance, Negotiation & Service fees' },
        ];

        for (const acc of accounts) {
            const existing = await prisma.account.findFirst({
                where: { tenantId: tenant.id, code: acc.code }
            });

            if (existing) {
                console.log(`   Skipping: [${acc.code}] ${acc.name} (Exists)`);
                // Optional: Update if needed
                await prisma.account.update({
                    where: { id: existing.id },
                    data: {
                        name: acc.name,
                        subtype: acc.subtype,
                        description: acc.description
                    }
                });
            } else {
                await prisma.account.create({
                    data: {
                        tenantId: tenant.id,
                        code: acc.code,
                        name: acc.name,
                        type: acc.type,
                        subtype: acc.subtype,
                        description: acc.description,
                        isPaymentEligible: false,
                        isActive: true
                    }
                });
                console.log(`   Created: [${acc.code}] ${acc.name}`);
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
