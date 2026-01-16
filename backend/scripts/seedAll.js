/**
 * Master seeding script - Seeds CoA, Categories, and Payment Methods for all families
 * Run this for existing families that need the complete setup
 * 
 * Usage: node scripts/seedAll.js
 */

import { prisma } from '../src/lib/prisma.js';
import { seedFamilyCoA, seedFamilyCategories, seedFamilyPaymentMethods } from '../src/services/accountingService.js';

async function main() {
    try {
        console.log('🌱 Starting complete seeding for all families...\n');

        // Get all tenants
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        accounts: true,
                        categories: true,
                        paymentMethods: true
                    }
                }
            }
        });

        console.log(`Found ${tenants.length} families\n`);

        for (const tenant of tenants) {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📦 Processing: ${tenant.name} (ID: ${tenant.id})`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            
            // Seed Chart of Accounts
            if (tenant._count.accounts > 0) {
                console.log(`✓ Chart of Accounts: ${tenant._count.accounts} accounts (already exists)`);
            } else {
                try {
                    const count = await seedFamilyCoA(tenant.id);
                    console.log(`✅ Chart of Accounts: Seeded ${count} accounts`);
                } catch (error) {
                    console.error(`❌ Chart of Accounts: ${error.message}`);
                }
            }

            // Seed Categories
            if (tenant._count.categories > 0) {
                console.log(`✓ Categories: ${tenant._count.categories} categories (already exists)`);
            } else {
                try {
                    const count = await seedFamilyCategories(tenant.id);
                    console.log(`✅ Categories: Seeded ${count} categories`);
                } catch (error) {
                    console.error(`❌ Categories: ${error.message}`);
                }
            }

            // Seed Payment Methods
            if (tenant._count.paymentMethods > 0) {
                console.log(`✓ Payment Methods: ${tenant._count.paymentMethods} methods (already exists)`);
            } else {
                try {
                    const count = await seedFamilyPaymentMethods(tenant.id);
                    console.log(`✅ Payment Methods: Seeded ${count} methods`);
                } catch (error) {
                    console.error(`❌ Payment Methods: ${error.message}`);
                }
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ Complete seeding finished!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
