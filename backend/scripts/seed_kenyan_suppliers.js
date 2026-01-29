
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COMMON_SUPPLIERS = [
    { name: 'Naivas Supermarket', tags: ['Groceries', 'Shopping'] },
    { name: 'Quickmart', tags: ['Groceries', 'Shopping'] },
    { name: 'Carrefour', tags: ['Groceries', 'Shopping'] },
    { name: 'Chandarana Foodplus', tags: ['Groceries', 'Shopping'] },
    { name: 'Cleanshelf Supermarket', tags: ['Groceries', 'Shopping'] },
    { name: 'KPLC (Kenya Power)', tags: ['Utilities', 'Electricity'] },
    { name: 'Nairobi Water', tags: ['Utilities', 'Water'] },
    { name: 'Safaricom PLC', tags: ['Utilities', 'Internet', 'Phone'] },
    { name: 'Airtel Kenya', tags: ['Utilities', 'Internet', 'Phone'] },
    { name: 'Zuku Fiber (Wananchi)', tags: ['Utilities', 'Internet'] },
    { name: 'Starlink', tags: ['Utilities', 'Internet'] },
    { name: 'TotalEnergies', tags: ['Fuel', 'Transport'] },
    { name: 'Shell (Vivo Energy)', tags: ['Fuel', 'Transport'] },
    { name: 'Rubis Energy', tags: ['Fuel', 'Transport'] },
    { name: 'Ola Energy', tags: ['Fuel', 'Transport'] },
    { name: 'Kenya Revenue Authority (KRA)', tags: ['Government', 'Tax'] },
    { name: 'NHIF (SHIF)', tags: ['Government', 'Insurance'] },
    { name: 'NSSF', tags: ['Government', 'Pension'] },
    { name: 'Jumia Kenya', tags: ['Online Shopping'] },
    { name: 'Kilimall', tags: ['Online Shopping'] },
    { name: 'Java House', tags: ['Food', 'Restaurant'] },
    { name: 'Artcaffe', tags: ['Food', 'Restaurant'] },
    { name: 'CJ\'s', tags: ['Food', 'Restaurant'] },
    { name: 'KFC', tags: ['Food', 'Restaurant'] },
    { name: 'Galitos', tags: ['Food', 'Restaurant'] },
    { name: 'Pizza Inn', tags: ['Food', 'Restaurant'] },
    { name: 'Text Book Centre', tags: ['Stationery', 'Books'] },
    { name: 'Hotpoint Appliances', tags: ['Electronics', 'Home'] },
    { name: 'Uber', tags: ['Transport', 'Taxi'] },
    { name: 'Bolt', tags: ['Transport', 'Taxi'] },
    { name: 'Glovo', tags: ['Delivery', 'Food'] },
    { name: 'Chowdeck', tags: ['Delivery', 'Food'] },
];

async function main() {
    console.log('🇰🇪 Seeding Common Kenyan Suppliers...');

    // Get all tenants
    const tenants = await prisma.tenant.findMany();

    if (tenants.length === 0) {
        console.log('No tenants found. Please create a tenant first.');
        return;
    }

    for (const tenant of tenants) {
        console.log(`\n📦 Processing Tenant: ${tenant.name} (${tenant.id})`);

        for (const supplier of COMMON_SUPPLIERS) {
            // Check if vendor already exists to avoid duplicates
            const existingVendor = await prisma.vendor.findFirst({
                where: {
                    tenantId: tenant.id,
                    name: supplier.name
                }
            });

            if (!existingVendor) {
                // Prepare tags logic
                const tagsConnect = supplier.tags.map(tag => ({
                    where: {
                        tenantId_name: {
                            tenantId: tenant.id,
                            name: tag
                        }
                    },
                    create: {
                        tenantId: tenant.id,
                        name: tag
                    }
                }));

                await prisma.vendor.create({
                    data: {
                        tenantId: tenant.id,
                        name: supplier.name,
                        isActive: true,
                        paymentTerms: 'Immediate',
                        tags: {
                            connectOrCreate: tagsConnect
                        },
                        stats: {
                            create: {
                                totalPurchases: 0,
                                totalPaid: 0
                            }
                        }
                    }
                });
                console.log(`   ✅ Added: ${supplier.name}`);
            } else {
                console.log(`   ⏭️  Skipped: ${supplier.name} (Already exists)`);
            }
        }
    }

    console.log('\n✨ Supplier Seeding Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
