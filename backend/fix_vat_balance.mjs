import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixVATReceivable() {
    try {
        console.log('🔧 Fixing VAT Receivable Account Balance...\n');

        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.error('❌ No tenant found');
            return;
        }

        // Find VAT Receivable account
        const vatAccount = await prisma.account.findFirst({
            where: {
                tenantId: tenant.id,
                code: '1157'
            }
        });

        if (!vatAccount) {
            console.log('❌ VAT Receivable account (1157) not found');
            return;
        }

        console.log(`Found: ${vatAccount.code} - ${vatAccount.name}`);
        console.log(`Current Balance: ${vatAccount.balance}`);
        console.log(`Type: ${String(typeof vatAccount.balance)}\n`);

        // Update to ensure balance is 0 (Decimal type)
        const updated = await prisma.account.update({
            where: { id: vatAccount.id },
            data: { balance: 0 }
        });

        console.log('✅ Updated balance to 0');
        console.log(`New Balance: ${updated.balance}`);
        console.log(`Type: ${typeof updated.balance}\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixVATReceivable();
