/**
 * Seed Kenyan Chart of Accounts
 * 
 * This script seeds the database with the complete Kenyan banking setup
 * including all major banks, mobile money providers, and Saccos.
 * 
 * Run: node seed_kenyan_coa.js
 */

import { PrismaClient } from '@prisma/client';
import { FAMILY_COA_TEMPLATE } from './src/services/accountingService.js';

const prisma = new PrismaClient();

async function seedKenyanCOA() {
    console.log('🌍 Starting Kenyan Chart of Accounts Seeding...\n');

    try {
        // Get all tenants
        const tenants = await prisma.tenant.findMany();

        if (tenants.length === 0) {
            console.log('⚠️  No tenants found. Please create a tenant first.');
            return;
        }

        for (const tenant of tenants) {
            console.log(`\n📊 Seeding COA for tenant: ${tenant.name} (ID: ${tenant.id})`);

            let created = 0;
            let updated = 0;
            let skipped = 0;

            for (const accountTemplate of FAMILY_COA_TEMPLATE) {
                try {
                    // Check if account already exists
                    const existing = await prisma.account.findFirst({
                        where: {
                            tenantId: tenant.id,
                            code: accountTemplate.code,
                        },
                    });

                    if (existing) {
                        // Update existing account
                        await prisma.account.update({
                            where: { id: existing.id },
                            data: {
                                name: accountTemplate.name,
                                type: accountTemplate.type,
                                description: accountTemplate.description,
                                isSystem: accountTemplate.isSystem || false,
                                isContra: accountTemplate.isContra || false,
                                isPaymentEligible: accountTemplate.isPaymentEligible || false,
                                subtype: accountTemplate.subtype,
                                systemTag: accountTemplate.systemTag,
                            },
                        });
                        updated++;
                        console.log(`   ✓ Updated: ${accountTemplate.code} - ${accountTemplate.name}`);
                    } else {
                        // Create new account
                        await prisma.account.create({
                            data: {
                                tenantId: tenant.id,
                                code: accountTemplate.code,
                                name: accountTemplate.name,
                                type: accountTemplate.type,
                                description: accountTemplate.description,
                                isSystem: accountTemplate.isSystem || false,
                                isContra: accountTemplate.isContra || false,
                                isPaymentEligible: accountTemplate.isPaymentEligible || false,
                                subtype: accountTemplate.subtype,
                                systemTag: accountTemplate.systemTag,
                                currency: 'KES',
                            },
                        });
                        created++;
                        console.log(`   ✓ Created: ${accountTemplate.code} - ${accountTemplate.name}`);
                    }
                } catch (error) {
                    skipped++;
                    console.log(`   ⚠️  Skipped: ${accountTemplate.code} - ${accountTemplate.name} (${error.message})`);
                }
            }

            console.log(`\n   Summary for ${tenant.name}:`);
            console.log(`   - Created: ${created} accounts`);
            console.log(`   - Updated: ${updated} accounts`);
            console.log(`   - Skipped: ${skipped} accounts`);
        }

        console.log('\n✅ Kenyan Chart of Accounts seeding completed successfully!\n');
        console.log('📋 Accounts seeded include:');
        console.log('   - Cash on Hand (1001)');
        console.log('   - M-PESA Personal (1010)');
        console.log('   - M-PESA Business/Till (1011)');
        console.log('   - M-Shwari Savings (1012)');
        console.log('   - KCB M-PESA (1013)');
        console.log('   - Equity Bank (1020)');
        console.log('   - KCB Bank (1021)');
        console.log('   - Co-operative Bank (1022)');
        console.log('   - NCBA Bank (1023)');
        console.log('   - Standard Chartered (1024)');
        console.log('   - Absa Bank (1025)');
        console.log('   - I&M Bank (1026)');
        console.log('   - DTB Bank (1027)');
        console.log('   - Stanbic Bank (1028)');
        console.log('   - Stima Sacco FOSA (1030)');
        console.log('   - Police Sacco (1031)');
        console.log('   - Airtel Money (1040)');
        console.log('   - T-Kash (1041)');
        console.log('   - And all other standard accounts...\n');

    } catch (error) {
        console.error('❌ Error seeding Chart of Accounts:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding
seedKenyanCOA()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
