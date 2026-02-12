import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRegistration() {
    try {
        console.log('\n🧪 TESTING AUTO-SEEDING ON REGISTRATION\n');
        console.log('='.repeat(70));

        // Create a test tenant to simulate registration
        const testTenant = await prisma.tenant.create({
            data: {
                name: 'Test Company',
                slug: 'test-company-' + Date.now(),
                ownerEmail: 'test@test.com',
                tenantType: 'BUSINESS'
            }
        });

        console.log(`\n✅ Test Tenant Created: ID = ${testTenant.id}\n`);

        // Import seeding functions (simulating what authController does)
        const { seedVATRates, seedDefaultSuppliers } = await import('./src/services/accountingService.js');

        // Test VAT Rates seeding
        console.log('📊 Testing VAT Rates Seeding...');
        try {
            await seedVATRates(testTenant.id);
            const vatRates = await prisma.vatRate.findMany({
                where: { tenantId: testTenant.id }
            });
            console.log(`   ✅ Found ${vatRates.length} VAT rates:`);
            vatRates.forEach(vat => {
                console.log(`      - ${vat.name} (Code: ${vat.code}, Rate: ${vat.rate}%)`);
            });
        } catch (vatError) {
            console.log(`   ❌ VAT Seeding Failed:`, vatError.message);
        }

        // Test Suppliers seeding
        console.log('\n📦 Testing Suppliers Seeding...');
        try {
            await seedDefaultSuppliers(testTenant.id);
            const suppliers = await prisma.vendor.findMany({
                where: { tenantId: testTenant.id }
            });
            console.log(`   ✅ Found ${suppliers.length} suppliers:`);
            suppliers.forEach(supplier => {
                console.log(`      - ${supplier.name}`);
            });
        } catch (supplierError) {
            console.log(`   ❌ Supplier Seeding Failed:`, supplierError.message);
        }

        // Cleanup - delete test tenant
        console.log('\n🧹 Cleaning up test data...');
        await prisma.vendor.deleteMany({ where: { tenantId: testTenant.id } });
        await prisma.vatRate.deleteMany({ where: { tenantId: testTenant.id } });
        await prisma.tenant.delete({ where: { id: testTenant.id } });
        console.log('   ✅ Test data removed');

        console.log('\n' + '='.repeat(70));
        console.log('✅ AUTO-SEEDING TEST COMPLETE!\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testRegistration();
