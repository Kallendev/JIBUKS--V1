/**
 * VAT Rates Seeding Script
 * Seeds comprehensive VAT rates for Kenya
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VAT_RATES = [
    {
        name: '16.0% S',
        rate: 16.0,
        code: 'S',
        description: 'Standard VAT Rate',
        isActive: true
    },
    {
        name: 'Exempt Purchase',
        rate: 0.0,
        code: 'EXEMPT',
        description: 'VAT Exempt Purchases',
        isActive: true
    },
    {
        name: '0.0% Z',
        rate: 0.0,
        code: 'Z',
        description: 'Zero-rated VAT',
        isActive: true
    },
    {
        name: '16.0% S Import',
        rate: 16.0,
        code: 'S_IMPORT',
        description: 'Standard VAT on Imports',
        isActive: true
    },
    {
        name: 'No VAT',
        rate: 0.0,
        code: 'NO_VAT',
        description: 'No VAT applicable',
        isActive: true
    },
    {
        name: '16.0% S - RC Imported Services',
        rate: 0.0,
        code: 'S_RC_IMPORT',
        description: 'Reverse Charge on Imported Services',
        isActive: true
    },
    {
        name: '8.0% Petrol',
        rate: 8.0,
        code: 'PETROL',
        description: 'Petroleum Products VAT',
        isActive: true
    }
];

async function seedVatRates() {
    try {
        console.log('🔄 Starting VAT Rates Seeding...\n');

        // Get all tenants
        const tenants = await prisma.tenant.findMany();
        if (tenants.length === 0) {
            console.error('❌ No tenants found. Create a tenant first.');
            return;
        }

        console.log(`👥 Found ${tenants.length} tenant(s)\n`);

        for (const tenant of tenants) {
            console.log(`${'='.repeat(60)}`);
            console.log(`📁 Processing Tenant: ${tenant.name} (ID: ${tenant.id})`);
            console.log('='.repeat(60));

            let created = 0;
            let updated = 0;

            for (const vatRate of VAT_RATES) {
                const existing = await prisma.vatRate.findFirst({
                    where: {
                        tenantId: tenant.id,
                        code: vatRate.code
                    }
                });

                if (existing) {
                    // Update existing
                    await prisma.vatRate.update({
                        where: { id: existing.id },
                        data: {
                            name: vatRate.name,
                            rate: vatRate.rate,
                            description: vatRate.description,
                            isActive: vatRate.isActive,
                        }
                    });
                    updated++;
                } else {
                    // Create new
                    await prisma.vatRate.create({
                        data: {
                            tenantId: tenant.id,
                            name: vatRate.name,
                            rate: vatRate.rate,
                            code: vatRate.code,
                            description: vatRate.description,
                            isActive: vatRate.isActive,
                        }
                    });
                    created++;
                }
            }

            console.log(`   ✅ Created: ${created}`);
            console.log(`   ⬆️  Updated: ${updated}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total VAT Rates: ${VAT_RATES.length}`);
        console.log('\n✅ VAT Rates seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

seedVatRates();
