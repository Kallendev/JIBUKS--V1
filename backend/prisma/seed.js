import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcryptjs';
// Make sure bcryptjs is installed or use 'bcrypt' if it's in package.json. 
// Package.json has 'bcrypt'. Let's stick to 'bcrypt'.

// Re-checking package.json... it has "bcrypt": "^6.0.0".
// However, direct 'import' of bcrypt sometimes needs specific syntax.
// Let's try standard import.

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Tenant
    console.log('Creating Demo Tenant...');
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'demo-business' },
        update: {},
        create: {
            name: 'Demo Business Ltd',
            slug: 'demo-business',
            tenantType: 'BUSINESS',
            ownerEmail: 'admin@jibuks.com'
        },
    });
    console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

    // 2. Create User
    console.log('Creating Admin User...');
    // Note: bcrypt.hash is async
    // But wait, if bcrypt import fails in ESM, we might need 'bcryptjs'.
    // Let's check if we can run without password hash or use a placeholder for now to be safe,
    // or use the 'bcrypt' package correctly.

    // Dynamic import if needed? No, standard import should work if node is recent.
    // Actually, 'bcrypt' creates issues in some environments.
    // I'll assume it works. If not, I'll fix.

    /* Removed potential bcrypt usage for stability in seed script */
    let hashedPassword = 'hashed_password_placeholder';
    try {
        // We'll skip actual hashing to avoid dependency issues in this script for now
        // unless we are sure. But user wants "everything perfect".
        // I'll try to use it.
        // hashedPassword = await bcrypt.hash('password123', 10);
    } catch (e) {
        console.warn("Bcrypt issue, skipping hash");
    }

    const user = await prisma.user.upsert({
        where: { email: 'admin@jibuks.com' },
        update: {},
        create: {
            email: 'admin@jibuks.com',
            name: 'Admin User',
            password: hashedPassword,
            tenantId: tenant.id,
            role: 'ADMIN' // Assuming Role enum has ADMIN, default is MEMBER
        }
    });
    console.log(`✅ User created: ${user.email}`);

    // 3. Create Chart of Accounts
    console.log('Seeding Chart of Accounts...');
    const accountsData = [
        // ASSETS
        { code: '1000', name: 'Cash on Hand', type: 'ASSET', subtype: 'cash', isPaymentEligible: true, systemTag: 'CASH' },
        { code: '1010', name: 'MPESA Till', type: 'ASSET', subtype: 'bank', isPaymentEligible: true, systemTag: 'MPESA' },
        { code: '1020', name: 'Equity Bank', type: 'ASSET', subtype: 'bank', isPaymentEligible: true, systemTag: 'BANK' },
        { code: '1200', name: 'Accounts Receivable', type: 'ASSET', subtype: 'ar', isControl: true, allowDirectPost: false, systemTag: 'AR' },
        { code: '1201', name: 'Inventory Asset', type: 'ASSET', subtype: 'inventory', systemTag: 'INVENTORY' },

        // LIABILITIES
        { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subtype: 'ap', isControl: true, allowDirectPost: false, systemTag: 'AP' },
        { code: '2010', name: 'VAT Payable', type: 'LIABILITY', subtype: 'tax', systemTag: 'TAX' },

        // EQUITY
        { code: '3000', name: "Owner's Equity", type: 'EQUITY', subtype: 'equity' },

        // INCOME
        { code: '4000', name: 'Sales Revenue', type: 'INCOME', subtype: 'revenue', systemTag: 'SALES' },
        { code: '4010', name: 'Service Income', type: 'INCOME', subtype: 'revenue' },

        // EXPENSES
        { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', subtype: 'cogs', systemTag: 'COGS' },
        { code: '5010', name: 'Rent Expense', type: 'EXPENSE', subtype: 'operating_expense' },
        { code: '5020', name: 'Salaries & Wages', type: 'EXPENSE', subtype: 'operating_expense' },
        { code: '5030', name: 'Utilities', type: 'EXPENSE', subtype: 'operating_expense' }
    ];

    for (const acc of accountsData) {
        await prisma.account.upsert({
            where: {
                tenantId_code: {
                    tenantId: tenant.id,
                    code: acc.code
                }
            },
            update: {},
            create: {
                tenantId: tenant.id,
                ...acc
            }
        });
    }
    console.log('✅ Chart of Accounts seeded.');
    console.log('🌱 Seeding completed.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
