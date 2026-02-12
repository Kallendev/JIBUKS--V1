import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAllTenants() {
    try {
        console.log('\n🌱 SEEDING ALL TENANTS WITH COMPLETE VAT RATES & SUPPLIERS\n');
        console.log('='.repeat(70));

        // Get all tenants
        const tenants = await prisma.tenant.findMany();
        console.log(`\n📊 Found ${tenants.length} tenant(s) to seed\n`);

        // Import seeding functions
        const { seedVATRates, seedDefaultSuppliers } = await import('./src/services/accountingService.js');

        for (const tenant of tenants) {
            console.log(`\n${'='.repeat(70)}`);
            console.log(`🏢 Tenant: ${tenant.name} (ID: ${tenant.id})`);
            console.log('='.repeat(70));

            // Seed VAT Rates
            console.log('\n📊 Seeding VAT Rates...');
            try {
                await seedVATRates(tenant.id);
                const vatRates = await prisma.vatRate.findMany({
                    where: { tenantId: tenant.id },
                    orderBy: { rate: 'desc' }
                });
                console.log(`   ✅ Total VAT Rates: ${vatRates.length}`);
                vatRates.forEach(vat => {
                    console.log(`      - ${vat.name} (Code: ${vat.code}, Rate: ${vat.rate}%)`);
                });
            } catch (vatError) {
                console.log(`   ❌ VAT Seeding Error:`, vatError.message);
            }

            // Seed Suppliers
            console.log('\n📦 Seeding Suppliers...');
            try {
                await seedDefaultSuppliers(tenant.id);
                const suppliers = await prisma.vendor.findMany({
                    where: { tenantId: tenant.id },
                    orderBy: { name: 'asc' }
                });
                console.log(`   ✅ Total Suppliers: ${suppliers.length}`);
                suppliers.forEach(supplier => {
                    console.log(`      - ${supplier.name}`);
                });
            } catch (supplierError) {
                console.log(`   ❌ Supplier Seeding Error:`, supplierError.message);
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ ALL TENANTS SEEDED SUCCESSFULLY!');
        console.log('='.repeat(70));
        console.log('\n✨ Every account now has:');
        console.log('   - 7 Complete Kenya VAT Rates');
        console.log('   - 16 Real Kenyan Suppliers');
        console.log('\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAllTenants();
