import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExpenseAccounts() {
    try {
        console.log('🔍 Checking EXPENSE accounts...\n');

        // Get all EXPENSE accounts
        const expenseAccounts = await prisma.account.findMany({
            where: { type: 'EXPENSE' },
            orderBy: { code: 'asc' },
            take: 50
        });

        console.log(`Total EXPENSE accounts: ${expenseAccounts.length}\n`);
        console.log('First 50 EXPENSE accounts:');
        expenseAccounts.forEach(acc => {
            console.log(`  ${acc.code} - ${acc.name}`);
        });

        // Check for specific new accounts
        console.log('\n🔍 Checking for new comprehensive categories...\n');
        const newCategories = [
            '5100', '5110', '5120', '5130', '5140', '5150',
            '5160', '5170', '5180', '5190', '5200', '5210',
            '5220', '5230', '5240', '5250', '5260', '5270',
            '5280', '5290', '5300', '5310', '5320', '5330',
            '5340', '5350', '5360', '5370', '5380', '5390', '5400'
        ];

        for (const code of newCategories) {
            const account = await prisma.account.findFirst({
                where: { code }
            });
            if (account) {
                console.log(`✅ ${code} - ${account.name}`);
            } else {
                console.log(`❌ ${code} - NOT FOUND`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkExpenseAccounts();
