import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUnclearedChequesAccount() {
    console.log('🏦 Seeding Uncleared Cheques Payable account...');

    try {
        // Get all tenants
        const tenants = await prisma.tenant.findMany();

        for (const tenant of tenants) {
            console.log(`\n📊 Processing tenant: ${tenant.name} (ID: ${tenant.id})`);

            // Check if account already exists
            const existing = await prisma.account.findFirst({
                where: {
                    tenantId: tenant.id,
                    systemTag: 'UNCLEARED_CHEQUES',
                },
            });

            if (existing) {
                console.log(`  ✅ Uncleared Cheques account already exists (ID: ${existing.id})`);
                continue;
            }

            // Create the Uncleared Cheques Payable account
            const account = await prisma.account.create({
                data: {
                    tenantId: tenant.id,
                    code: '2150', // Liability account - Uncleared Cheques
                    name: 'Uncleared Cheques Payable',
                    type: 'LIABILITY',
                    subtype: 'current_liability',
                    systemTag: 'UNCLEARED_CHEQUES',
                    description: 'Tracks post-dated cheques that have been written but not yet cleared by the bank',
                    isSystem: true, // System account - can't be deleted
                    isControl: false,
                    allowDirectPost: false, // Only journal entries can post here
                    isPaymentEligible: false,
                    isActive: true,
                    currency: 'KES',
                },
            });

            console.log(`  ✅ Created Uncleared Cheques account (ID: ${account.id})`);
        }

        console.log('\n✅ Uncleared Cheques accounts seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding Uncleared Cheques accounts:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed
seedUnclearedChequesAccount()
    .then(() => {
        console.log('\n🎉 Seed completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Seed failed:', error);
        process.exit(1);
    });
