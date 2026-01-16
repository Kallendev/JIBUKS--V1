/**
 * Script to seed payment methods for existing families
 * Run this if you have an existing family that doesn't have payment methods yet
 * 
 * Usage: node scripts/seedPaymentMethods.js
 */

import { prisma } from '../src/lib/prisma.js';
import { seedFamilyPaymentMethods } from '../src/services/accountingService.js';

async function main() {
    try {
        console.log('🌱 Starting payment method seeding for all families...\n');

        // Get all tenants
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        paymentMethods: true
                    }
                }
            }
        });

        console.log(`Found ${tenants.length} families\n`);

        for (const tenant of tenants) {
            console.log(`Processing family: ${tenant.name} (ID: ${tenant.id})`);
            
            if (tenant._count.paymentMethods > 0) {
                console.log(`  ⏭️  Already has ${tenant._count.paymentMethods} payment methods, skipping\n`);
                continue;
            }

            try {
                const count = await seedFamilyPaymentMethods(tenant.id);
                console.log(`  ✅ Seeded ${count} payment methods\n`);
            } catch (error) {
                console.error(`  ❌ Error seeding payment methods:`, error.message, '\n');
            }
        }

        console.log('✨ Payment method seeding complete!');
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
